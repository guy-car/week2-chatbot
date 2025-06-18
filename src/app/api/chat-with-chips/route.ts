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

IMPORTANT: Keep your main response to 100 words or less, then add contextual action chips.

At the end of every response, add a line with contextual action chips in this exact format:
CHIPS: [chip1] | [chip2] | [chip3] | [chip4]

STRICT FORMATTING RULES:
- When recommending a movie/show/anime, ALWAYS include exactly one chip that says: "Add [EXACT TITLE] to watchlist"
- Only recommend one movie at a time
- Use the exact title with proper capitalization and spacing
- Other chips should be specific actions like: "Tell me more about [TITLE]" | "I've seen [TITLE]" | "Show similar [genre] movies"

Examples:
- If you recommend "The Wire": [Add The Wire to watchlist] | [Tell me more about The Wire] | [I've seen The Wire] | [Show similar crime dramas]
- If you recommend "Spirited Away": [Add Spirited Away to watchlist] | [Tell me more about Spirited Away] | [I've seen Spirited Away] | [Show more Studio Ghibli films]

NEVER deviate from the "Add [EXACT TITLE] to watchlist" format for watchlist chips.

Remember: Main response maximum 100 words, then add the CHIPS line.`,
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