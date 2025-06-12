import { createChat } from 'tools/chat-store';

export async function POST() {
  try {
    const chatId = await createChat();
    return Response.json({ chatId });
  } catch (error) {
    return Response.json({ error: 'Failed to create chat' }, { status: 500 });
  }
}