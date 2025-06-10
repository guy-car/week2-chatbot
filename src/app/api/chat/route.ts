import { openai } from '@ai-sdk/openai';
import { appendResponseMessages, 
  streamText, 
  createIdGenerator, 
  appendClientMessage, 
  type Message } from 'ai';
import { saveChat, loadChat } from 'tools/chat-store';
import { z } from 'zod';
import { errorHandler } from '~/lib/utils';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {

  const { message, id } = await req.json() as {
    message: Message,
    id: string
  };

  const previousMessages = await loadChat(id);
  
  const messages = appendClientMessage({
    messages: previousMessages,
    message,
  });

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: 'You are a helpful assistant who is knwoledgeable about films, shows, animes and all sorts of video work. You like to make recommendations based on what the user previously liked and what the user is in the mood for.',
    messages,
    toolCallStreaming: true,
    experimental_generateMessageId: createIdGenerator({
      prefix: 'msgs',
      size: 16,
    }),
    tools: {
      // server-side tool with execute function:
      getWeatherInformation: {
        description: 'show the weather in a given city to the user',
        parameters: z.object({ city: z.string() }),
        execute: async ({}: { city: string }) => {
          const weatherOptions = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy'];
          return weatherOptions[
            Math.floor(Math.random() * weatherOptions.length)
          ];
        },
      },
      // client-side tool that starts user interaction:
      askForConfirmation: {
        description: 'Ask the user for confirmation.',
        parameters: z.object({
          message: z.string().describe('The message to ask for confirmation.'),
        }),
      },
      // client-side tool that is automatically executed on the client:
      getLocation: {
        description:
          'Get the user location. Always ask for confirmation before using this tool.',
        parameters: z.object({}),
      },
    },
    async onFinish({ response }) {
      await saveChat({
        id,
        messages: appendResponseMessages({
          messages,
          responseMessages: response.messages,
        }),
      });
    },
  });

    // consume the stream to ensure it runs to completion & triggers onFinish
  // even when the client response is aborted:
  void result.consumeStream(); // no await

return result.toDataStreamResponse({
  getErrorMessage: errorHandler,
})
}
