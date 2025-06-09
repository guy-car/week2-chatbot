import { openai } from '@ai-sdk/openai';
import { streamText, type CoreMessage } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json() as {
    messages: CoreMessage[]
  };

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: 'You are a helpful assistant who is knwoledgeable about films, shows, animes and all sorts of video work. You like to make recommendations based on what the user previously liked and what the user is in the mood for.',
    messages: messages
  });

  return result.toDataStreamResponse({
        getErrorMessage: error => {
            if (error == null) {
                return 'unknown error';
            }

            if (typeof error === 'string') {
                return error;
            }

            if (error instanceof Error) {
                return error.message;
            }

            return JSON.stringify(error);
        },
    })
}