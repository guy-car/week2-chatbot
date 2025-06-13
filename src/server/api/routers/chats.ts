import { z } from "zod";

import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc";
import { chats } from "~/server/db/schema";
import { createChat } from 'tools/chat-store'

export const chatRouter = createTRPCRouter({
  getAll: protectedProcedure
    .query(async ({ ctx }) => {
        const allChats = await ctx.db.query.chats.findMany()
      return allChats;
    }),
    create: protectedProcedure
      .mutation(async ({ ctx }) => {
        const chatId = await createChat(ctx.user.id)
        return { chatId }
      })
  

})

