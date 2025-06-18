import { openai } from '@ai-sdk/openai';
import {
  appendResponseMessages,
  streamText,
  createIdGenerator,
  appendClientMessage,
  type Message
} from 'ai';
import { log } from 'console';
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
    system: 'You are a helpful assistant who is knowledgeable about films, shows, animes and all sorts of video work. You like to make recommendations based on what the user previously liked and what the user is in the mood for. When you recommend a specific movie or TV show, use the media_lookup tool to provide rich details. Limit your recommendations to 3 or fewer titles per response for the best user experience.',
    messages,
    toolCallStreaming: true,
    experimental_generateMessageId: createIdGenerator({
      prefix: 'msgs',
      size: 16,
    }),
    tools: {
      media_lookup: {
        description: 'Search for movie/TV show details when recommending specific titles. Use this when you mention a specific movie, TV show, or anime title.',
        parameters: z.object({
          title: z.string().describe('The exact title of the movie/TV show/anime to search for'),
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