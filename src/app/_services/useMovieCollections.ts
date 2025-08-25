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

// app/_services/useMovieCollections.ts
import { api } from "~/trpc/react";

export const useMovieCollections = () => {
    const utils = api.useUtils();

    const watchlist = api.movies.getWatchlist.useQuery();
    const addToWatchlistMutation = api.movies.addToWatchlist.useMutation({
        onSuccess: () => {
            void utils.movies.getWatchlist.invalidate();
        },
    });
    const removeFromWatchlistMutation = api.movies.removeFromWatchlist.useMutation({
        onSuccess: () => {
            void utils.movies.getWatchlist.invalidate();
        },
    });
    const removeFromHistoryMutation = api.movies.removeFromHistory.useMutation({
        onSuccess: () => {
            void utils.movies.getWatchHistory.invalidate();
        },
    });

    // Watch history queries/mutations
    const watchHistory = api.movies.getWatchHistory.useQuery();
    const markAsWatchedMutation = api.movies.markAsWatched.useMutation({
        onSuccess: () => {
            void utils.movies.getWatchHistory.invalidate();
            void utils.movies.getWatchlist.invalidate(); // Also refresh watchlist since we remove from it
        },
    });

    const addToWatchlist = async (movie: {
        id: number;
        title: string;
        poster_url: string | null;
        media_type: 'movie' | 'tv';
        release_date?: string;
        rating?: number;
        overview?: string;
    }) => {
        const isInWatchlist = watchlist.data?.some(
            item => item.movieId === movie.id.toString()
        );

        if (isInWatchlist) {
            throw new Error('Already in watchlist');
        }

        await addToWatchlistMutation.mutateAsync({
            movieId: movie.id.toString(),
            title: movie.title,
            posterUrl: movie.poster_url,
            mediaType: movie.media_type,
            releaseDate: movie.release_date,
            rating: movie.rating,
            overview: movie.overview,
        });
    };

    const markAsWatched = async (movie: {
        id: number;
        title: string;
        poster_url: string | null;
        media_type: 'movie' | 'tv';
        release_date?: string;
        rating?: number;
        overview?: string;
    }) => {
        const isInHistory = watchHistory.data?.some(
            item => item.movieId === movie.id.toString()
        );

        if (isInHistory) {
            throw new Error('Already watched');
        }

        await markAsWatchedMutation.mutateAsync({
            movieId: movie.id.toString(),
            title: movie.title,
            posterUrl: movie.poster_url,
            mediaType: movie.media_type,
            releaseDate: movie.release_date,
            rating: movie.rating,
            overview: movie.overview,
        });
    };

    const removeFromWatchlist = async (movieId: number) => {
        await removeFromWatchlistMutation.mutateAsync({
            movieId: movieId.toString(),
        });
    };

    const removeFromHistory = async (movieId: number) => {
        await removeFromHistoryMutation.mutateAsync({
            movieId: movieId.toString(),
        });
    };

    return {
        watchlist: watchlist.data ?? [],
        watchHistory: watchHistory.data ?? [],
        isLoading: watchlist.isLoading || watchHistory.isLoading,
        addToWatchlist,
        markAsWatched,
        removeFromWatchlist,
        removeFromHistory,
        isAddingToWatchlist: addToWatchlistMutation.isPending,
        isMarkingAsWatched: markAsWatchedMutation.isPending,
    };
}