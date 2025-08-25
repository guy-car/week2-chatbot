import OpenAI from 'openai'

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { prompt } = (await req.json()) as { prompt: string }
    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing prompt' }), { status: 400 })
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const resp = await client.responses.create({
      model: 'gpt-5',
      input: [
        { role: 'user', content: [{ type: 'input_text', text: prompt }] },
      ],
      reasoning: { effort: 'low' },
      text: {
        verbosity: 'low',
        format: {
          type: 'json_schema',
          name: 'hello',
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: { message: { type: 'string' } },
            required: ['message'],
          },
          strict: true,
        },
      },
    })

    return new Response(
      JSON.stringify({ parsed: resp.output_parsed, output: resp.output, text: resp.output_text }, null, 2),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    return new Response(JSON.stringify({ error: 'server_error', detail: String(e) }), { status: 500 })
  }
}


