// app/_services/tasteProfileService.ts
import { api } from "~/trpc/react";
import type { Database } from "~/server/db"; // Import the database type

export const tasteProfileService = {
    // For server-side usage in your chat API route
    async getProfileForChat(userId: string, db: Database) {
        const { userPreferences } = await import("~/server/db/schema");
        const { eq } = await import("drizzle-orm");

        const profile = await db.query.userPreferences.findFirst({
            where: eq(userPreferences.userId, userId),
        });

        return profile ?? {
            favoriteGenres: '',
            likedMovies: '',
            dislikedMovies: '',
            preferences: ''
        };
    },

    // Generate a summary for the LLM
    generateSummary(profile: {
        favoriteGenres: string | null;
        likedMovies: string | null;
        dislikedMovies: string | null;
        preferences: string | null;
    }): string {
        const parts: string[] = [];

        if (profile.favoriteGenres) {
            parts.push(`Favorite genres: ${profile.favoriteGenres}`);
        }
        if (profile.likedMovies) {
            parts.push(`Liked movies: ${profile.likedMovies}`);
        }
        if (profile.dislikedMovies) {
            parts.push(`Disliked movies: ${profile.dislikedMovies}`);
        }
        if (profile.preferences) {
            parts.push(`Preferences: ${profile.preferences}`);
        }

        return parts.length > 0
            ? `User taste profile: ${parts.join('. ')}`
            : '';
    }
};

// Export hooks for React components
export const useTasteProfile = () => {
    const profile = api.preferences.get.useQuery();
    const trackInteraction = api.movies.trackInteraction.useMutation();

    return {
        profile: profile.data,
        isLoading: profile.isLoading,
        addLikedMovie: async (movie: { id: number; title: string }) => {
            await trackInteraction.mutateAsync({
                movieId: movie.id.toString(),
                movieTitle: movie.title,
                interactionType: 'like',
            });
        },
        addDislikedMovie: async (movie: { id: number; title: string }) => {
            await trackInteraction.mutateAsync({
                movieId: movie.id.toString(),
                movieTitle: movie.title,
                interactionType: 'dislike',
            });
        },
    };
};