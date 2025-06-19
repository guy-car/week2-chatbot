import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { chats } from "~/server/db/schema";
import { createChat } from 'tools/chat-store'
import { eq } from "drizzle-orm";

export const chatRouter = createTRPCRouter({
  getAll: protectedProcedure
    .query(async ({ ctx }) => {
      const allChats = await ctx.db.query.chats.findMany({
        orderBy: (chats, { desc }) => [desc(chats.createdAt)],  // Order by newest first
      })
      return allChats;
    }),

  create: protectedProcedure
    .mutation(async ({ ctx }) => {
      const chatId = await createChat(ctx.user.id)
      return { chatId }
    }),

  updateTitle: protectedProcedure
    .input(z.object({
      chatId: z.string(),
      title: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(chats)
        .set({ title: input.title })
        .where(eq(chats.id, input.chatId));
      return { success: true };
    })
})

