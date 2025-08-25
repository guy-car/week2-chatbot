import { describe, it, expect } from '@jest/globals'

const RUN_LIVE = process.env.LIVE_OPENAI_TESTS === 'true'
const HAS_KEY = !!process.env.OPENAI_API_KEY

describe('OpenAI Responses API (live)', () => {
  if (!RUN_LIVE || !HAS_KEY) {
    it('skipped (set LIVE_OPENAI_TESTS=true with OPENAI_API_KEY)', () => {
      expect(true).toBe(true)
    })
    return
  }

  it('returns output_text for a minimal request', async () => {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-5',
        input: 'Say hello in one short sentence.',
        reasoning: { effort: 'low' },
        text: { verbosity: 'low' }
      })
    })

    if (!res.ok) {
      const t = await res.text()
      throw new Error(`OpenAI live test failed: ${res.status} ${res.statusText} :: ${t}`)
    }

    const data = await res.json() as any
    expect(typeof data.output_text).toBe('string')
    expect(data.output_text.length).toBeGreaterThan(0)
  }, 20000)
})


