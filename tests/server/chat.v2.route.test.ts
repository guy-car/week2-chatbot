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
  insert: () => ({
    values: async () => undefined,
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

// Mock taste profile service
const mockTasteProfile = {
  getProfileForChat: jest.fn(async () => ({ genres: ['action', 'drama'] })),
  generateSummary: jest.fn(() => 'User enjoys action and drama movies'),
}
jest.unstable_mockModule('~/server/services/taste-profile', () => ({
  tasteProfileServerService: mockTasteProfile,
}))

// Mock TMDB lookup service
const mockLookupBestByTitleYear = jest.fn(async (title: string, year: number) => ({
  id: 123,
  title,
  media_type: 'movie' as const,
  release_date: `${year}-01-01`,
  poster_url: 'https://example.com/poster.jpg',
  rating: 8.0,
  overview: 'A great movie',
}))
jest.unstable_mockModule('~/server/services/tmdb', () => ({
  lookupBestByTitleYear: mockLookupBestByTitleYear,
}))

// Mock OpenAI SDK
const mockOpenAI = {
  responses: {
    create: jest.fn(),
    stream: jest.fn(),
  },
}
jest.unstable_mockModule('openai', () => ({
  default: jest.fn(() => mockOpenAI),
}))

// After mocks, import the route under test
const { POST } = await import('~/app/api/chat-v2/route')

beforeEach(() => {
  process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? 'test-key'
  mockSaveChat.mockClear()
  mockLoadChat.mockClear()
  mockListRecs.mockClear()
  mockAddRec.mockClear()
  mockTasteProfile.getProfileForChat.mockClear()
  mockTasteProfile.generateSummary.mockClear()
  mockLookupBestByTitleYear.mockClear()
  mockOpenAI.responses.create.mockClear()
  mockOpenAI.responses.stream.mockClear()
})

afterEach(() => {
  // Clean up
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
    // Mock decide_mode returns A
    mockOpenAI.responses.create
      .mockResolvedValueOnce({
        id: 'resp_decide',
        output_text: 'A',
        output_parsed: 'A'
      })
      // Mock text generation for Mode A
      .mockResolvedValueOnce({
        id: 'resp_text',
        output_text: 'Hello there! How can I help you with movies today?',
        output_parsed: 'Hello there! How can I help you with movies today?'
      })

    const req = makeRequest({
      id: 'chat1',
      messages: [{ id: 'u1', role: 'user', content: 'Hi!' }],
    })
    const res = await POST(req)
    const data = await res.json() as any
    
    expect(data.mode).toBe('A')
    expect(typeof data.text).toBe('string')
    expect(data.text.length).toBeGreaterThan(0)
    expect(mockOpenAI.responses.create).toHaveBeenCalledTimes(2)
  })

  it('returns mode B with empty text when decide_mode=B', async () => {
    mockOpenAI.responses.create.mockResolvedValueOnce({
      id: 'resp_decide',
      output_text: 'B',
      output_parsed: 'B'
    })

    const req = makeRequest({
      id: 'chat2',
      messages: [{ id: 'u2', role: 'user', content: 'Recommend 3 movies' }],
    })
    const res = await POST(req)
    const data = await res.json() as any
    
    expect(data.mode).toBe('B')
    expect(data.text).toBe('')
  })

  it('handles decide_mode parse failure gracefully', async () => {
    mockOpenAI.responses.create.mockResolvedValueOnce({
      id: 'resp_decide',
      output_text: 'invalid response',
      output_parsed: null
    })

    const req = makeRequest({
      id: 'chat3',
      messages: [{ id: 'u3', role: 'user', content: 'Hello' }],
    })
    const res = await POST(req)
    const data = await res.json() as any
    
    // Should default to mode B on parse failure (behavior changed)
    expect(data.mode).toBe('B')
  })
})

describe('/api/chat-v2 plan_picks (Mode B)', () => {
  it('successfully plans and resolves movie picks', async () => {
    // Mock decide_mode returns B
    // Mock plan_picks returns valid JSON
    // Mock TMDB lookups succeed with unique IDs
    mockOpenAI.responses.create
      .mockResolvedValueOnce({
        id: 'resp_decide',
        output_text: 'B',
        output_parsed: 'B'
      })
      .mockResolvedValueOnce({
        id: 'resp_plan',
        output_text: JSON.stringify({
          intro: 'Here are some great action movies from the 1990s',
          picks: [
            { title: 'Die Hard', year: 1988, reason: 'Classic action thriller' },
            { title: 'Terminator 2', year: 1991, reason: 'Revolutionary sci-fi action' },
            { title: 'Speed', year: 1994, reason: 'High-octane bus thriller' }
          ]
        }),
        output_parsed: {
          intro: 'Here are some great action movies from the 1990s',
          picks: [
            { title: 'Die Hard', year: 1988, reason: 'Classic action thriller' },
            { title: 'Terminator 2', year: 1991, reason: 'Revolutionary sci-fi action' },
            { title: 'Speed', year: 1994, reason: 'High-octane bus thriller' }
          ]
        }
      })

    // Mock TMDB lookups to return unique IDs for each movie
    mockLookupBestByTitleYear
      .mockResolvedValueOnce({
        id: 123,
        title: 'Die Hard',
        media_type: 'movie' as const,
        release_date: '1988-01-01',
        poster_url: 'https://example.com/poster1.jpg',
        rating: 8.0,
        overview: 'Classic action thriller',
      })
      .mockResolvedValueOnce({
        id: 456,
        title: 'Terminator 2',
        media_type: 'movie' as const,
        release_date: '1991-01-01',
        poster_url: 'https://example.com/poster2.jpg',
        rating: 8.5,
        overview: 'Revolutionary sci-fi action',
      })
      .mockResolvedValueOnce({
        id: 789,
        title: 'Speed',
        media_type: 'movie' as const,
        release_date: '1994-01-01',
        poster_url: 'https://example.com/poster3.jpg',
        rating: 7.8,
        overview: 'High-octane bus thriller',
      })

    const req = makeRequest({
      id: 'chat4',
      messages: [{ id: 'u4', role: 'user', content: 'Recommend 3 action movies from the 1990s' }],
    })
    const res = await POST(req)
    const data = await res.json() as any
    
    expect(data.mode).toBe('B')
    expect(data.text).toBe('Here are some great action movies from the 1990s')
    expect(Array.isArray(data.picks)).toBe(true)
    expect(data.picks.length).toBe(3)
    expect(data.picks[0]).toHaveProperty('id')
    expect(data.picks[0]).toHaveProperty('title')
    expect(data.picks[0]).toHaveProperty('media_type')
    
    // Verify TMDB lookups were called
    expect(mockLookupBestByTitleYear).toHaveBeenCalledTimes(3)
    expect(mockAddRec).toHaveBeenCalledTimes(3)
  })

  it('handles plan_picks parse failure gracefully', async () => {
    mockOpenAI.responses.create
      .mockResolvedValueOnce({
        id: 'resp_decide',
        output_text: 'B',
        output_parsed: 'B'
      })
      .mockResolvedValueOnce({
        id: 'resp_plan',
        output_text: 'invalid json response',
        output_parsed: null
      })

    const req = makeRequest({
      id: 'chat5',
      messages: [{ id: 'u5', role: 'user', content: 'Recommend movies' }],
    })
    const res = await POST(req)
    const data = await res.json() as any
    
    expect(data.mode).toBe('B')
    expect(data.text).toBe('')
    expect(data.debug).toBeDefined()
  })

  it('filters out blocked movies during planning', async () => {
    // Mock blocked list with some movies
    mockListRecs.mockResolvedValueOnce([
      { id_tmdb: 123, media_type: 'movie', title: 'Die Hard', year: 1988 }
    ])
    
    mockOpenAI.responses.create
      .mockResolvedValueOnce({
        id: 'resp_decide',
        output_text: 'B',
        output_parsed: 'B'
      })
      .mockResolvedValueOnce({
        id: 'resp_plan',
        output_text: JSON.stringify({
          intro: 'Here are some great movies',
          picks: [
            { title: 'Die Hard', year: 1988, reason: 'Classic action' },
            { title: 'New Movie', year: 1995, reason: 'Fresh pick' }
          ]
        }),
        output_parsed: {
          intro: 'Here are some great movies',
          picks: [
            { title: 'Die Hard', year: 1988, reason: 'Classic action' },
            { title: 'New Movie', year: 1995, reason: 'Fresh pick' }
          ]
        }
      })

    // Mock TMDB lookups - Die Hard should fail (blocked), New Movie should succeed
    mockLookupBestByTitleYear
      .mockResolvedValueOnce({
        id: 123, // Same ID as blocked list - should be filtered out
        title: 'Die Hard',
        media_type: 'movie' as const,
        release_date: '1988-01-01',
        poster_url: 'https://example.com/poster1.jpg',
        rating: 8.0,
        overview: 'Classic action',
      })
      .mockResolvedValueOnce({
        id: 999, // Different ID - should be accepted
        title: 'New Movie',
        media_type: 'movie' as const,
        release_date: '1995-01-01',
        poster_url: 'https://example.com/poster2.jpg',
        rating: 7.5,
        overview: 'Fresh pick',
      })

    const req = makeRequest({
      id: 'chat6',
      messages: [{ id: 'u6', role: 'user', content: 'Recommend movies' }],
    })
    const res = await POST(req)
    const data = await res.json() as any
    
    // Die Hard should be filtered out due to being in blocked list
    expect(data.picks.length).toBe(1)
    expect(data.picks[0].title).toBe('New Movie')
  })

  it('handles TMDB lookup failures gracefully', async () => {
    // Mock some lookups to fail
    mockLookupBestByTitleYear
      .mockResolvedValueOnce(null) // First lookup fails
      .mockResolvedValueOnce({     // Second lookup succeeds
        id: 456,
        title: 'Working Movie',
        media_type: 'movie' as const,
        release_date: '1995-01-01',
        poster_url: 'https://example.com/poster.jpg',
        rating: 7.5,
        overview: 'A working movie',
      })

    mockOpenAI.responses.create
      .mockResolvedValueOnce({
        id: 'resp_decide',
        output_text: 'B',
        output_parsed: 'B'
      })
      .mockResolvedValueOnce({
        id: 'resp_plan',
        output_text: JSON.stringify({
          intro: 'Here are some movies',
          picks: [
            { title: 'Failing Movie', year: 1990, reason: 'This will fail' },
            { title: 'Working Movie', year: 1995, reason: 'This will work' }
          ]
        }),
        output_parsed: {
          intro: 'Here are some movies',
          picks: [
            { title: 'Failing Movie', year: 1990, reason: 'This will fail' },
            { title: 'Working Movie', year: 1995, reason: 'This will work' }
          ]
        }
      })

    const req = makeRequest({
      id: 'chat7',
      messages: [{ id: 'u7', role: 'user', content: 'Recommend movies' }],
    })
    const res = await POST(req)
    const data = await res.json() as any
    
    // Only the working movie should be included
    expect(data.picks.length).toBe(1)
    expect(data.picks[0].title).toBe('Working Movie')
  })
})

describe('/api/chat-v2 edge cases and error handling', () => {
  it('handles missing OpenAI API key', async () => {
    // Store original API key
    const originalApiKey = process.env.OPENAI_API_KEY
    
    // Remove API key for this test
    delete process.env.OPENAI_API_KEY
    
    const req = makeRequest({
      id: 'chat8',
      messages: [{ id: 'u8', role: 'user', content: 'Hello' }],
    })
    
    // Should return 500 error when API key is missing
    const res = await POST(req)
    expect(res.status).toBe(500)
    
    const data = await res.json()
    expect(data.error).toBe('OpenAI API key not configured')
    
    // Restore original API key
    if (originalApiKey) {
      process.env.OPENAI_API_KEY = originalApiKey
    } else {
      delete process.env.OPENAI_API_KEY
    }
  })

  it('handles malformed request body', async () => {
    const req = makeRequest({
      // Missing required fields
      messages: []
    })
    
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('handles empty messages array', async () => {
    const req = makeRequest({
      id: 'chat9',
      messages: []
    })
    
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('handles missing last user message', async () => {
    const req = makeRequest({
      id: 'chat9',
      messages: [
        { id: 'u1', role: 'assistant', content: 'Hello' }
      ]
    })
    
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

describe('/api/chat-v2 performance and timing', () => {
  it('logs timing information for Mode A', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
    
    mockOpenAI.responses.create
      .mockResolvedValueOnce({
        id: 'resp_decide',
        output_text: 'A',
        output_parsed: 'A'
      })
      .mockResolvedValueOnce({
        id: 'resp_text',
        output_text: 'Hello there!',
        output_parsed: 'Hello there!'
      })

    const req = makeRequest({
      id: 'chat11',
      messages: [{ id: 'u11', role: 'user', content: 'Hi!' }],
    })
    await POST(req)
    
    // Should log timing information
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('TIMINGS (Mode A')
    )
    
    consoleSpy.mockRestore()
  })

  it('logs timing information for Mode B', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
    
    mockOpenAI.responses.create
      .mockResolvedValueOnce({
        id: 'resp_decide',
        output_text: 'B',
        output_parsed: 'B'
      })
      .mockResolvedValueOnce({
        id: 'resp_plan',
        output_text: JSON.stringify({
          intro: 'Here are some movies',
          picks: [{ title: 'Test Movie', year: 1990, reason: 'Test reason' }]
        }),
        output_parsed: {
          intro: 'Here are some movies',
          picks: [{ title: 'Test Movie', year: 1990, reason: 'Test reason' }]
        }
      })

    const req = makeRequest({
      id: 'chat12',
      messages: [{ id: 'u12', role: 'user', content: 'Recommend movies' }],
    })
    await POST(req)
    
    // Should log timing information
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('TIMINGS (Mode B)')
    )
    
    consoleSpy.mockRestore()
  })
})


