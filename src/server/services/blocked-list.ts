import { db } from "~/server/db";
import { userMovies } from "~/server/db/schema";
import { and, eq, inArray } from "drizzle-orm";

export type BlockedItem = {
  id_tmdb: number;
  media_type: 'movie' | 'tv';
  title: string;
  year: number;
}

export async function getUserBlockedList(userId: string): Promise<BlockedItem[]> {
  const rows = await db
    .select()
    .from(userMovies)
    .where(
      and(
        eq(userMovies.userId, userId),
        inArray(userMovies.collectionType, ['watchlist', 'history'])
      )
    );

  return rows.map(r => ({
    id_tmdb: Number(r.movieId),
    media_type: r.mediaType,
    title: r.title,
    year: Number((r.releaseDate ?? '').slice(0, 4)) || 0,
  }));
}


