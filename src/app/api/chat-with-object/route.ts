// src/app/api/chat-with-object/route.ts
import { openai } from '@ai-sdk/openai';
import {
    appendResponseMessages,
    streamObject,
    createIdGenerator,
    appendClientMessage,
    type Message
} from 'ai';
import { saveChat, loadChat } from 'tools/chat-store';
import { z } from 'zod';
import { errorHandler } from '~/lib/utils';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Define the response schema
const responseSchema = z.object({
    text: z.string().describe('The main natural language response to the user'),
    chips: z.array(z.string()).describe('Array of contextual action chips for the user to click'),
    movieTitle: z.string().optional().describe('Movie title for TMDB lookup (not displayed to user)')
});

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

    const result = streamObject({
        model: openai('gpt-4o-mini'),
        system: `You are a helpful assistant who is knowledgeable about films, shows, animes and all sorts of video work. You like to make recommendations based on what the user previously liked and what the user is in the mood for.

IMPORTANT: You will respond with a structured object containing three fields:
1. "text" - Your main response (100 words or less)
2. "chips" - Array of contextual action buttons 
3. "movieTitle" - Exact movie title for database lookup (only when recommending a movie)

RESPONSE STRUCTURE RULES:
- Keep your main "text" response to 100 words or less
- Always include 3-4 contextual action "chips" 
- When recommending a movie/show/anime, include the exact title in "movieTitle" field
- Only recommend one movie at a time
- Chips should be specific actions like: "Tell me more about [TITLE]", "I've seen [TITLE]", "Show similar [genre] movies"

EXAMPLES:

When recommending a movie:
{
  "text": "Based on your love for mind-bending sci-fi, I highly recommend Inception. It's a masterfully crafted thriller that explores dreams within dreams, with stunning visuals and a complex narrative that will keep you thinking long after the credits roll.",
  "chips": ["Tell me more about Inception", "I've seen Inception", "Show similar mind-bending movies", "Recommend something lighter"],
  "movieTitle": "Inception"
}

When not recommending a specific movie:
{
  "text": "I'd love to help you find something great to watch! What genre are you in the mood for? Are you looking for something recent or are you open to classics?",
  "chips": ["Recommend a comedy", "Show me recent releases", "I want something from the 90s", "Surprise me with anything"],
  "movieTitle": null
}

Remember: 
- Use exact movie titles with proper capitalization in movieTitle field
- Keep text conversational and under 100 words
- Make chips actionable and specific to continue the conversation`,
        messages,
        schema: responseSchema,
        async onFinish({ object, response }) {
            // Create a message from the structured object for chat history
            const assistantMessage: Message = {
                id: createIdGenerator({ prefix: 'msg', size: 16 })(),
                role: 'assistant',
                content: JSON.stringify(object), // Store the full structured response
                createdAt: new Date(),
            };

            await saveChat({
                id,
                messages: [...messages, assistantMessage],
            });
        },
    });

    return result.toTextStreamResponse({
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
        },
    });
}