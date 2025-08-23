import { chatRouter } from "~/server/api/routers/chats";
import { preferencesRouter } from "~/server/api/routers/preferences";
import { moviesRouter } from "~/server/api/routers/movies";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { enrichmentRouter } from "~/server/api/routers/enrichment";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  chat: chatRouter,
  preferences: preferencesRouter,
  movies: moviesRouter,
  enrichment: enrichmentRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
