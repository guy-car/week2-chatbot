
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

  // Log raw database results
  console.log('🗄️ Raw database results for chat', id, ':', result.map(row => ({
    id: row.id,
    role: row.role,
    content: row.content,
    contentLength: row.content?.length || 0,
    toolResults: row.toolResults,
    createdAt: row.createdAt
  })));

  const loadedMessages = result.map(row => ({
    id: row.id,
    content: row.content ?? '',
    role: row.role as 'system' | 'user' | 'assistant' | 'data',
    createdAt: row.createdAt,
  }));

  // Log loaded messages for debugging
  loadedMessages.forEach(msg => {
    if (msg.role === 'assistant') {
      console.log('📥 Loaded assistant message:', {
        id: msg.id,
        content: msg.content,
        contentLength: msg.content?.length || 0,
        isEmpty: !msg.content || msg.content.trim() === ''
      });
    }
  });

  return loadedMessages;
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
  console.log('🔍 saveChat called with:', {
    chatId: id,
    totalMessages: messageList.length,
    messageIds: messageList.map(m => ({ id: m.id, role: m.role, contentLength: m.content?.length || 0 }))
  });

  const existingMessages = await db
    .select({ id: messages.id })
    .from(messages)
    .where(eq(messages.chatId, id));

  const existingIds = new Set(existingMessages.map(m => m.id));
  const newMessages = messageList.filter(msg => !existingIds.has(msg.id));

  console.log('🔍 saveChat filtering:', {
    existingIds: Array.from(existingIds),
    newMessagesCount: newMessages.length,
    newMessageIds: newMessages.map(m => ({ id: m.id, role: m.role, contentLength: m.content?.length || 0 }))
  });

  // Enhanced logging for assistant messages to debug multi-part structure
  newMessages.forEach(msg => {
    if (msg.role === 'assistant') {
      console.log('💾 Saving assistant message:', {
        id: msg.id,
        contentLength: msg.content?.length || 0,
        hasParts: Array.isArray((msg as any).parts),
        partsCount: Array.isArray((msg as any).parts) ? (msg as any).parts.length : 0,
        toolResultsCount: extractToolResults(msg)?.length || 0
      });
    }
  });

  if (newMessages.length > 0) {
    console.log('💾 Inserting messages to database:', newMessages.map(msg => ({
      id: msg.id,
      role: msg.role,
      contentLength: msg.content?.length || 0,
      toolResultsCount: extractToolResults(msg)?.length || 0
    })));
    
    await db.insert(messages).values(
      newMessages.map(msg => {
        // For assistant messages with parts, extract text content from parts
        let content = msg.content;
        if (msg.role === 'assistant' && Array.isArray((msg as any).parts)) {
          const textParts = (msg as any).parts
            .filter((p: any) => p.type === 'text')
            .map((p: any) => p.text);
          content = textParts.join('\n').trim() || msg.content;
        }
        
        return {
          id: msg.id,
          chatId: id,
          role: msg.role,
          content: content,
          toolResults: extractToolResults(msg),
          createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
        };
      })
    ).onConflictDoNothing();
    
    console.log('✅ Database insert completed for', newMessages.length, 'messages');
  } else {
    console.log('⚠️ No new messages to insert');
  }
}