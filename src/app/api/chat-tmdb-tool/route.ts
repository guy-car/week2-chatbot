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
import { api } from "~/trpc/server"
import { generateChatTitle } from 'tools/message-utils';

import { auth } from "~/lib/auth";
import { headers } from "next/headers";
import { db } from "~/server/db";
import { tasteProfileService } from "~/app/_services/tasteProfile";

interface TMDBSearchResult {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  overview: string;
  media_type: 'movie' | 'tv' | 'person';
  popularity: number;
}

interface TMDBSearchResponse {
  results?: TMDBSearchResult[];
}

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  console.log('🚀 New request received at:', new Date().toISOString());

  // Get the authenticated user
  const session = await auth.api.getSession({
    headers: await headers()
  });

  const { messages: incomingMessages, id } = await req.json() as {
    messages: Message[],
    id: string
  };

  const message = incomingMessages[incomingMessages.length - 1];

  if (!message) {
    return new Response('No message provided', { status: 400 });
  }

  console.log('📨 Message content:', message.content);
  console.log('📨 Message role:', message.role);

  const previousMessages = await loadChat(id);

  const isFirstUserMessage = !previousMessages.some(msg => msg.role === 'user');

  const messages = appendClientMessage({
    messages: previousMessages,
    message,
  });

  // If it's the first user message, update the chat title
  if (isFirstUserMessage && message.role === 'user') {
    const title = generateChatTitle(message.content);
    api.chat.updateTitle({ chatId: id, title }).catch(err => {
      console.error('Failed to update chat title:', err);
    });
  }

  let tasteProfileSummary = '';
  try {
    if (session?.user?.id) {
      console.log('Fetching profile for user:', session.user.id);
      const profile = await tasteProfileService.getProfileForChat(session.user.id, db);
      tasteProfileSummary = tasteProfileService.generateSummary(profile);
      console.log('Profile summary:', tasteProfileSummary);
    } else {
      console.log('No authenticated user found');
    }
  } catch (error) {
    console.error('Error fetching taste profile:', error);
    // Continue without profile rather than crashing
  }

  const result = streamText({
    model: openai('gpt-4o'),
    temperature: 0.8,
    system: `You are Watch Genie, a magical movie enthusiast who grants perfect viewing wishes. You have an uncanny ability to sense exactly what someone needs to watch at any given moment.

${tasteProfileSummary ? `\n${tasteProfileSummary}\n` : ''}

PERSONALITY:
- Warm and intuitive, like a friend who always knows the perfect movie
- Occasionally playful with subtle magical references ("Your wish is my command", "I sense you need...", "The perfect spell for your mood is...")
- Never overdo the genie theme - stay natural and conversational
- Express genuine enthusiasm about great films

RESPONSE RULES:
- Separate each movie recommendation with a line break
- NO markdown, NO bullets, NO numbers, NO ** formatting
- Just clean text with line breaks between movies
- Recommend 1-3 titles maximum per response
- Keep responses under 100 words
- Write conversationally, with occasional magical flair
- Include title and year naturally (e.g., "The perfect spell for your mood is Inception (2010)")
- Focus on the emotional experience - how the film will make them feel

- No image URLs or markdown
- no Emojis
- IMPORTANT: do not recommend the same movie twice
- **CRITICAL: Vary your opening phrases. Never use "The perfect spell for your mood is" repeatedly**
- **When users ask follow-ups, acknowledge their question naturally before responding**

When recommending movies/shows:
- Always include the year when you know it (e.g., "Ghost in the Shell (1995)")
- This helps ensure the correct version is found
- For remakes or movies with common titles, the year is especially important

MANDATORY TOOL USAGE:
When you recommend any specific movie, TV show, or documentary by name, you MUST ALWAYS call the media_lookup tool for it. This is not optional.

Examples:
- If you write "Chef's Table (2015)" → MUST call media_lookup with title: "Chef's Table"
- If you write "The Bear (2022)" → MUST call media_lookup with title: "The Bear"
- If you write "check out Inception" → MUST call media_lookup with title: "Inception"

NEVER skip the tool call. The tool provides important data for the user interface.`,
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
            console.log(`🔍 Searching for: "${title}"`);

            const searchUrl = `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(title)}&include_adult=false&language=en-US&page=1`;
            const options = {
              method: 'GET',
              headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${process.env.TMDB_API_KEY}`,
              },
            };

            const searchResponse = await fetch(searchUrl, options);
            const searchData = await searchResponse.json() as TMDBSearchResponse;

            if (!searchData.results || searchData.results.length === 0) {
              return { error: 'No results found' };
            }

            // Smart selection with proper typing
            const selectBestMatch = (results: TMDBSearchResult[]): TMDBSearchResult | null => {
              // Extract year if the AI included it in the title
              const yearMatch = /\((\d{4})\)/.exec(title);
              const searchYear = yearMatch ? parseInt(yearMatch[1]) : null;
              const cleanTitle = title.replace(/\s*\(\d{4}\)/, '').trim();

              console.log(`🎯 Looking for: "${cleanTitle}" ${searchYear ? `(${searchYear})` : ''}`);

              const scored = results
                .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
                .map(item => {
                  let score = 0;
                  const itemTitle = item.title ?? item.name ?? '';
                  const itemYear = parseInt(
                    item.release_date?.substring(0, 4) ??
                    item.first_air_date?.substring(0, 4) ?? '0'
                  );

                  // Exact title match (case-insensitive)
                  if (itemTitle.toLowerCase() === cleanTitle.toLowerCase()) {
                    score += 50;
                  }
                  // Partial title match
                  else if (itemTitle.toLowerCase().includes(cleanTitle.toLowerCase())) {
                    score += 20;
                  }

                  // Year matching (if provided)
                  if (searchYear && itemYear) {
                    if (itemYear === searchYear) {
                      score += 30; // Exact year match
                    } else {
                      const yearDiff = Math.abs(itemYear - searchYear);
                      score -= yearDiff * 2; // Penalize by year difference
                    }
                  }

                  // Popularity bonus (normalized)
                  score += Math.min(item.popularity / 100, 10);

                  // Prefer movies over TV for ambiguous searches
                  if (item.media_type === 'movie') score += 5;

                  console.log(`  📊 ${itemTitle} (${itemYear}): score=${score}`);

                  return { item, score };
                });

              // Sort by score descending
              scored.sort((a, b) => b.score - a.score);

              if (scored.length > 0 && scored[0]) {
                console.log(`✅ Selected: ${scored[0].item.title ?? scored[0].item.name}`);
                return scored[0].item;
              }

              return null;
            };

            const item = selectBestMatch(searchData.results);

            if (!item) {
              return { error: 'No suitable movie or TV show found' };
            }

            return {
              id: item.id,
              title: item.title ?? item.name ?? '',
              poster_url: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
              release_date: item.release_date ?? item.first_air_date,
              rating: item.vote_average,
              overview: item.overview,
              media_type: item.media_type as 'movie' | 'tv'
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