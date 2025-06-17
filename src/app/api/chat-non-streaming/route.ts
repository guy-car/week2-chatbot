import { openai } from '@ai-sdk/openai';
import {
    appendResponseMessages,
    streamText,  // Back to streamText
    createIdGenerator,
    appendClientMessage,
    type Message
} from 'ai';
import { saveChat, loadChat } from 'tools/chat-store';
import { errorHandler } from '~/lib/utils';

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
        system: `You are a helpful assistant who is knowledgeable about films, shows, animes and all sorts of video work. You like to make recommendations based on what the user previously liked and what the user is in the mood for.

IMPORTANT: Keep your main response to 100 words or less, then add contextual action chips.

At the end of every response, add a line with contextual action chips in this exact format:
CHIPS: [chip1] | [chip2] | [chip3] | [chip4]

The chips should be ACTIONABLE BUTTONS, not just keywords. Examples:
- If you recommend "Walter Mitty": [Add Walter Mitty to watchlist] | [Tell me more about Walter Mitty] | [I've seen it] | [Show similar adventure films]
- If you recommend multiple movies: [Add The Matrix to watchlist] | [Tell me about Inception] | [Show sci-fi classics] | [I prefer action over drama]

Make each chip a specific ACTION the user can take, not just descriptive words.`,
        messages,
        experimental_generateMessageId: createIdGenerator({
            prefix: 'msgs',
            size: 16,
        }),
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

    void result.consumeStream();

    return result.toDataStreamResponse({
        getErrorMessage: errorHandler,
    });
}