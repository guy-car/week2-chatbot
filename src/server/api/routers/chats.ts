import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { chats } from "~/server/db/schema";
import { createChat } from 'tools/chat-store'
import { eq, and } from "drizzle-orm";

export const chatRouter = createTRPCRouter({
  getAll: protectedProcedure
    .query(async ({ ctx }) => {
      const allChats = await ctx.db.query.chats.findMany({
        where: eq(chats.userId, ctx.user!.id),
        orderBy: (chats, { desc }) => [desc(chats.createdAt)],  // Order by newest first
      })
      return allChats;
    }),

  create: protectedProcedure
    .mutation(async ({ ctx }) => {
      const chatId = await createChat(ctx.user!.id)
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
    }),

  delete: protectedProcedure
    .input(z.object({
      chatId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      // Ensure only the owner can delete their chat
      await ctx.db.delete(chats)
        .where(
          and(
            eq(chats.id, input.chatId),
            eq(chats.userId, ctx.user!.id)
          )
        );
      return { success: true };
    })
})

