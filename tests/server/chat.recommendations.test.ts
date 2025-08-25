import { describe, it, expect } from '@jest/globals'

// Guard running against real DB unless explicitly allowed
const RUN_DB_TESTS = process.env.DB_TESTS === 'true'
const hasDbUrl = !!process.env.DATABASE_URL

describe('chat_recommendations repo', () => {
  if (!RUN_DB_TESTS || !hasDbUrl) {
    it('skipped (set DB_TESTS=true to run)', () => {
      expect(true).toBe(true)
    })
    return
  }

  it('add → list → delete works', async () => {
    // Set RLS user context for this test connection
    const { db } = await import('~/server/db')
    const { chats } = await import('~/server/db/schema')
    const { sql } = await import('drizzle-orm')

    // Seed a user + chat row minimal state
    const testUserId = 'test_user_rls'
    const testChatId = 'test_chat_123'
    // Set RLS user_id for the session
    await db.execute(sql`SELECT set_config('rls.user_id', ${testUserId}, true);`)
    // Ensure chat exists and belongs to this user
    await db.insert(chats).values({ id: testChatId, userId: testUserId }).onConflictDoNothing()

    const { addChatRecommendation, listChatRecommendations, removeChatRecommendation } = await import('~/server/db/chat-recommendations')
    const rec = { chatId: testChatId, id_tmdb: 42, media_type: 'movie' as const, title: 'The Answer', year: 1979 }

    await removeChatRecommendation(testChatId, rec.id_tmdb, rec.media_type)

    await addChatRecommendation(rec)
    const listed = await listChatRecommendations(testChatId)
    expect(listed.find(r => r.id_tmdb === rec.id_tmdb && r.media_type === rec.media_type)).toBeTruthy()

    await addChatRecommendation(rec)
    const listed2 = await listChatRecommendations(testChatId)
    const count = listed2.filter(r => r.id_tmdb === rec.id_tmdb && r.media_type === rec.media_type).length
    expect(count).toBe(1)

    await removeChatRecommendation(testChatId, rec.id_tmdb, rec.media_type)
    const listed3 = await listChatRecommendations(testChatId)
    expect(listed3.find(r => r.id_tmdb === rec.id_tmdb && r.media_type === rec.media_type)).toBeFalsy()
  })
})


