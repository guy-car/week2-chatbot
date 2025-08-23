import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';

export const enrichmentRouter = createTRPCRouter({
  enrich: publicProcedure
    .input(z.object({
      type: z.enum(['movie', 'tv']),
      id: z.number(),
    }))
    .query(async () => {
      // Implementation to be added in subsequent steps
      return {} as {
        imdbId?: string,
        ratings?: { rottenTomatoes?: string; metacritic?: string; imdb?: string },
        watch?: { country: 'US'; link?: string; flatrate?: { id: number; name: string; logoPath: string }[] }
      };
    }),
});
