import { generateId } from 'ai';
import { type Message } from 'ai';
import { db } from "~/server/db"
import { chats, messages } from "~/server/db/schema"
import { eq } from "drizzle-orm"

export async function createChat(userId: string): Promise<string> {
  const id = generateId(); // generate a unique chat ID
  await db.insert(chats).values({ 
    id,
    userId
  }); // create chat record in database
  return id;
}

export async function loadChat(id: string): Promise<Message[]> {
  const result = await db
    .select()
    .from(messages)
    .where(eq(messages.chat_id, id));
  
  return result.map(row => ({
    id: row.id,
    content: row.content?? '', // handle potential null
    role: row.role as 'system' | 'user' | 'assistant' | 'data', // type assertion
    createdAt: row.createdAt,
    // Note: we don't include chat_id since Message interface doesn't have it
  }));
}

export async function saveChat({
  id,
  messages: messageList,
}: {
  id: string;
  messages: Message[];
}): Promise<void> {
  // First, delete existing messages for this chat
  await db.delete(messages).where(eq(messages.chat_id, id));
  
  // Then insert all the new messages
  if (messageList.length > 0) {
    await db.insert(messages).values(
      messageList.map(msg => ({
        id: msg.id,
        chat_id: id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
      }))
      
    );
  }
}