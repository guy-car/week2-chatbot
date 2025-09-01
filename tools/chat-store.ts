
'use server'

import { generateId } from 'ai';
import { type Message } from 'ai';
import { db } from "~/server/db"
import { chats, messages } from "~/server/db/schema"
import { eq, and, isNotNull, asc } from "drizzle-orm"
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
    .where(eq(messages.chatId, id))
    .orderBy(asc(messages.createdAt));

  const loadedMessages = result.map(row => ({
    id: row.id,
    content: row.content ?? '',
    role: row.role as 'system' | 'user' | 'assistant' | 'data',
    createdAt: row.createdAt,
  }));

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
  const existingMessages = await db
    .select({ id: messages.id })
    .from(messages)
    .where(eq(messages.chatId, id));

  const existingIds = new Set(existingMessages.map(m => m.id));
  
  // Separate new messages from existing messages that need updates
  const newMessages = messageList.filter(msg => !existingIds.has(msg.id));
  const updateMessages = messageList.filter(msg => existingIds.has(msg.id));

  // Process new messages (insert)
  if (newMessages.length > 0) {
    await db.insert(messages).values(
      newMessages.map(msg => {
        // For assistant messages with parts, extract text content from parts
        let content = msg.content;
        if (msg.role === 'assistant' && 'parts' in msg && Array.isArray(msg.parts)) {
          const textParts = msg.parts
            .filter((p): p is { type: 'text'; text: string } => p && typeof p === 'object' && 'type' in p && p.type === 'text' && 'text' in p)
            .map(p => p.text);
          content = textParts.join('\n').trim() ?? msg.content;
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
  }

  // Process update messages (update existing)
  if (updateMessages.length > 0) {
    // Update each existing message with new content and tool results
    for (const msg of updateMessages) {
      try {
        // For assistant messages with parts, extract text content from parts
        let content = msg.content;
        if (msg.role === 'assistant' && 'parts' in msg && Array.isArray(msg.parts)) {
          const textParts = msg.parts
            .filter((p): p is { type: 'text'; text: string } => p && typeof p === 'object' && 'type' in p && p.type === 'text' && 'text' in p)
            .map(p => p.text);
          content = textParts.join('\n').trim() ?? msg.content;
        }

        // Only update if we have new content to add. Never touch toolResults on updates.
        if (content && content.trim().length > 0) {
          await db.update(messages)
            .set({ content })
            .where(eq(messages.id, msg.id));
        }
      } catch (error) {
        console.error('❌ Failed to update message:', msg.id, 'Error:', error);
        
        // Try to preserve original content by fetching current state
        try {
          const currentMessage = await db
            .select({ content: messages.content, toolResults: messages.toolResults })
            .from(messages)
            .where(eq(messages.id, msg.id))
            .limit(1);
          
          if (currentMessage.length > 0 && currentMessage[0]) {
            console.log('🔄 Preserved original content for message:', msg.id, 'Content length:', currentMessage[0].content?.length || 0);
          }
        } catch (fallbackError) {
          console.error('❌ Failed to preserve original content for message:', msg.id, 'Fallback error:', fallbackError);
        }
        
        // Continue with other updates even if one fails
      }
    }
  }
}