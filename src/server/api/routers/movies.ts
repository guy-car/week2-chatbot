// server/api/routers/movies.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { movieInteractions, userPreferences } from "~/server/db/schema";
import { eq, and, desc } from "drizzle-orm";

export const moviesRouter = createTRPCRouter({
    trackInteraction: protectedProcedure
        .input(z.object({
            movieId: z.string(),
            movieTitle: z.string(),
            interactionType: z.enum(['like', 'dislike']),
        }))
        .mutation(async ({ ctx, input }) => {
            // Insert the interaction
            await ctx.db.insert(movieInteractions).values({
                id: crypto.randomUUID(),
                userId: ctx.user.id,
                movieId: input.movieId,
                movieTitle: input.movieTitle,
                interactionType: input.interactionType,
            });

            // Update the user preferences
            const currentPrefs = await ctx.db.query.userPreferences.findFirst({
                where: eq(userPreferences.userId, ctx.user.id),
            });

            const likedMovies = currentPrefs?.likedMovies ? currentPrefs.likedMovies.split(', ') : [];
            const dislikedMovies = currentPrefs?.dislikedMovies ? currentPrefs.dislikedMovies.split(', ') : [];

            if (input.interactionType === 'like') {
                // Remove from disliked if present
                const filteredDisliked = dislikedMovies.filter(m => m !== input.movieTitle);
                // Add to liked if not present
                if (!likedMovies.includes(input.movieTitle)) {
                    likedMovies.push(input.movieTitle);
                }

                await ctx.db
                    .insert(userPreferences)
                    .values({
                        userId: ctx.user.id,
                        likedMovies: likedMovies.join(', '),
                        dislikedMovies: filteredDisliked.join(', '),
                        favoriteGenres: currentPrefs?.favoriteGenres || '',
                        preferences: currentPrefs?.preferences || '',
                    })
                    .onConflictDoUpdate({
                        target: userPreferences.userId,
                        set: {
                            likedMovies: likedMovies.join(', '),
                            dislikedMovies: filteredDisliked.join(', '),
                            updatedAt: new Date(),
                        },
                    });
            } else {
                // Remove from liked if present
                const filteredLiked = likedMovies.filter(m => m !== input.movieTitle);
                // Add to disliked if not present
                if (!dislikedMovies.includes(input.movieTitle)) {
                    dislikedMovies.push(input.movieTitle);
                }

                await ctx.db
                    .insert(userPreferences)
                    .values({
                        userId: ctx.user.id,
                        likedMovies: filteredLiked.join(', '),
                        dislikedMovies: dislikedMovies.join(', '),
                        favoriteGenres: currentPrefs?.favoriteGenres || '',
                        preferences: currentPrefs?.preferences || '',
                    })
                    .onConflictDoUpdate({
                        target: userPreferences.userId,
                        set: {
                            likedMovies: filteredLiked.join(', '),
                            dislikedMovies: dislikedMovies.join(', '),
                            updatedAt: new Date(),
                        },
                    });
            }

            return { success: true };
        }),

    getRecentInteractions: protectedProcedure
        .query(async ({ ctx }) => {
            return await ctx.db.query.movieInteractions.findMany({
                where: eq(movieInteractions.userId, ctx.user.id),
                orderBy: [desc(movieInteractions.createdAt)],
                limit: 50,
            });
        }),
});