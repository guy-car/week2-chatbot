
'use server'

import { generateId } from 'ai';
import { type Message } from 'ai';
import { db } from "~/server/db"
import { chats, messages } from "~/server/db/schema"
import { eq, and, isNotNull } from "drizzle-orm"
import { extractToolResults } from './message-utils'
import type { MovieData } from "~/app/types/index"

export async function createChat(userId: string): Promise<string> {
  const id = generateId();
  await db.insert(chats).values({
    id,
    userId
  });
  return id;
}

// just returns plain messages
export async function loadChat(id: string): Promise<Message[]> {
  const result = await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, id));

  return result.map(row => ({
    id: row.id,
    content: row.content ?? '',
    role: row.role as 'system' | 'user' | 'assistant' | 'data',
    createdAt: row.createdAt,
  }));
}

// load posters separately directly from db
export async function loadMoviesForChat(chatId: string): Promise<{ messageId: string; movies: MovieData[] }[]> {
  const result = await db
    .select({
      messageId: messages.id,
      toolResults: messages.toolResults,
    })
    .from(messages)
    .where(
      and(
        eq(messages.chatId, chatId),
        eq(messages.role, 'assistant'),
        isNotNull(messages.toolResults)
      )
    );

  return result.map(row => ({
    messageId: row.messageId,
    movies: (row.toolResults!) || []
  }));
}

export async function saveChat({
  id,
  messages: messageList,
}: {
  id: string;
  messages: Message[];
}): Promise<void> {
  const existingMessages = await db
    .select({ id: messages.id })
    .from(messages)
    .where(eq(messages.chatId, id));

  const existingIds = new Set(existingMessages.map(m => m.id));
  const newMessages = messageList.filter(msg => !existingIds.has(msg.id));

  // Enhanced logging for assistant messages to debug multi-part structure
  newMessages.forEach(msg => {
    if (msg.role === 'assistant') {
      // Extract all text parts
      const textParts = Array.isArray((msg as any).parts)
        ? (msg as any).parts.filter((p: any) => p.type === 'text').map((p: any) => p.text)
        : [];
      console.log('🧩 Assistant message structure:', {
        id: msg.id,
        role: msg.role,
        content: msg.content,
        textParts,
        parts: Array.isArray((msg as any).parts) ? (msg as any).parts : undefined,
        toolResults: extractToolResults(msg),
        fullMsg: msg
      });
    }
  });

  if (newMessages.length > 0) {
    await db.insert(messages).values(
      newMessages.map(msg => ({
        id: msg.id,
        chatId: id,
        role: msg.role,
        content: msg.content,
        toolResults: extractToolResults(msg),
        createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
      }))
    ).onConflictDoNothing();
  }
}