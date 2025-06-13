import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { chats } from "~/server/db/schema";

export const chatRouter = createTRPCRouter({
  getAll: publicProcedure
    .query(async ({ ctx }) => {
        const allChats = await ctx.db.query.chats.findMany()
      return allChats;
    }),

})

