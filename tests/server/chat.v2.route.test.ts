import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'

// Use ESM-compatible module mocking
// Mock DB schema symbols used by the route
jest.unstable_mockModule('~/server/db/schema', () => ({
  chats: {},
  messages: {},
}))

// Mock DB client with minimal chaining used by the route
const mockDb = {
  select: () => ({
    from: () => ({
      where: () => ({
        limit: async () => [],
      }),
    }),
  }),
  update: () => ({
    set: () => ({
      where: async () => undefined,
    }),
  }),
}

jest.unstable_mockModule('~/server/db', () => ({
  db: mockDb,
}))

// Mock chat-store helpers used by the route
const mockSaveChat = jest.fn(async () => undefined)
const mockLoadChat = jest.fn(async () => [])
jest.unstable_mockModule('tools/chat-store', () => ({
  saveChat: { __esModule: true, default: undefined },
  loadChat: { __esModule: true, default: undefined },
  // named exports
  saveChat: mockSaveChat,
  loadChat: mockLoadChat,
}))

// Mock auth and headers to avoid real session/taste profile
jest.unstable_mockModule('~/lib/auth', () => ({
  auth: { api: { getSession: async () => null } },
}))
jest.unstable_mockModule('next/headers', () => ({
  headers: async () => ({}),
}))

// Mock recommendations + blocked list services
const mockListRecs = jest.fn(async () => [])
const mockAddRec = jest.fn(async () => undefined)
jest.unstable_mockModule('~/server/db/chat-recommendations', () => ({
  listChatRecommendations: mockListRecs,
  addChatRecommendation: mockAddRec,
}))
jest.unstable_mockModule('~/server/services/blocked-list', () => ({
  getUserBlockedList: async () => [],
}))

// After mocks, import the route under test
const { POST } = await import('~/app/api/chat-v2/route')

const originalFetch = global.fetch

beforeEach(() => {
  process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? 'test-key'
  mockSaveChat.mockClear()
  mockLoadChat.mockClear()
})

afterEach(() => {
  global.fetch = originalFetch as any
})

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/chat-v2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('/api/chat-v2 decide_mode', () => {
  it('returns mode A with NL text when decide_mode=A', async () => {
    // First call: decide_mode → output_text is JSON
    // Second call: NL text
    let call = 0
    global.fetch = (async () => {
      call += 1
      if (call === 1) {
        return {
          ok: true,
          json: async () => ({ id: 'resp_decide', output_text: '{"mode":"A","reason":"explicit ask"}' }),
        } as any
      }
      return {
        ok: true,
        json: async () => ({ id: 'resp_text', output_text: 'Hello there' }),
      } as any
    }) as any

    const req = makeRequest({
      id: 'chat1',
      messages: [{ id: 'u1', role: 'user', content: 'Hi!' }],
    })
    const res = await POST(req)
    const data = await res.json() as any
    expect(data.mode).toBe('A')
    expect(typeof data.text).toBe('string')
    expect(data.text.length).toBeGreaterThan(0)
    expect(call).toBe(2)
  })

  it('returns mode B with empty text when decide_mode=B', async () => {
    global.fetch = (async () => ({
      ok: true,
      json: async () => ({ id: 'resp_decide', output_text: '{"mode":"B","reason":"needs planning"}' }),
    })) as any

    const req = makeRequest({
      id: 'chat2',
      messages: [{ id: 'u2', role: 'user', content: 'Recommend 3 movies' }],
    })
    const res = await POST(req)
    const data = await res.json() as any
    expect(data.mode).toBe('B')
    expect(data.text).toBe('')
  })
})


