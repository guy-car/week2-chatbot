'use client'

import { type Message, useChat } from '@ai-sdk/react';
import { createIdGenerator } from 'ai';

import { useState, useEffect, useRef } from 'react'
import { MovieCardsSection } from './MovieCardsSection'
import type { MovieData } from '~/app/types'
import { ConversationChips } from './ConversationChips'
import { type Chip } from '~/app/types'
import { useChatTitle } from '~/app/_hooks/useChatTitle'

import { useRouter } from 'next/navigation'
import { api } from "~/trpc/react"
import { loadMoviesForChat } from 'tools/chat-store';
import { cn } from "~/lib/utils"
import { buttonVariants, cardVariants, inputVariants } from '~/styles/component-styles';





function extractMoviesFromMessage(message: Message): MovieData[] {
  const movies: MovieData[] = [];

  message.parts?.forEach(part => {
    if (
      part.type === 'tool-invocation' &&
      part.toolInvocation.toolName === 'media_lookup' &&
      part.toolInvocation.state === 'result' &&
      'result' in part.toolInvocation &&
      part.toolInvocation.result &&
      !('error' in part.toolInvocation.result)
    ) {
      movies.push(part.toolInvocation.result as MovieData);
    }
  });

  console.log('[CLIENT_EXTRACT_MOVIES] Extracted movies from live message part:', movies);
  return movies;
}

export default function Chat({
  id,
  initialMessages,
}: { id?: string | undefined; initialMessages?: Message[] } = {}) {


  // ========== HOOKS SECTION START ==========

  const [recommendedMovies, setRecommendedMovies] = useState<MovieData[]>([])
  const [conversationChips, setConversationChips] = useState<Chip[]>([])
  const [savedMovies, setSavedMovies] = useState<Map<string, MovieData[]>>(new Map());
  const [modeBIntro, setModeBIntro] = useState<string>('')

  const apiVersion = process.env.NEXT_PUBLIC_CHAT_API_VERSION ?? 'v1'
  const { messages, input, status, error, handleInputChange, handleSubmit, reload, append } = useChat({
    api: apiVersion === 'v2' ? '/api/chat-v2' : '/api/chat-tmdb-tool',
    body: {
    },
    id,
    initialMessages,
    onResponse: async (response) => {
      try {
        const contentType = response.headers.get('content-type') ?? response.headers.get('Content-Type') ?? ''
        if (!contentType.includes('application/json')) return

        const cloned = response.clone()
        const raw: unknown = await cloned.json().catch(() => undefined)

        const isModeBResponse = (data: unknown): data is { mode: 'B'; picks: MovieData[] } => {
          if (typeof data !== 'object' || data === null) return false
          const obj = data as Record<string, unknown>
          if (obj.mode !== 'B') return false
          if (!Array.isArray(obj.picks)) return false
          // Basic shape check for MovieData
          return (obj.picks as unknown[]).every((p) => {
            if (typeof p !== 'object' || p === null) return false
            const m = p as { id?: unknown; title?: unknown; media_type?: unknown }
            return typeof m.id === 'number' && typeof m.title === 'string' && (m.media_type === 'movie' || m.media_type === 'tv')
          })
        }

        if (isModeBResponse(raw)) {
          const introText = ((): string => {
            const obj = raw as Record<string, unknown>
            if (typeof obj.text === 'string') return obj.text
            if (typeof obj.intro === 'string') return obj.intro
            return ''
          })()
          setModeBIntro(introText)
          setRecommendedMovies(raw.picks)
          setConversationChips([])

          if (id) {
            try {
              const movieData = await loadMoviesForChat(id)
              const movieMap = new Map<string, MovieData[]>()
              movieData.forEach(({ messageId, movies }) => {
                movieMap.set(messageId, movies)
              })
              setSavedMovies(movieMap)
            } catch {
              // Posters already set from response
            }
          }
        }
      } catch {
        // ignore parse issues; streaming path will handle Mode A
      }
    },
    onError: (error) => {
      console.log('useChat error:', error);
    },
    onFinish: (message) => {
      void (async () => {

        const moviesFromThisResponse = extractMoviesFromMessage(message);

        // Get the last user message
        const lastUserMsg = messages
          .filter(m => m.role === 'user')
          .pop();

        if (lastUserMsg?.content && message.role === 'assistant' && message.content) {
          // Get conversation context
          const recentMessages = [...messages, message].slice(-6).map(m => ({
            role: m.role,
            content: m.content || ''
          }));

          try {

            const response = await fetch('/api/generate-chips', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                lastUserMessage: lastUserMsg.content,
                lastAssistantMessage: message.content,
                recommendedMovies: moviesFromThisResponse.map(m => ({
                  title: m.title,
                  release_date: m.release_date
                })),
                conversationContext: recentMessages
              })
            });

            if (!response.ok) throw new Error('Failed to generate chips');

            const data = await response.json() as { chips: Chip[] };
            setConversationChips(data.chips);

          } catch (error) {
            console.error('Failed to generate chips:', error);
            setConversationChips([]);
          }
        }
      })();
    },
    maxSteps: 5,
    sendExtraMessageFields: true,
    generateId: createIdGenerator({
      prefix: 'msgc',
      size: 16,
    }),
  }) // <-- useChat ends here

  useChatTitle(id ?? '', messages);

  useEffect(() => {
    if (id) {
      void (async () => {
        const movieData = await loadMoviesForChat(id);
        console.log('[CLIENT_LOAD_SAVED_MOVIES] Loaded movie data from DB for this chat:', movieData);

        const movieMap = new Map<string, MovieData[]>();
        movieData.forEach(({ messageId, movies }) => {
          movieMap.set(messageId, movies);
        });

        setSavedMovies(movieMap);
      })();
    }
  }, [id]);

  // Clear Mode B intro when a new request starts
  useEffect(() => {
    if (status === 'submitted') {
      setModeBIntro('')
    }
  }, [status])


  useEffect(() => {
    // New logic to display the 3 most recent movies from the entire chat
    const allMoviesWithTimestamp: { movie: MovieData, createdAt: Date }[] = [];

    messages.forEach(message => {
      if (message.role === 'assistant') {
        // Try extracting from live tool usage first
        const liveMovies = extractMoviesFromMessage(message);
        if (liveMovies.length > 0) {
          liveMovies.forEach(movie => {
            allMoviesWithTimestamp.push({ movie, createdAt: message.createdAt ?? new Date() });
          });
        } else {
          // Fallback to saved movies for loaded messages
          const saved = savedMovies.get(message.id);
          if (saved) {
            saved.forEach(movie => {
              allMoviesWithTimestamp.push({ movie, createdAt: message.createdAt ?? new Date() });
            });
          }
        }
      }
    });

    // Sort by date descending and take the top 3
    allMoviesWithTimestamp.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const latestMovies = allMoviesWithTimestamp.slice(0, 3).map(item => item.movie);

    console.log('[CLIENT_RENDER_MOVIES] Final list of movies being set for rendering:', latestMovies);
    if (latestMovies.length > 0) {
      setRecommendedMovies(latestMovies);
    }

  }, [messages, savedMovies]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  const chatContainerRef = useRef<HTMLDivElement>(null)

  // ========== HOOKS SECTION END ==========

  const router = useRouter()
  const createChatMutation = api.chat.create.useMutation()

  const handleNewChat = async () => {
    const result = await createChatMutation.mutateAsync()
    router.push(`/chat/${result.chatId}`)
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* New Layout: Genie on left, center content area */}
      <div className="flex gap-8 items-start">
        {/* Genie Image - Left Side */}
        <div className="hidden lg:block flex-shrink-0">
          <img 
            src="/genie/genie-1.png" 
            alt="Watch Genie" 
            className="w-36 h-48 object-contain"
          />
        </div>

        {/* Center Content Area */}
        <div className="flex-1 min-w-0">
          {/* Chat Messages */}
          <div
            ref={chatContainerRef}
            className={`h-64 p-6 mb-6 overflow-y-auto ${cardVariants.chat}`}>
            
            {/* Chat Messages Content */}
            {messages.map(message => (
              <div key={message.id} className={`mb-4 ${message.role === 'assistant' ? 'text-xl leading-relaxed' : 'text-xl'}`}>
                <strong>{message.role === 'user' ? 'Me: ' : 'Genie '}</strong>
                {message.parts ? (
                  // Handle messages with parts (new messages)
                  message.parts
                    ?.filter(part => part.type === 'text')
                    .map((part, index) => {
                      if (part.type === 'text') {
                        const text = part.text;
                        // ... your existing chip logic ...
                        return <div key={index}>{text}</div>;
                      }
                      return null;
                    })
                ) : (
                  // Handle messages without parts (loaded from DB)
                  <div>{message.content}</div>
                )}
              </div>
            ))}
            {modeBIntro && (
              <div className={`mb-4 text-xl leading-relaxed`}>
                <strong>{'Genie '}</strong>
                <div>{modeBIntro}</div>
              </div>
            )}
          </div>

          {/* Movie Recommendations */}
          <MovieCardsSection movies={recommendedMovies} />

          {/* Input and Send Button */}
          <form onSubmit={handleSubmit} className="flex gap-3 mb-4">
            <input
              name="prompt"
              value={input}
              onChange={handleInputChange}
              className={`flex-1 ${inputVariants.chat}`}
              placeholder="Type your message..."
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              disabled={status === 'submitted' || status === 'streaming'}
            />
            <button
              className={cn(
                status === 'submitted' || status === 'streaming'
                  ? "px-6 py-3 rounded-[11px] bg-[rgba(0,229,255,0.02)] border-[0.5px] border-[#02fffb]/30 text-white/50 font-medium opacity-50 cursor-default transition-all pointer-events-none"
                  : buttonVariants.primary
              )}
              disabled={status === 'submitted' || status === 'streaming'}
            >
              Send
            </button>
          </form>

          {/* Conversation Chips - Now below input/send button */}
          <ConversationChips
            chips={conversationChips}
            isAiThinking={status === 'submitted' || status === 'streaming'}
            onChipClick={(text) => {
              void append({ role: 'user', content: text })
              setConversationChips([])
            }}
          />

          {/* Error Handling */}
          {error && !modeBIntro && recommendedMovies.length === 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-red-700 mb-2">An error occurred.</div>
              <button
                type="button"
                onClick={() => reload()}
                className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

