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
import { mediaLookupWithYear_2024_07_17_v3 } from '../prompts/promptExperiments';

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

  // Log the raw assistant message content for output inspection
  // (Add this after the assistant generates its response, e.g., after result is available)

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

  // Wrap the ID generator to log every generated ID
  const idGen = createIdGenerator({
    prefix: 'msgs',
    size: 16,
  });
  const loggingIdGen = () => {
    const id = idGen();
    console.log('[ID GEN]', id);
    return id;
  };

  const result = streamText({
    model: openai('gpt-4o'),
    temperature: 0.8,
    // Using basePrompt for now; see .docs/knowledge/chat-data-flow-state-report.md for rationale
    system: mediaLookupWithYear_2024_07_17_v3,
    messages,
    toolCallStreaming: true,
    experimental_generateMessageId: loggingIdGen,
    tools: {
      media_lookup: {
        description: 'MANDATORY: Call this for every movie/TV show/documentary you recommend by name. You MUST provide both the exact title and the year of release as separate parameters whenever possible. Examples: If you mention "Chef\'s Table (2015)", call with title: "Chef\'s Table", year: 2015. Never skip this step.',
        parameters: z.object({
          title: z.string().describe('The exact title as written in your response'),
          year: z.number().describe('The year of release (e.g., 2015). REQUIRED for new logic, but optional for backward compatibility.' ).optional(),
        }),
        execute: async ({ title, year }: { title: string, year?: number }) => {
          try {
            const apiKey = process.env.TMDB_API_KEY;
            if (!apiKey) {
              throw new Error('TMDB_API_KEY is not set');
            }

            // Helper to fetch and log
            const fetchTMDB = async (endpoint: string, params: Record<string, string | number | undefined>, type: 'movie' | 'tv') => {
              const paramStr = Object.entries(params)
                .filter(([_, v]) => v !== undefined)
                .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
                .join('&');
              const url = `https://api.themoviedb.org/3/${endpoint}?${paramStr}`;
              console.log(`[TMDB_FETCH] ${type.toUpperCase()} endpoint: ${url}`);
              const options = {
                method: 'GET',
                headers: {
                  'accept': 'application/json',
                  'Authorization': `Bearer ${apiKey}`,
                },
              };
              const res = await fetch(url, options);
              return res.json() as Promise<TMDBSearchResponse>;
            };

            // Try movie search
            let movieResults: TMDBSearchResult[] = [];
            let tvResults: TMDBSearchResult[] = [];
            if (title) {
              const movieParams: Record<string, string | number | undefined> = { query: title, include_adult: 'false', language: 'en-US', page: 1 };
              if (year) movieParams.year = year;
              const movieData = await fetchTMDB('search/movie', movieParams, 'movie');
              movieResults = movieData.results?.map(r => ({ ...r, media_type: 'movie' })) ?? [];

              const tvParams: Record<string, string | number | undefined> = { query: title, include_adult: 'false', language: 'en-US', page: 1 };
              if (year) tvParams.first_air_date_year = year;
              const tvData = await fetchTMDB('search/tv', tvParams, 'tv');
              tvResults = tvData.results?.map(r => ({ ...r, media_type: 'tv' })) ?? [];
            }

            // If both are empty, fallback to multi
            let allResults: TMDBSearchResult[] = [...movieResults, ...tvResults];
            if (allResults.length === 0) {
              const multiParams: Record<string, string | number | undefined> = { query: title, include_adult: 'false', language: 'en-US', page: 1 };
              const multiData = await fetchTMDB('search/multi', multiParams, 'movie');
              allResults = multiData.results?.filter(r => r.media_type === 'movie' || r.media_type === 'tv') ?? [];
            }

            if (!allResults.length) {
              return { error: 'No results found' };
            }

            // Scoring logic (prioritize exact title and year matches)
            const cleanTitle = title.trim().toLowerCase();
            const scored = allResults.map(item => {
              let score = 0;
              const itemTitle = (item.title ?? item.name ?? '').toLowerCase();
              const itemYear = parseInt(item.release_date?.substring(0, 4) ?? item.first_air_date?.substring(0, 4) ?? '0');
              const logDetails = [];
              // Exact title match
              if (itemTitle === cleanTitle) {
                score += 50;
                logDetails.push('exact title match +50');
              }
              // Partial title match
              else if (itemTitle.includes(cleanTitle)) {
                score += 20;
                logDetails.push('partial title match +20');
              }
              // Year matching
              if (year && itemYear) {
                if (itemYear === year) {
                  score += 60;
                  logDetails.push('exact year match +60');
                } else {
                  const diff = Math.abs(itemYear - year);
                  score -= diff * 2;
                  logDetails.push(`year diff -${diff * 2}`);
                }
              }
              // Popularity bonus
              const popBonus = Math.min(item.popularity / 100, 10);
              score += popBonus;
              if (popBonus > 0) logDetails.push(`popularity +${popBonus.toFixed(2)}`);
              // Prefer movies over TV for ambiguous searches
              if (item.media_type === 'movie') {
                score += 5;
                logDetails.push('movie bonus +5');
              }
              return { item, score };
            });
            scored.sort((a, b) => b.score - a.score);
            if (scored.length > 0 && scored[0]) {
              const best = scored[0].item;
              return {
                id: best.id,
                title: best.title ?? best.name ?? '',
                poster_url: best.poster_path ? `https://image.tmdb.org/t/p/w500${best.poster_path}` : null,
                release_date: best.release_date ?? best.first_air_date,
                rating: best.vote_average,
                overview: best.overview,
                media_type: best.media_type as 'movie' | 'tv'
              };
            }
            return { error: 'No suitable movie or TV show found' };
          } catch (error) {
            console.error('TMDB API error:', error);
            return { error: 'Failed to fetch movie data' };
          }
        }
      }
    },
    async onFinish({ response }) {
      console.log('🎯 onFinish called with response messages:', response.messages.length);
      
      // Log the raw response messages before processing
      console.log('📨 Raw response messages:', response.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        contentLength: msg.content?.length ?? 0,
        hasParts: false,
        partsCount: 0
      })));
      
      const allMessages = appendResponseMessages({
        messages,
        responseMessages: response.messages,
      });
      
      // Log all messages being saved to understand the structure
      console.log('💾 Messages being saved to database:', allMessages.map(msg => ({
        id: msg.id,
        role: msg.role,
        contentLength: msg.content?.length ?? 0,
        hasParts: false,
        partsCount: 0
      })));
      
      await saveChat({
        id,
        messages: allMessages,
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