import { headers } from "next/headers";
import { auth } from "~/lib/auth";
import { db } from "~/server/db";
import { chats, messages as messagesTable } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { saveChat, loadChat } from "tools/chat-store";
import { type Message, appendResponseMessages } from 'ai';
import { streamText } from 'ai';
import { openai as aiSDKOpenAI } from '@ai-sdk/openai';
import { DecideModeSchema, PlanPicksOutputSchema, type MovieData } from '~/app/types';
import { tasteProfileService } from "~/app/_services/tasteProfile";
import { listChatRecommendations, addChatRecommendation } from "~/server/db/chat-recommendations";
import { getUserBlockedList } from "~/server/services/blocked-list";
import { lookupBestByTitleYear } from "~/server/services/tmdb";
import OpenAI from 'openai';

export const maxDuration = 30;

// Shared planning instruction (Structured Outputs via json_schema)
const planInstruction = `You are planning recommendations. Use INPUT as constraints.

INPUT fields:
- blocked: items to avoid (titles/years already suggested or on user lists)
- tasteProfileSummary: concise summary of user's tastes
- userRequest: the latest user request in natural language; tailor genres, tone, era, and specificity to this

Output format (STRICT): JSON only. No prose. No markdown. No code fences. Must match exactly:
{"intro":"string (<=160 chars)","picks":[{"title":"string","year":1234,"reason":"string"}]}

Rules:
- you MUST avoid any items present in INPUT.blocked by title and year intent
- you MUST honor INPUT.userRequest (topic/genre/constraints); do not ignore it
- up to 3 picks maximum
- title: exact canonical title (no quotes, no year in title)
- year: 4-digit number only
- reason: 1 short sentence which answers the question "why it's right for the user", this must demonstrate consideration for the user's taste (<=160 chars)
- Keep intro short (<=160 chars). Do not include lists, bullets, or extra text

Examples (INPUT → OUTPUT):
INPUT:
{"blocked":[{"id_tmdb":603,"media_type":"movie","title":"The Matrix","year":1999}],"tasteProfileSummary":"Likes cerebral sci‑fi and stylish action"}
OUTPUT:
{"intro":"Smart, stylish sci‑fi that leans cerebral without losing momentum.","picks":[{"title":"Equilibrium","year":2002,"reason":"Gun‑kata action with authoritarian themes and sleek aesthetic."},{"title":"Dark City","year":1998,"reason":"Reality‑bending noir tone with strong cerebral mystery."},{"title":"Upgrade","year":2018,"reason":"Visceral tech‑noir with clever body‑hacking premise."}]}

INPUT:
{"blocked":[{"id_tmdb":49026,"media_type":"movie","title":"The Dark Knight Rises","year":2012}],"tasteProfileSummary":"Enjoys grounded crime dramas and neo‑noir"}
OUTPUT:
{"intro":"Gritty neo‑noir with grounded crime stakes and strong atmosphere.","picks":[{"title":"A Most Violent Year","year":2014,"reason":"Slow‑burn crime ethics with moody, wintry noir tone."},{"title":"Blue Ruin","year":2013,"reason":"Lean revenge noir with grounded tension and minimalism."},{"title":"Cold in July","year":2014,"reason":"Texas‑set crime spiral with pulpy neo‑noir energy."}]}

INPUT:
{"blocked":[{"id_tmdb":64686,"media_type":"tv","title":"True Detective","year":2014}],"tasteProfileSummary":"Likes bleak atmosphere and moral ambiguity"}
OUTPUT:
{"intro":"Bleak, morally ambiguous crime stories with slow‑burn tension.","picks":[{"title":"The Night Of","year":2016,"reason":"Procedural unraveling with heavy mood and character focus."},{"title":"Top of the Lake","year":2013,"reason":"Remote setting, dark secrets, and patient investigative pace."}]}`;

// Mode A (conversational) instruction
const modeAInstruction = `
You are Watch Genie, a friendly movie and TV guide.

Style:
- Concise, warm, and natural — like a friend who knows cinema well.
- Add a subtle touch of personality: curious, lightly witty, or affectionate about film, but never over-the-top.
- No emojis, hype, or exclamation marks.
- no markdown, special formatting, or quotes around titles. Write titles in plain text.
- Default to 1–3 polished sentences unless the user explicitly asks for detail.

Behavior:
- Answer conversational questions directly and relevantly.
- IMPORTANT: Do not generate recommendations in this mode; if the user requests them, the system will handle that separately.
- Avoid lists or structured answers unless the user requests them.
- If ambiguity exists, ask a brief clarifying question (“Do you mean the 1977 Suspiria or the 2018 remake?”).

Clarifications:
- Ask at most one clarifying question, and only if you cannot reasonably answer otherwise.
- If confident, proceed with your best assumption and note it briefly (“Assuming you meant the 1995 version…”).

Constraints:
- Do not recommend movies or TV shows in this mode.
- No tool/metadata chatter — surface only what’s relevant to the user’s query.
- Do not show your reasoning steps — just deliver the polished answer.
- Do not use markdown or special formatting: no italics, asterisks, or quotes around titles. Write titles in plain text.

---

# Examples (tone + subtle personality)

User: Who directed Heat?  
Assistant: That would be Michael Mann — his 1995 Heat is a cornerstone of modern crime cinema.

User: Is Blade Runner streaming anywhere?  
Assistant: I don’t have live streaming info here, but I can tell you it’s widely available on major platforms. Want me to share the basics about the film instead?

User: Tell me about Suspiria.  
Assistant: There are two films with that title: Dario Argento’s haunting 1977 original and Luca Guadagnino’s unsettling 2018 reimagining. Which one are you curious about?

User: What’s your favorite crime show?  
Assistant: I don’t play favorites, but I can’t help admiring how The Wire set the bar for gritty, layered storytelling on TV. It’s still a touchstone for the genre.
`;


// Safe access helpers to avoid any-casts from SDK responses
function getResponseText(res: unknown): string {
  const r = res as { output_text?: unknown };
  return typeof r?.output_text === 'string' ? r.output_text : '';
}

function getResponseParsed(res: unknown): unknown {
  const r = res as { output_parsed?: unknown };
  return r?.output_parsed;
}

function getResponseId(res: unknown): string | undefined {
  const r = res as { id?: unknown };
  return typeof r?.id === 'string' ? r.id : undefined;
}

// (removed unused streaming helpers)

export async function POST(req: Request) {
  const startedAt = Date.now();
  console.log('🚀 [FLOW] chat-v2 start', new Date(startedAt).toISOString());

  const body = await req.json() as { messages: Message[]; id: string };
  const { messages: incomingMessages, id: chatId } = body;

  if (!incomingMessages?.length) {
    return new Response(JSON.stringify({ error: 'No message provided' }), { status: 400 });
  }

  const previousMessages = await loadChat(chatId);
  const lastUser = incomingMessages.filter(m => m.role === 'user').pop();
  if (!lastUser || typeof lastUser.content !== 'string' || lastUser.content.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'No user message found' }), { status: 400 });
  }

  // Persist the latest user message immediately so it survives refreshes
  try {
    const existing = await db.select({ id: messagesTable.id }).from(messagesTable).where(eq(messagesTable.id, lastUser.id)).limit(1);
    if (existing.length === 0) {
      await db.insert(messagesTable).values({
        id: lastUser.id,
        chatId,
        role: 'user',
        content: lastUser.content,
        toolResults: null,
      }).onConflictDoNothing();
    }
  } catch (err) {
    console.warn('[FLOW] warn: failed to persist user message early', err);
  }

  // Threading: read lastResponseId for this chat
  const chatRow = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1);
  const lastResponseId = chatRow[0]?.lastResponseId ?? undefined;

  // Official OpenAI SDK client
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Stage 2: decide mode first (strict JSON) with explicit rules and few-shot
  const decideStartedAt = Date.now();
  const decideResponse = await openai.responses.create({
    model: 'gpt-4o-mini-2024-07-18',
    input: [
      { role: 'developer', content: [{ type: 'input_text', text: 'Classify the USER message as A or B. Output a single character: A or B. A = conversational (no recommendations). B = recommendation planning. No extra text.' }] },
      { role: 'user', content: [{ type: 'input_text', text: lastUser.content }] },
    ],
    text: {
      verbosity: 'medium'
    },
    max_output_tokens: 16,
    ...(lastResponseId ? { previous_response_id: lastResponseId } as Record<string, unknown> : {})
  });
  const t_decide_mode = Date.now() - decideStartedAt;

  const decisionText: string = getResponseText(decideResponse);
  let mode: 'A' | 'B' = 'A';
  let decisionReason = '';
  // Fast path: plain single-character output
  const ch = (decisionText || '').trim().toUpperCase()[0];
  if (ch === 'A' || ch === 'B') {
    mode = ch;
  } else {
    // Fallback: attempt old JSON schema parsing if model emitted JSON
    try {
      const raw = getResponseParsed(decideResponse);
      let candidate: unknown = raw;
      if (!candidate && decisionText) {
        candidate = JSON.parse(decisionText) as unknown;
      }
      const validated = DecideModeSchema.parse(candidate);
      mode = validated.mode;
      decisionReason = validated.reason;
    } catch {
      console.warn('[FLOW] ❌ decide_mode parse failed; defaulting to A');
    }
  }

  console.log('[FLOW] decide_mode:', { mode, reason: decisionReason, t_decide_mode });

  // If Mode B: plan picks (Stage 3)
  if (mode === 'B') {
    // timings
    let t_read_profile = 0;
    let t_read_blocked = 0;
    let t_plan_picks = 0;
    let t_tmdb_lookups_total = 0;
    let t_db_writes = 0;
    // Gather inputs: tasteProfile, blocked (chat + user lists)
    let tasteProfileSummary = '';
    try {
      const _tp0 = Date.now();
      const session = await auth.api.getSession({ headers: await headers() });
      if (session?.user?.id) {
        const profile = await tasteProfileService.getProfileForChat(session.user.id, db);
        tasteProfileSummary = tasteProfileService.generateSummary(profile).slice(0, 600);
      }
      t_read_profile = Date.now() - _tp0;
    } catch {
      console.warn('[FLOW] tasteProfile error, continuing without');
      // keep t_read_profile as measured until error
    }

    const _tb0 = Date.now();
    const chatBlocked = await listChatRecommendations(chatId);
    let userBlocked: { id_tmdb: number; media_type: 'movie'|'tv'; title: string; year: number }[] = [];
    try {
      const session = await auth.api.getSession({ headers: await headers() });
      if (session?.user?.id) {
        userBlocked = await getUserBlockedList(session.user.id);
      }
    } catch {}
    t_read_blocked = Date.now() - _tb0;

    const blocked = [
      ...chatBlocked.map(b => ({ id_tmdb: b.id_tmdb, media_type: b.media_type, title: b.title, year: b.year })),
      ...userBlocked,
    ];

    // use shared planInstruction and include the user's latest request for steering
    const planInput = { blocked, tasteProfileSummary, userRequest: lastUser.content };

    const _tplan0 = Date.now();
    const planResponse = await openai.responses.create({
      model: 'gpt-5-mini-2025-08-07',
      input: [
        { role: 'developer', content: [{ type: 'input_text', text: planInstruction }] },
        { role: 'user', content: [{ type: 'input_text', text: `INPUT:\n${JSON.stringify(planInput)}` }] },
      ],
      reasoning: { effort: 'low' },
      text: {
        verbosity: 'low',
        format: {
          type: 'json_schema',
          name: 'plan_picks',
          schema: {
            type: 'object', additionalProperties: false,
            properties: {
              intro: { type: 'string' },
              picks: { type: 'array', minItems: 1, maxItems: 3, items: {
                type: 'object', additionalProperties: false,
                properties: { title: { type: 'string' }, year: { type: 'number' }, reason: { type: 'string' } },
                required: ['title','year','reason']
              } }
            },
            required: ['intro','picks']
          },
          strict: true,
        }
      },
      ...(lastResponseId ? { previous_response_id: lastResponseId } as Record<string, unknown> : {})
    });
    t_plan_picks = Date.now() - _tplan0;

    const planText: string = getResponseText(planResponse);

    let intro = '';
    let picks: { title: string; year: number; reason: string }[] = [];
    try {
      const raw = getResponseParsed(planResponse);
      let candidate: unknown = raw;
      if (!candidate && planText) {
        candidate = JSON.parse(planText) as unknown;
      }
      const validated = PlanPicksOutputSchema.parse(candidate);
      intro = validated.intro;
      picks = validated.picks.slice(0, 3);
    } catch {
      console.warn('[FLOW] ❌ plan_picks parse/validate failed, returning no text');
      const dbg = planText.slice(0, 1200);
      return new Response(JSON.stringify({ text: '', mode: 'B' as const, debug: { raw: dbg } }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Pretty CLI log of planned intro and picks
    try {
      const DIV = '\x1b[35m' + '────────────────────────────────────────────────' + '\x1b[0m';
      const LABEL = (text: string) => `\x1b[36m${text}\x1b[0m`;
      console.log(DIV);
      console.log(LABEL('general intro'), intro);
      picks.forEach((p, i) => {
        const suffix = String.fromCharCode(65 + i);
        console.log(LABEL(`title ${suffix}`), p.title);
        console.log(LABEL(`year ${suffix}`), p.year);
        console.log(LABEL(`reason ${suffix}`), p.reason);
      });
      console.log(DIV);
    } catch {}

    // Dedup by blocked ids after TMDB lookup
    const blockedKey = new Set(blocked.map(b => `${b.media_type}:${b.id_tmdb}`));
    const _ttmdb0 = Date.now();
    const perPickTimings: Array<{ title: string; year: number; ms: number; found: boolean }> = [];
    const lookupResults = await Promise.all(picks.map(async (p) => {
      const s = Date.now();
      const found = await lookupBestByTitleYear(p.title, p.year);
      const ms = Date.now() - s;
      perPickTimings.push({ title: p.title, year: p.year, ms, found: Boolean(found) });
      return found;
    }));
    const accepted: MovieData[] = [];
    for (let i = 0; i < lookupResults.length; i++) {
      const found = lookupResults[i];
      const p = picks[i]!;
      if (!found) continue;
      const key = `${found.media_type}:${found.id}`;
      if (blockedKey.has(key)) continue;
      // Attach planner reason to the found MovieData so UI can render it
      accepted.push({ ...found, reason: p.reason });
      await addChatRecommendation({ chatId, id_tmdb: found.id, media_type: found.media_type, title: found.title, year: Number((found.release_date ?? '').slice(0,4)) || p.year });
      blockedKey.add(key);
    }
    t_tmdb_lookups_total = Date.now() - _ttmdb0;

    // Persist assistant intro + tool results to messages
    const _tw0 = Date.now();
    const asstId = `asst_${Date.now()}`;
    await db.insert(messagesTable).values({ id: asstId, chatId, role: 'assistant', content: intro, toolResults: accepted });

    // Update threading id from this plan response
    const planRespIdA = getResponseId(planResponse);
    if (planRespIdA) {
      await db.update(chats).set({ lastResponseId: planRespIdA }).where(eq(chats.id, chatId));
    }
    t_db_writes = Date.now() - _tw0;
    const elapsedB = Date.now() - startedAt;
    // Pretty timing summary
    try {
      const MAG = '\x1b[35m';
      const CYA = '\x1b[36m';
      const YEL = '\x1b[33m';
      const RES = '\x1b[0m';
      const pct = (ms: number) => (elapsedB > 0 ? Math.round((ms / elapsedB) * 1000) / 10 : 0);
      console.log(`${MAG}───────────────── TIMINGS (Mode B) ─────────────────${RES}`);
      console.log(`${CYA}total${RES}`, `${elapsedB} ms`);
      console.log(`${CYA}decide_mode${RES}`, `${t_decide_mode} ms (${pct(t_decide_mode)}%)`);
      console.log(`${CYA}read_profile${RES}`, `${t_read_profile} ms (${pct(t_read_profile)}%)`);
      console.log(`${CYA}read_blocked${RES}`, `${t_read_blocked} ms (${pct(t_read_blocked)}%)`);
      console.log(`${CYA}plan_picks${RES}`, `${t_plan_picks} ms (${pct(t_plan_picks)}%)`);
      console.log(`${CYA}tmdb_lookups_total${RES}`, `${t_tmdb_lookups_total} ms (${pct(t_tmdb_lookups_total)}%)`);
      perPickTimings.forEach((r, i) => {
        const suf = String.fromCharCode(65 + i);
        console.log(`${YEL}  tmdb_${suf}${RES}`, `${r.ms} ms`, r.found ? 'found' : 'miss', '-', r.title, r.year);
      });
      console.log(`${CYA}db_writes${RES}`, `${t_db_writes} ms (${pct(t_db_writes)}%)`);
      console.log(`${MAG}──────────────────────────────────────────────────────${RES}`);
    } catch {}
    console.log('[FLOW] chat-v2 end (mode B planned)', { ms: elapsedB, picks: accepted.length });
    return new Response(JSON.stringify({ text: intro, mode: 'B' as const, picks: accepted }), { headers: { 'Content-Type': 'application/json' } });
  }

  // Mode A: prefer streaming conversational text
  console.log('[FLOW] MODE A responding (stream)');
  // Inject taste profile summary when available for conversational context
  let modeATasteProfileSummary = '';
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.id) {
      const profile = await tasteProfileService.getProfileForChat(session.user.id, db);
      modeATasteProfileSummary = tasteProfileService.generateSummary(profile).slice(0, 600);
    }
  } catch {
    // proceed without taste profile
  }

  const systemMessages: Array<{ role: 'system'; content: string }> = [
    { role: 'system', content: modeAInstruction }
  ];
  if (modeATasteProfileSummary) {
    systemMessages.push({ role: 'system', content: `User taste profile: ${modeATasteProfileSummary}` });
  }

  // Use AI SDK streaming instead of broken OpenAI streaming

  const result = streamText({
    model: aiSDKOpenAI('chatgpt-4o-latest'),
    messages: [
      ...systemMessages,
      { role: 'user', content: lastUser.content }
    ],
    temperature: 0.8,
    async onFinish({ response }) {
      try {
        const base = [...previousMessages, lastUser];
        const all = appendResponseMessages({ messages: base, responseMessages: response.messages });
        await saveChat({ id: chatId, messages: all });
        console.log('[FLOW] persisted Mode A via saveChat', { count: all.length });
      } catch {
        console.warn('[FLOW] warn: failed to persist Mode A via saveChat');
      }
    },
  });
  const streamStartedAt = Date.now();
  console.log('[FLOW] A stream start', new Date(streamStartedAt).toISOString());

  // Ensure server-side finish handler runs even if client aborts
  void result.consumeStream();

  // Return the streaming response
  return result.toDataStreamResponse();
}

