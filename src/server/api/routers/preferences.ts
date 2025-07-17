import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { userPreferences } from "~/server/db/schema";
import { eq } from "drizzle-orm";

export const preferencesRouter = createTRPCRouter({
    get: protectedProcedure
        .query(async ({ ctx }) => {
            const preferences = await ctx.db.query.userPreferences.findFirst({
                where: eq(userPreferences.userId, ctx.user!.id),
            });

            // Return default values if no preferences exist yet
            return preferences ?? {
                userId: ctx.user!.id,
                favoriteGenres: "",
                likedMovies: "",
                dislikedMovies: "",
                preferences: "",
            };
        }),

    update: protectedProcedure
        .input(z.object({
            favoriteGenres: z.string().max(500),
            likedMovies: z.string().max(500),
            dislikedMovies: z.string().max(500),
            preferences: z.string().max(500),
        }))
        .mutation(async ({ ctx, input }) => {
            // Upsert - insert if doesn't exist, update if it does
            await ctx.db
                .insert(userPreferences)
                .values({
                    userId: ctx.user!.id,
                    ...input,
                })
                .onConflictDoUpdate({
                    target: userPreferences.userId,
                    set: {
                        ...input,
                        updatedAt: new Date(),
                    },
                });

            return { success: true };
        }),
});