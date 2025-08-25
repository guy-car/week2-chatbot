import { db } from "~/server/db";
import { chats } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { saveChat, loadChat } from "tools/chat-store";
import { type Message } from 'ai';

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
  const { messages, id: chatId } = body;

  if (!messages?.length) {
    return new Response(JSON.stringify({ error: 'No message provided' }), { status: 400 });
  }

  const previousMessages = await loadChat(chatId);
  const lastUser = messages.filter(m => m.role === 'user').pop();
  if (!lastUser || typeof lastUser.content !== 'string' || lastUser.content.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'No user message found' }), { status: 400 });
  }

  // Threading: read lastResponseId for this chat
  const chatRow = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1);
  const lastResponseId = chatRow[0]?.lastResponseId ?? undefined;

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
    console.error('[FLOW] chat-v2 error', errText);
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
  console.log('[FLOW] chat-v2 end', { ms: elapsed, responseId });

  return new Response(JSON.stringify({ text: outputText }), {
    headers: { 'Content-Type': 'application/json' }
  });
}


