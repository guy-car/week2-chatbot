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
    system: `You are Watch Genie, a magical movie enthusiast who grants perfect viewing wishes. You have an uncanny ability to sense exactly what someone needs to watch at any given moment.

PERSONALITY:
- Warm and intuitive, like a friend who always knows the perfect movie
- Occasionally playful with subtle magical references ("Your wish is my command", "I sense you need...", "The perfect spell for your mood is...")
- Never overdo the genie theme - stay natural and conversational
- Express genuine enthusiasm about great films

RESPONSE RULES:
- Recommend 1-3 titles maximum per response
- Keep responses under 100 words
- Write conversationally, with occasional magical flair
- Include title and year naturally (e.g., "The perfect spell for your mood is Inception (2010)")
- Focus on the emotional experience - how the film will make them feel
- No bullet points, lists, or formatted text
- No image URLs or markdown
- no Emojis

MANDATORY TOOL USAGE:
When you recommend any specific movie, TV show, or documentary by name, you MUST ALWAYS call the media_lookup tool for it. This is not optional.

Examples:
- If you write "Chef's Table (2015)" → MUST call media_lookup with title: "Chef's Table"
- If you write "The Bear (2022)" → MUST call media_lookup with title: "The Bear"
- If you write "check out Inception" → MUST call media_lookup with title: "Inception"

NEVER skip the tool call. The tool provides important data for the user interface.

Remember: You're not just recommending movies - you're granting wishes for the perfect viewing experience.`,
    messages,
    toolCallStreaming: true,
    experimental_generateMessageId: createIdGenerator({
      prefix: 'msgs',
      size: 16,
    }),
    tools: {
      media_lookup: {
        description: 'MANDATORY: Call this for every movie/TV show/documentary you recommend by name. Examples: If you mention "Chef\'s Table", call with title: "Chef\'s Table". Never skip this step.',
        parameters: z.object({
          title: z.string().describe('The exact title as written in your response'),
        }),
        execute: async ({ title }: { title: string }) => {
          try {
            // Using multi search - searches movies, TV, and people, sorted by popularity
            console.log("Im calling the movie look up tool")
            console.log('TMDB API Key:', process.env.TMDB_API_KEY);
            const searchUrl = `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(title)}&include_adult=false&language=en-US&page=1`;
            console.log(`Search URL: ${searchUrl}`)
            const options = {
              method: 'GET',
              headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${process.env.TMDB_API_KEY}`, // Add your API key here
              },
            };
            const searchResponse = await fetch(searchUrl, options)
            const searchData = await searchResponse.json() as {
              results?: Array<{
                id: number;
                title?: string;
                name?: string;
                poster_path?: string;
                release_date?: string;
                first_air_date?: string;
                vote_average: number;
                overview: string;
                media_type: 'movie' | 'tv' | 'person';
              }>;
            };
            console.log("Search response data: ", searchData)

            if (!searchData.results || searchData.results.length === 0) {
              return { error: 'No results found' };
            }

            // Take the first result (most popular match)
            const item = searchData.results[0];
            if (!item || (item.media_type !== 'movie' && item.media_type !== 'tv')) {
              return { error: 'No movie or TV show found' };
            }

            // Filter to only movies and TV shows (exclude people)
            if (item.media_type !== 'movie' && item.media_type !== 'tv') {
              return { error: 'No movie or TV show found' };
            }

            return {
              id: item.id,
              title: item.title ?? item.name,
              poster_url: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
              release_date: item.release_date ?? item.first_air_date,
              rating: item.vote_average,
              overview: item.overview,
              media_type: item.media_type
            };

          } catch (error) {
            console.error('TMDB API error:', error);
            return { error: 'Failed to fetch movie data' };
          }
        }
      }
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