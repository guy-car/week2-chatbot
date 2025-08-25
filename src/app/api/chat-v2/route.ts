import { headers } from "next/headers";
import { auth } from "~/lib/auth";
import { db } from "~/server/db";
import { chats, messages as messagesTable } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { saveChat, loadChat } from "tools/chat-store";
import { type Message } from 'ai';
import { DecideModeSchema, PlanPicksOutputSchema, type MovieData } from '~/app/types';
import { tasteProfileServerService } from "~/server/services/taste-profile";
import { listChatRecommendations, addChatRecommendation } from "~/server/db/chat-recommendations";
import { getUserBlockedList } from "~/server/services/blocked-list";
import { lookupBestByTitleYear } from "~/server/services/tmdb";

type ResponsesRequest = {
  model: string;
  input: string | Array<{ role: 'developer' | 'user'; content: Array<{ type: 'input_text'; text: string }> }>;
  reasoning: { effort: 'low' | 'medium' | 'high' };
  text: { verbosity: 'low' | 'medium' | 'high'; format?: unknown };
  previous_response_id?: string;
};

type ResponsesSuccess = {
  id: string;
  output_text?: string;
  output_parsed?: unknown;
};

export const maxDuration = 30;

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

  // Threading: read lastResponseId for this chat
  const chatRow = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1);
  const lastResponseId = chatRow[0]?.lastResponseId ?? undefined;

  // Stage 2: decide mode first (strict JSON) with explicit rules and few-shot
  const decisionInstruction = `You are a mode decider. Return ONLY JSON: {"mode":"A|B","reason":"<160 chars>"}.

Definitions:
- Mode A: Conversational reply. No recommendations, no planning, no tools.
- Mode B: Recommendation planning. Do NOT produce user-visible text; a separate step will plan picks.

Rules:
- If the user asks for recommendations, a list, "give me X", "suggest", "top/best", "pick(s)", or names a genre/title and wants similar → mode=B.
- If the user asks for opinions, explanations, summaries, small talk, or profile discussion without asking for recommendations → mode=A.
- If mixed/ambiguous, prefer mode=A and clarify with USER what the intent is

Examples:
USER: "Recommend 3 underrated neo-noir movies from the 2010s."
→ {"mode":"B","reason":"User asked for three recommendations"}

USER: "Suggest some animated sci‑fi TV shows like Futurama."
→ {"mode":"B","reason":"Explicit recommendation request"}

USER: "What makes neo‑noir different from classic noir?"
→ {"mode":"A","reason":"Explanation; no recommendations requested"}

USER: "Hey Genie how is it going?"
→ {"mode":"A","reason":"Explanation; no recommendations requested"}

USER: "I liked Drive and Nightcrawler."
→ {"mode":"B","reason":"States likes; implies similar picks"}`;
  const decisionPayload: ResponsesRequest = {
    model: 'gpt-5',
    input: [
      { role: 'developer', content: [{ type: 'input_text', text: decisionInstruction }] },
      { role: 'user', content: [{ type: 'input_text', text: lastUser.content }] },
    ],
    reasoning: { effort: 'low' },
    text: { verbosity: 'low' },
    ...(lastResponseId ? { previous_response_id: lastResponseId } : {})
  };
  // Enforce structured output under text.format using JSON Schema
  (decisionPayload.text).format = {
    type: 'json_schema',
    name: 'decide_mode',
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        mode: { type: 'string', enum: ['A','B'] },
        reason: { type: 'string', maxLength: 160 },
      },
      required: ['mode','reason']
    },
    strict: true,
  };

  const decisionRes = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(decisionPayload)
  });

  if (!decisionRes.ok) {
    const errText = await decisionRes.text();
    console.error('[FLOW] ❌ chat-v2 decide_mode error', errText);
    return new Response(JSON.stringify({ error: 'openai_error', detail: errText }), { status: 502 });
  }

  const decisionData: unknown = await decisionRes.json();
  const decisionParsed = (decisionData && typeof decisionData === 'object') ? decisionData as ResponsesSuccess : undefined;
  const decisionText: string = decisionParsed?.output_text ?? '';
  let mode: 'A' | 'B' = 'A';
  let decisionReason = '';
  try {
    const raw = decisionParsed?.output_parsed as unknown;
    let candidate: unknown = raw;
    if (!candidate && decisionText) {
      candidate = JSON.parse(decisionText) as unknown;
    }
    const validated = DecideModeSchema.parse(candidate);
    mode = validated.mode;
    decisionReason = validated.reason;
  } catch {
    console.warn('[FLOW] ❌ decide_mode parse/validate failed; defaulting to A');
  }

  console.log('[FLOW] decide_mode:', { mode, reason: decisionReason });

  // If Mode B: plan picks (Stage 3)
  if (mode === 'B') {
    // Gather inputs: tasteProfile, blocked (chat + user lists)
    let tasteProfileSummary = '';
    try {
      const session = await auth.api.getSession({ headers: await headers() });
      if (session?.user?.id) {
        const profile = await tasteProfileServerService.getProfileForChat(session.user.id, db);
        tasteProfileSummary = tasteProfileServerService.generateSummary(profile).slice(0, 600);
      }
    } catch {
      console.warn('[FLOW] tasteProfile error, continuing without');
    }

    const chatBlocked = await listChatRecommendations(chatId);
    let userBlocked: { id_tmdb: number; media_type: 'movie'|'tv'; title: string; year: number }[] = [];
    try {
      const session = await auth.api.getSession({ headers: await headers() });
      if (session?.user?.id) {
        userBlocked = await getUserBlockedList(session.user.id);
      }
    } catch {}

    const blocked = [
      ...chatBlocked.map(b => ({ id_tmdb: b.id_tmdb, media_type: b.media_type, title: b.title, year: b.year })),
      ...userBlocked,
    ];

    const planInstruction = `You are planning recommendations. Use INPUT as constraints.

Output format (STRICT): JSON only. No prose. No markdown. No code fences. Must match exactly:
{"intro":"string (<=160 chars)","picks":[{"title":"string","year":1234,"reason":"string"}]}

Rules:
- you MUST Avoid any items present in INPUT.blocked by title and year intent
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
    const planInput = { blocked, tasteProfileSummary };

    const planPayload: ResponsesRequest = {
      model: 'gpt-5',
      input: [
        { role: 'developer', content: [{ type: 'input_text', text: planInstruction }] },
        { role: 'user', content: [{ type: 'input_text', text: `INPUT:\n${JSON.stringify(planInput)}` }] },
      ],
      reasoning: { effort: 'low' },
      text: { verbosity: 'low' },
      ...(lastResponseId ? { previous_response_id: lastResponseId } : {})
    };
    (planPayload.text).format = {
      type: 'json_schema',
      name: 'plan_picks',
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          intro: { type: 'string' },
          picks: {
            type: 'array',
            minItems: 1,
            maxItems: 3,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                title: { type: 'string' },
                year: { type: 'number' },
                reason: { type: 'string' },
              },
              required: ['title','year','reason']
            }
          }
        },
        required: ['intro','picks']
      },
      strict: true,
    };

    {
      const CYAN = '\x1b[36m';
      const RESET = '\x1b[0m';
      try {
        console.log(`${CYAN}🧾 [PLAN_REQ_TEXT]${RESET}`, JSON.stringify(planPayload.text));
      } catch {}
    }

    const planRes = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(planPayload)
    });

    if (!planRes.ok) {
      const errText = await planRes.text();
      console.error('[FLOW] ❌ chat-v2 plan_picks error', errText);
      return new Response(JSON.stringify({ error: 'openai_error', detail: errText }), { status: 502 });
    }

    const planData: unknown = await planRes.json();
    const planParsed = (planData && typeof planData === 'object') ? planData as ResponsesSuccess : undefined;
    {
      const anyPlan = planData as any;
      // Temporary debug: log structure of plan response
      // Colors
      const CYAN = '\x1b[36m';
      const YELLOW = '\x1b[33m';
      const RESET = '\x1b[0m';
      try {
        console.log(`${CYAN}🧪 [PLAN_KEYS]${RESET}`, anyPlan ? Object.keys(anyPlan) : []);
        if (Array.isArray(anyPlan?.output)) {
          console.log(`${YELLOW}📦 [PLAN_OUTPUT]${RESET}`, anyPlan.output.map((o: any) => ({ type: o?.type, role: o?.role, status: o?.status, contentTypes: Array.isArray(o?.content) ? o.content.map((c: any) => c?.type) : undefined })));
          const firstJson = anyPlan.output?.[0]?.content?.find((c: any) => c?.type === 'output_json' || c?.type === 'json')?.json;
          if (firstJson) console.log(`${YELLOW}📝 [PLAN_OUTPUT_JSON_SAMPLE]${RESET}`, JSON.stringify(firstJson).slice(0, 600));
        } else {
          console.log(`${YELLOW}📦 [PLAN_OUTPUT]${RESET}`, 'no output array');
        }
        if (anyPlan?.output_parsed) {
          console.log(`${CYAN}🧾 [PLAN_OUTPUT_PARSED]${RESET}`, JSON.stringify(anyPlan.output_parsed).slice(0, 600));
        } else {
          console.log(`${CYAN}🧾 [PLAN_OUTPUT_PARSED]${RESET}`, 'none');
        }
        const ot = anyPlan?.output_text ?? '';
        console.log(`${CYAN}✂️  [PLAN_OUTPUT_TEXT_LEN]${RESET}`, typeof ot === 'string' ? ot.length : 0);
      } catch (e) {
        console.log('⚠️ [PLAN_DEBUG_LOG_ERROR]', e);
      }
    }
    const planText: string = planParsed?.output_text ?? '';

    let intro = '';
    let picks: { title: string; year: number; reason: string }[] = [];
    try {
      const raw = planParsed?.output_parsed as unknown;
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

    // Dedup by blocked ids after TMDB lookup
    const blockedKey = new Set(blocked.map(b => `${b.media_type}:${b.id_tmdb}`));

    // TMDB lookup helper
    const tmdbLookup = (t: string, y?: number) => lookupBestByTitleYear(t, y);

    const accepted: MovieData[] = [];
    for (const p of picks) {
      const found = await tmdbLookup(p.title, p.year);
      if (!found) continue;
      const key = `${found.media_type}:${found.id}`;
      if (blockedKey.has(key)) continue;
      accepted.push(found);
      // persist to chat_recommendations
      await addChatRecommendation({ chatId, id_tmdb: found.id, media_type: found.media_type, title: found.title, year: Number((found.release_date ?? '').slice(0,4)) || p.year });
      blockedKey.add(key);
    }

    // Persist assistant intro + tool results to messages
    const asstId = `asst_${Date.now()}`;
    await db.insert(messagesTable).values({
      id: asstId,
      chatId,
      role: 'assistant',
      content: intro,
      toolResults: accepted,
    });

    const elapsedB = Date.now() - startedAt;
    console.log('[FLOW] chat-v2 end (mode B planned)', { ms: elapsedB, picks: accepted.length });
    return new Response(JSON.stringify({ text: intro, mode: 'B' as const, picks: accepted }), { headers: { 'Content-Type': 'application/json' } });
  }

  // Mode A: generate conversational text
  const requestPayload: ResponsesRequest = {
    model: 'gpt-5',
    input: lastUser.content,
    reasoning: { effort: 'low' },
    text: { verbosity: 'low' },
    ...(lastResponseId ? { previous_response_id: lastResponseId } : {})
  };

  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestPayload)
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('[FLOW] ❌ chat-v2 text error', errText);
    return new Response(JSON.stringify({ error: 'openai_error', detail: errText }), { status: 502 });
  }

  const data: unknown = await res.json();
  const parsed = (data && typeof data === 'object') ? data as ResponsesSuccess : undefined;
  const outputText: string = parsed?.output_text ?? '';
  const responseId: string | undefined = parsed?.id ?? undefined;

  // If A produced empty text, treat as misclassification and fall back to planning (B)
  if (!outputText || outputText.trim().length === 0) {
    console.log('[FLOW] A produced empty text → falling back to B planning');
    // Re-run logic as if mode B
    // Gather inputs: tasteProfile, blocked (chat + user lists)
    let tasteProfileSummary = '';
    try {
      const session = await auth.api.getSession({ headers: await headers() });
      if (session?.user?.id) {
        const profile = await tasteProfileServerService.getProfileForChat(session.user.id, db);
        tasteProfileSummary = tasteProfileServerService.generateSummary(profile).slice(0, 600);
      }
    } catch {
      console.warn('[FLOW] tasteProfile error, continuing without');
    }

    const chatBlocked = await listChatRecommendations(chatId);
    let userBlocked: { id_tmdb: number; media_type: 'movie'|'tv'; title: string; year: number }[] = [];
    try {
      const session = await auth.api.getSession({ headers: await headers() });
      if (session?.user?.id) {
        userBlocked = await getUserBlockedList(session.user.id);
      }
    } catch {}

    const blocked = [
      ...chatBlocked.map(b => ({ id_tmdb: b.id_tmdb, media_type: b.media_type, title: b.title, year: b.year })),
      ...userBlocked,
    ];

    const planInstruction = `You are planning recommendations. Use INPUT as constraints.

Output format (STRICT): JSON only. No prose. No markdown. No code fences. Must match exactly:
{"intro":"string (<=160 chars)","picks":[{"title":"string","year":1234,"reason":"string"}]}

Rules:
- picks length 1..3
- title: exact canonical title (no quotes, no year in title)
- year: 4-digit number only
- reason: 1 short sentence on fit (<=160 chars)
- Avoid any items present in INPUT.blocked by title and year intent
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
    const planInput = { blocked, tasteProfileSummary };
    const planPayload: ResponsesRequest = {
      model: 'gpt-5',
      input: [
        { role: 'developer', content: [{ type: 'input_text', text: planInstruction }] },
        { role: 'user', content: [{ type: 'input_text', text: `INPUT:\n${JSON.stringify(planInput)}` }] },
      ],
      reasoning: { effort: 'medium' },
      text: { verbosity: 'low' },
      ...(lastResponseId ? { previous_response_id: lastResponseId } : {})
    };
    (planPayload.text).format = {
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
    };

    const planRes = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(planPayload)
    });
    if (!planRes.ok) {
      const errText = await planRes.text();
      console.error('[FLOW] ❌ chat-v2 plan_picks error', errText);
      return new Response(JSON.stringify({ error: 'openai_error', detail: errText }), { status: 502 });
    }
    const planData: unknown = await planRes.json();
    const planParsed = (planData && typeof planData === 'object') ? planData as ResponsesSuccess : undefined;
    {
      const anyPlan = planData as any;
      const CYAN = '\x1b[36m';
      const YELLOW = '\x1b[33m';
      const RESET = '\x1b[0m';
      try {
        console.log(`${CYAN}🧪 [PLAN_KEYS]${RESET}`, anyPlan ? Object.keys(anyPlan) : []);
        if (Array.isArray(anyPlan?.output)) {
          console.log(`${YELLOW}📦 [PLAN_OUTPUT]${RESET}`, anyPlan.output.map((o: any) => ({ type: o?.type, role: o?.role, status: o?.status, contentTypes: Array.isArray(o?.content) ? o.content.map((c: any) => c?.type) : undefined })));
          const firstJson = anyPlan.output?.[0]?.content?.find((c: any) => c?.type === 'output_json' || c?.type === 'json')?.json;
          if (firstJson) console.log(`${YELLOW}📝 [PLAN_OUTPUT_JSON_SAMPLE]${RESET}`, JSON.stringify(firstJson).slice(0, 600));
        } else {
          console.log(`${YELLOW}📦 [PLAN_OUTPUT]${RESET}`, 'no output array');
        }
        if (anyPlan?.output_parsed) {
          console.log(`${CYAN}🧾 [PLAN_OUTPUT_PARSED]${RESET}`, JSON.stringify(anyPlan.output_parsed).slice(0, 600));
        } else {
          console.log(`${CYAN}🧾 [PLAN_OUTPUT_PARSED]${RESET}`, 'none');
        }
        const ot = anyPlan?.output_text ?? '';
        console.log(`${CYAN}✂️  [PLAN_OUTPUT_TEXT_LEN]${RESET}`, typeof ot === 'string' ? ot.length : 0);
      } catch (e) {
        console.log('⚠️ [PLAN_DEBUG_LOG_ERROR]', e);
      }
    }
    const planText: string = planParsed?.output_text ?? '';
    let intro = '';
    let picks: { title: string; year: number; reason: string }[] = [];
    try {
      const raw = planParsed?.output_parsed as unknown;
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

    const blockedKey = new Set(blocked.map(b => `${b.media_type}:${b.id_tmdb}`));
    const accepted: MovieData[] = [];
    for (const p of picks) {
      const found = await lookupBestByTitleYear(p.title, p.year);
      if (!found) continue;
      const key = `${found.media_type}:${found.id}`;
      if (blockedKey.has(key)) continue;
      accepted.push(found);
      await addChatRecommendation({ chatId, id_tmdb: found.id, media_type: found.media_type, title: found.title, year: Number((found.release_date ?? '').slice(0,4)) || p.year });
      blockedKey.add(key);
    }
    const asstId = `asst_${Date.now()}`;
    await db.insert(messagesTable).values({ id: asstId, chatId, role: 'assistant', content: intro, toolResults: accepted });
    const elapsedB = Date.now() - startedAt;
    console.log('[FLOW] chat-v2 end (fallback to mode B planned)', { ms: elapsedB, picks: accepted.length });
    return new Response(JSON.stringify({ text: intro, mode: 'B' as const, picks: accepted }), { headers: { 'Content-Type': 'application/json' } });
  }

  // Persist messages (Mode A only: assistant text)
  const userMsg: Message = { id: lastUser.id, role: 'user', content: lastUser.content } as Message;
  const assistantMsg: Message = { id: `asst_${Date.now()}`, role: 'assistant', content: outputText } as Message;
  await saveChat({ id: chatId, messages: [...previousMessages, userMsg, assistantMsg] });

  if (responseId) {
    await db.update(chats).set({ lastResponseId: responseId }).where(eq(chats.id, chatId));
  }

  const elapsed = Date.now() - startedAt;
  console.log('[FLOW] chat-v2 end', { ms: elapsed, responseId, mode: 'A' });

  return new Response(JSON.stringify({ text: outputText, mode: 'A' as const }), {
    headers: { 'Content-Type': 'application/json' }
  });
}


