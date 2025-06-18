'use server'

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
    content: row.content ?? '', // handle potential null
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
  // Get existing message IDs
  const existingMessages = await db
    .select({ id: messages.id })
    .from(messages)
    .where(eq(messages.chat_id, id));

  const existingIds = new Set(existingMessages.map(m => m.id));

  // Filter to only new messages
  const newMessages = messageList.filter(msg => !existingIds.has(msg.id));

  // Insert only new messages
  if (newMessages.length > 0) {
    await db.insert(messages).values(
      newMessages.map(msg => ({
        id: msg.id,
        chat_id: id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
      }))
    ).onConflictDoNothing(); // Add this if your DB supports it
  }
}