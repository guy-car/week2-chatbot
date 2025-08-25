import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'

// Live tests for chat-v2 API endpoint
// These tests make actual HTTP requests to verify the API works end-to-end

const API_BASE = process.env.TEST_API_BASE || 'http://localhost:3000'
const TEST_CHAT_ID = 'test-chat-' + Date.now()

describe('/api/chat-v2 Live Integration Tests', () => {
  beforeAll(async () => {
    // Verify the server is running
    try {
      const response = await fetch(`${API_BASE}/api/chat-v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: TEST_CHAT_ID,
          messages: [{ id: 'test', role: 'user', content: 'ping' }]
        })
      })
      if (!response.ok && response.status !== 400) {
        throw new Error(`Server not responding: ${response.status}`)
      }
    } catch (error) {
      console.warn('⚠️  Server not available, skipping live tests')
      console.warn('   Start the dev server with: npm run dev')
      console.warn('   Or set TEST_API_BASE to point to a running instance')
    }
  })

  afterAll(async () => {
    // Clean up test data if needed
  })

  describe('Mode A: Conversational Responses', () => {
    it('responds to simple greetings with conversational text', async () => {
      const response = await fetch(`${API_BASE}/api/chat-v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: TEST_CHAT_ID,
          messages: [{ id: 'u1', role: 'user', content: 'hi' }]
        })
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      
      expect(data.mode).toBe('A')
      expect(typeof data.text).toBe('string')
      expect(data.text.length).toBeGreaterThan(0)
      expect(data.text.toLowerCase()).toContain('hello')
    }, 30000) // 30s timeout for live API calls

    it('responds to movie-related questions conversationally', async () => {
      const response = await fetch(`${API_BASE}/api/chat-v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: TEST_CHAT_ID,
          messages: [{ id: 'u2', role: 'user', content: 'What is your favorite movie genre?' }]
        })
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      
      expect(data.mode).toBe('A')
      expect(typeof data.text).toBe('string')
      expect(data.text.length).toBeGreaterThan(0)
      // Should be conversational, not a recommendation
      expect(data.picks).toBeUndefined()
    }, 30000)

    it('handles follow-up questions in the same chat', async () => {
      // First question
      const response1 = await fetch(`${API_BASE}/api/chat-v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: TEST_CHAT_ID,
          messages: [
            { id: 'u3', role: 'user', content: 'Tell me about yourself' }
          ]
        })
      })

      expect(response1.ok).toBe(true)
      const data1 = await response1.json()
      expect(data1.mode).toBe('A')

      // Follow-up question (should maintain context)
      const response2 = await fetch(`${API_BASE}/api/chat-v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: TEST_CHAT_ID,
          messages: [
            { id: 'u3', role: 'user', content: 'Tell me about yourself' },
            { id: 'a1', role: 'assistant', content: data1.text },
            { id: 'u4', role: 'user', content: 'What else can you do?' }
          ]
        })
      })

      expect(response2.ok).toBe(true)
      const data2 = await response2.json()
      expect(data2.mode).toBe('A')
      expect(typeof data2.text).toBe('string')
    }, 60000)
  })

  describe('Mode B: Movie Recommendations', () => {
    it('provides movie recommendations for explicit requests', async () => {
      const response = await fetch(`${API_BASE}/api/chat-v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: TEST_CHAT_ID,
          messages: [{ id: 'u5', role: 'user', content: 'Recommend 3 action movies from the 1990s' }]
        })
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      
      expect(data.mode).toBe('B')
      expect(typeof data.text).toBe('string')
      expect(data.text.length).toBeGreaterThan(0)
      expect(Array.isArray(data.picks)).toBe(true)
      expect(data.picks.length).toBeGreaterThan(0)
      expect(data.picks.length).toBeLessThanOrEqual(3)
      
      // Verify pick structure
      data.picks.forEach((pick: any) => {
        expect(pick).toHaveProperty('id')
        expect(pick).toHaveProperty('title')
        expect(pick).toHaveProperty('media_type')
        expect(pick).toHaveProperty('release_date')
        expect(pick.media_type).toMatch(/^(movie|tv)$/)
      })
    }, 60000)

    it('handles different recommendation requests', async () => {
      const requests = [
        'Recommend a sci-fi movie',
        'Suggest 2 comedy shows',
        'What are some good thrillers?'
      ]

      for (const request of requests) {
        const response = await fetch(`${API_BASE}/api/chat-v2`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: TEST_CHAT_ID,
            messages: [{ id: `u-${Date.now()}`, role: 'user', content: request }]
          })
        })

        expect(response.ok).toBe(true)
        const data = await response.json()
        
        expect(data.mode).toBe('B')
        expect(typeof data.text).toBe('string')
        expect(Array.isArray(data.picks)).toBe(true)
        expect(data.picks.length).toBeGreaterThan(0)
      }
    }, 120000)

    it('avoids duplicate recommendations within the same chat', async () => {
      // First recommendation request
      const response1 = await fetch(`${API_BASE}/api/chat-v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: TEST_CHAT_ID,
          messages: [{ id: 'u6', role: 'user', content: 'Recommend 3 action movies' }]
        })
      })

      expect(response1.ok).toBe(true)
      const data1 = await response1.json()
      const firstPicks = data1.picks.map((p: any) => p.title)

      // Second recommendation request (should avoid duplicates)
      const response2 = await fetch(`${API_BASE}/api/chat-v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: TEST_CHAT_ID,
          messages: [
            { id: 'u6', role: 'user', content: 'Recommend 3 action movies' },
            { id: 'a2', role: 'assistant', content: data1.text },
            { id: 'u7', role: 'user', content: 'Recommend 3 more action movies' }
          ]
        })
      })

      expect(response2.ok).toBe(true)
      const data2 = await response2.json()
      const secondPicks = data2.picks.map((p: any) => p.title)

      // Should not have overlapping titles
      const overlap = firstPicks.filter(title => secondPicks.includes(title))
      expect(overlap.length).toBe(0)
    }, 120000)
  })

  describe('Performance and Latency', () => {
    it('responds to simple queries within reasonable time', async () => {
      const start = Date.now()
      
      const response = await fetch(`${API_BASE}/api/chat-v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: TEST_CHAT_ID,
          messages: [{ id: 'u8', role: 'user', content: 'hello' }]
        })
      })

      const duration = Date.now() - start
      
      expect(response.ok).toBe(true)
      expect(duration).toBeLessThan(10000) // Should respond within 10s
      
      const data = await response.json()
      expect(data.mode).toBe('A')
    }, 15000)

    it('handles recommendation requests within acceptable time', async () => {
      const start = Date.now()
      
      const response = await fetch(`${API_BASE}/api/chat-v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: TEST_CHAT_ID,
          messages: [{ id: 'u9', role: 'user', content: 'Recommend 2 movies' }]
        })
      })

      const duration = Date.now() - start
      
      expect(response.ok).toBe(true)
      expect(duration).toBeLessThan(20000) // Should respond within 20s
      
      const data = await response.json()
      expect(data.mode).toBe('B')
      expect(Array.isArray(data.picks)).toBe(true)
    }, 25000)
  })

  describe('Error Handling and Edge Cases', () => {
    it('handles malformed requests gracefully', async () => {
      const response = await fetch(`${API_BASE}/api/chat-v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Missing required fields
          messages: []
        })
      })

      expect(response.status).toBe(400)
    })

    it('handles empty message content', async () => {
      const response = await fetch(`${API_BASE}/api/chat-v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: TEST_CHAT_ID,
          messages: [{ id: 'u10', role: 'user', content: '' }]
        })
      })

      // Should either handle gracefully or return error
      expect([200, 400]).toContain(response.status)
    })

    it('handles very long messages', async () => {
      const longMessage = 'a'.repeat(10000) // 10k character message
      
      const response = await fetch(`${API_BASE}/api/chat-v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: TEST_CHAT_ID,
          messages: [{ id: 'u11', role: 'user', content: longMessage }]
        })
      })

      // Should handle long messages (either process or reject gracefully)
      expect([200, 400, 413]).toContain(response.status)
    }, 30000)
  })

  describe('Response Format Validation', () => {
    it('returns consistent response structure for Mode A', async () => {
      const response = await fetch(`${API_BASE}/api/chat-v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: TEST_CHAT_ID,
          messages: [{ id: 'u12', role: 'user', content: 'What is your name?' }]
        })
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      
      // Mode A response structure
      expect(data).toHaveProperty('mode', 'A')
      expect(data).toHaveProperty('text')
      expect(typeof data.text).toBe('string')
      expect(data.text.length).toBeGreaterThan(0)
      
      // Should not have picks for Mode A
      expect(data.picks).toBeUndefined()
    }, 30000)

    it('returns consistent response structure for Mode B', async () => {
      const response = await fetch(`${API_BASE}/api/chat-v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: TEST_CHAT_ID,
          messages: [{ id: 'u13', role: 'user', content: 'Recommend a movie' }]
        })
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      
      // Mode B response structure
      expect(data).toHaveProperty('mode', 'B')
      expect(data).toHaveProperty('text')
      expect(data).toHaveProperty('picks')
      expect(typeof data.text).toBe('string')
      expect(Array.isArray(data.picks)).toBe(true)
      
      // Each pick should have required fields
      data.picks.forEach((pick: any) => {
        expect(pick).toHaveProperty('id')
        expect(pick).toHaveProperty('title')
        expect(pick).toHaveProperty('media_type')
        expect(pick).toHaveProperty('release_date')
      })
    }, 60000)
  })
})
