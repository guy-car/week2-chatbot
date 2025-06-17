import { openai } from '@ai-sdk/openai';
import {
    appendResponseMessages,
    streamText,
    createIdGenerator,
    appendClientMessage,
    type Message
} from 'ai';
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
        system: `You are a helpful assistant who is knowledgeable about films, shows, animes and all sorts of video work. You like to make recommendations based on what the user previously liked and what the user is in the mood for.

IMPORTANT: At the end of every response, add a line with contextual action chips in this exact format:
CHIPS: [chip1] | [chip2] | [chip3] | [chip4]

The chips should be VERY SPECIFIC to what you just recommended or discussed. Examples:
- If you recommend "The Wire": [Add The Wire to watchlist] | [Tell me more about The Wire] | [I've seen The Wire] | [Show similar crime dramas]
- If you mention multiple shows: [Tell me more about True Detective] | [Add Brooklyn Nine-Nine to watchlist] | [I prefer serious over comedy] | [Show more HBO shows]

Make the chips actionable and specific to the exact content you mentioned.`,
        messages,
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