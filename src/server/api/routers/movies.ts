// server/api/routers/movies.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { movieInteractions, userPreferences } from "~/server/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { userMovies } from "~/server/db/schema";
import type { MovieData } from "~/app/types";


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
                userId: ctx.user!.id,
                movieId: input.movieId,
                movieTitle: input.movieTitle,
                interactionType: input.interactionType,
            });

            // Update the user preferences
            const currentPrefs = await ctx.db.query.userPreferences.findFirst({
                where: eq(userPreferences.userId, ctx.user!.id),
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
                        userId: ctx.user!.id,
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
                        userId: ctx.user!.id,
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
                where: eq(movieInteractions.userId, ctx.user!.id),
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
                userId: ctx.user!.id,
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
                    eq(userMovies.userId, ctx.user!.id),
                    eq(userMovies.movieId, input.movieId),
                    eq(userMovies.collectionType, 'watchlist')
                )
            );

            return { success: true };
        }),

    removeFromHistory: protectedProcedure
        .input(z.object({
            movieId: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db.delete(userMovies).where(
                and(
                    eq(userMovies.userId, ctx.user!.id),
                    eq(userMovies.movieId, input.movieId),
                    eq(userMovies.collectionType, 'history')
                )
            );

            return { success: true };
        }),

    getWatchlist: protectedProcedure
        .query(async ({ ctx }) => {
            return await ctx.db.query.userMovies.findMany({
                where: and(
                    eq(userMovies.userId, ctx.user!.id),
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
                userId: ctx.user!.id,
                movieId: input.movieId,
                title: input.title,
                posterUrl: input.posterUrl,
                mediaType: input.mediaType,
                releaseDate: input.releaseDate ?? null,
                rating: input.rating ?? null,
                overview: input.overview ?? null,
                collectionType: 'history',
            });

            // Remove from watchlist if exists
            await ctx.db.delete(userMovies).where(
                and(
                    eq(userMovies.userId, ctx.user!.id),
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
                    eq(userMovies.userId, ctx.user!.id),
                    eq(userMovies.collectionType, 'history')
                ),
                orderBy: [desc(userMovies.addedAt)],
            });
        }),

    getLatestMovies: protectedProcedure
        .query(async ({ ctx }) => {
            const [latestWatchlist, latestHistory] = await Promise.all([
                ctx.db.query.userMovies.findFirst({
                    where: and(
                        eq(userMovies.userId, ctx.user!.id),
                        eq(userMovies.collectionType, 'watchlist')
                    ),
                    orderBy: [desc(userMovies.addedAt)],
                }),
                ctx.db.query.userMovies.findFirst({
                    where: and(
                        eq(userMovies.userId, ctx.user!.id),
                        eq(userMovies.collectionType, 'history')
                    ),
                    orderBy: [desc(userMovies.addedAt)],
                })
            ]);

            const [watchlistCount, historyCount] = await Promise.all([
                ctx.db.select({ count: count() })
                    .from(userMovies)
                    .where(and(
                        eq(userMovies.userId, ctx.user!.id),
                        eq(userMovies.collectionType, 'watchlist')
                    )),
                ctx.db.select({ count: count() })
                    .from(userMovies)
                    .where(and(
                        eq(userMovies.userId, ctx.user!.id),
                        eq(userMovies.collectionType, 'history')
                    ))
            ]);

            return {
                watchlist: {
                    latest: latestWatchlist,
                    count: watchlistCount[0]?.count ?? 0
                },
                history: {
                    latest: latestHistory,
                    count: historyCount[0]?.count ?? 0
                }
            };
        }),

    // Get MovieData by TMDB ID (reverse lookup)
    getMovieData: publicProcedure
        .input(z.object({
            type: z.enum(['movie', 'tv']),
            id: z.number(),
        }))
        .query(async ({ input }) => {
            const { type, id } = input;
            
            try {
                // Fetch basic movie details from TMDB
                const url = `https://api.themoviedb.org/3/${type}/${id}?language=en-US`;
                const response = await fetch(url, {
                    headers: {
                        accept: 'application/json',
                        Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
                    },
                });
                
                if (!response.ok) {
                    throw new Error(`TMDB API error: ${response.status}`);
                }
                
                const data = await response.json() as {
                    id: number;
                    title?: string;
                    name?: string;
                    poster_path?: string | null;
                    release_date?: string;
                    first_air_date?: string;
                    vote_average?: number;
                    overview?: string;
                };
                
                // Convert to MovieData format
                const releaseDate = data.release_date ?? data.first_air_date;
                const computedYear = releaseDate ? parseInt(releaseDate.slice(0, 4)) : undefined;
                
                const movieData: MovieData = {
                    id: data.id,
                    title: data.title ?? data.name ?? '',
                    poster_url: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
                    media_type: type,
                    release_date: releaseDate,
                    year: computedYear,
                    rating: Number(data.vote_average ?? 0),
                    overview: data.overview ?? '',
                };
                
                return movieData;
            } catch (error) {
                console.error('Error fetching movie data:', error);
                throw new Error('Failed to fetch movie data');
            }
        }),

});