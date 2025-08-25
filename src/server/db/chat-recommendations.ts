import { db } from "~/server/db";
import { chatRecommendations } from "~/server/db/schema";
import { and, eq } from "drizzle-orm";

export type ChatRecommendation = {
  chatId: string;
  id_tmdb: number;
  media_type: 'movie' | 'tv';
  title: string;
  year: number;
};

export async function addChatRecommendation(rec: ChatRecommendation): Promise<void> {
  await db
    .insert(chatRecommendations)
    .values({
      chatId: rec.chatId,
      idTmdb: rec.id_tmdb,
      mediaType: rec.media_type,
      title: rec.title,
      year: rec.year,
    })
    .onConflictDoNothing();
}

export async function removeChatRecommendation(chatId: string, id_tmdb: number, media_type: 'movie' | 'tv'): Promise<void> {
  await db
    .delete(chatRecommendations)
    .where(
      and(
        eq(chatRecommendations.chatId, chatId),
        eq(chatRecommendations.idTmdb, id_tmdb),
        eq(chatRecommendations.mediaType, media_type)
      )
    );
}

export async function listChatRecommendations(chatId: string): Promise<ChatRecommendation[]> {
  const rows = await db
    .select()
    .from(chatRecommendations)
    .where(eq(chatRecommendations.chatId, chatId));

  return rows.map(r => ({
    chatId: r.chatId,
    id_tmdb: r.idTmdb,
    media_type: r.mediaType,
    title: r.title,
    year: r.year,
  }));
}


