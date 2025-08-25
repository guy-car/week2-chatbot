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
  input: string;
  reasoning: { effort: 'low' | 'medium' | 'high' };
  text: { verbosity: 'low' | 'medium' | 'high' };
  previous_response_id?: string;
};

type ResponsesSuccess = {
  id: string;
  output_text?: string;
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

  // Stage 2: decide mode first (strict JSON)
  const decisionInstruction = `Decide response mode. Return ONLY this JSON and nothing else: {"mode":"A|B","reason":"<160 chars>"}.`;
  const decisionPayload: ResponsesRequest = {
    model: 'gpt-5',
    input: `${decisionInstruction}\n\nUSER:\n${lastUser.content}`,
    reasoning: { effort: 'low' },
    text: { verbosity: 'low' },
    ...(lastResponseId ? { previous_response_id: lastResponseId } : {})
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
    const json = JSON.parse(decisionText) as unknown;
    const validated = DecideModeSchema.parse(json);
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

    const planInstruction = `Plan up to 3 recommendations with short intro. Use INPUT strictly. Return ONLY JSON: {"intro":"...","picks":[{"title":"string","year":1234,"reason":"string"}]}`;
    const planInput = {
      blocked,
      tasteProfileSummary,
    };

    const planPayload: ResponsesRequest = {
      model: 'gpt-5',
      input: `${planInstruction}\n\nINPUT:\n${JSON.stringify(planInput)}`,
      reasoning: { effort: 'low' },
      text: { verbosity: 'low' },
      ...(lastResponseId ? { previous_response_id: lastResponseId } : {})
    };

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
    const planText: string = planParsed?.output_text ?? '';

    let intro = '';
    let picks: { title: string; year: number; reason: string }[] = [];
    try {
      const json = JSON.parse(planText) as unknown;
      const validated = PlanPicksOutputSchema.parse(json);
      intro = validated.intro;
      picks = validated.picks.slice(0, 3);
    } catch {
      console.warn('[FLOW] ❌ plan_picks parse/validate failed, returning no text');
      return new Response(JSON.stringify({ text: '', mode: 'B' as const }), { headers: { 'Content-Type': 'application/json' } });
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


