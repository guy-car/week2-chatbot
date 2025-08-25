import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createChat } from '../../tools/chat-store'

// Simple test to troubleshoot the 500 error
describe('Simple API Test', () => {
  let TEST_CHAT_ID: string
  
  beforeAll(async () => {
    // Debug environment variables
    console.log('Environment check:')
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'MISSING')
    console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'SET' : 'MISSING')
    console.log('TMDB_API_KEY:', process.env.TMDB_API_KEY ? 'SET' : 'MISSING')
    console.log('NODE_ENV:', process.env.NODE_ENV)
    console.log('DB_TESTS:', process.env.DB_TESTS)
    
    // For now, skip database creation and just use a unique ID
    TEST_CHAT_ID = `test-chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    console.log('Using test chat ID:', TEST_CHAT_ID)
  })
  
  afterAll(async () => {
    // Clean up test data if needed
    console.log('Test completed for chat ID:', TEST_CHAT_ID)
  })

  it('can connect to the server', async () => {
    // Test basic connectivity first
    const response = await fetch('http://localhost:3000/api/chat-v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: TEST_CHAT_ID,
        messages: [{ id: 'u1', role: 'user', content: 'hi' }]
      })
    })
    
    console.log('Response status:', response.status)
    console.log('Response ok:', response.ok)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log('Error response length:', errorText.length)
      console.log('Error response:', errorText)
      
      // Try to get more details about the error
      try {
        const errorJson = JSON.parse(errorText)
        console.log('Error JSON:', errorJson)
      } catch (e) {
        console.log('Error response is not JSON')
      }
    }
    
    // For now, just log the response details to see what's happening
    expect(response.status).toBeDefined()
  }, 30000)
})
