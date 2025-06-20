// server/api/routers/movies.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { movieInteractions, userPreferences } from "~/server/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { userMovies } from "~/server/db/schema";

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
                        favoriteGenres: currentPrefs?.favoriteGenres ?? '',
                        preferences: currentPrefs?.preferences ?? '',
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
                        favoriteGenres: currentPrefs?.favoriteGenres ?? '',
                        preferences: currentPrefs?.preferences ?? '',
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
    addToWatchlist: protectedProcedure
        .input(z.object({
            movieId: z.string(),
            title: z.string(),
            posterUrl: z.string().nullable(),
            mediaType: z.enum(['movie', 'tv']),
            releaseDate: z.string().optional(),
            rating: z.number().optional(),
            overview: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db.insert(userMovies).values({
                id: crypto.randomUUID(),
                userId: ctx.user.id,
                movieId: input.movieId,
                title: input.title,
                posterUrl: input.posterUrl,
                mediaType: input.mediaType,
                releaseDate: input.releaseDate ?? null,
                rating: input.rating ?? null,
                overview: input.overview ?? null,
                collectionType: 'watchlist',
            });

            return { success: true };
        }),

    removeFromWatchlist: protectedProcedure
        .input(z.object({
            movieId: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db.delete(userMovies).where(
                and(
                    eq(userMovies.userId, ctx.user.id),
                    eq(userMovies.movieId, input.movieId),
                    eq(userMovies.collectionType, 'watchlist')
                )
            );

            return { success: true };
        }),

    getWatchlist: protectedProcedure
        .query(async ({ ctx }) => {
            return await ctx.db.query.userMovies.findMany({
                where: and(
                    eq(userMovies.userId, ctx.user.id),
                    eq(userMovies.collectionType, 'watchlist')
                ),
                orderBy: [desc(userMovies.addedAt)],
            });
        }),
    markAsWatched: protectedProcedure
        .input(z.object({
            movieId: z.string(),
            title: z.string(),
            posterUrl: z.string().nullable(),
            mediaType: z.enum(['movie', 'tv']),
            releaseDate: z.string().optional(),
            rating: z.number().optional(),
            overview: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            // Add to history
            await ctx.db.insert(userMovies).values({
                id: crypto.randomUUID(),
                userId: ctx.user.id,
                movieId: input.movieId,
                title: input.title,
                posterUrl: input.posterUrl,
                mediaType: input.mediaType,
                releaseDate: input.releaseDate || null,
                rating: input.rating || null,
                overview: input.overview || null,
                collectionType: 'history',
            });

            // Remove from watchlist if exists
            await ctx.db.delete(userMovies).where(
                and(
                    eq(userMovies.userId, ctx.user.id),
                    eq(userMovies.movieId, input.movieId),
                    eq(userMovies.collectionType, 'watchlist')
                )
            );

            return { success: true };
        }),

    getWatchHistory: protectedProcedure
        .query(async ({ ctx }) => {
            return await ctx.db.query.userMovies.findMany({
                where: and(
                    eq(userMovies.userId, ctx.user.id),
                    eq(userMovies.collectionType, 'history')
                ),
                orderBy: [desc(userMovies.addedAt)],
            });
        }),



});