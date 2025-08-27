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
import { buttonVariants, cardVariants, inputVariants, textVariants } from '~/styles/component-styles';





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
  // Ephemeral bridge for Mode B picks to avoid stale posters before DB message is visible
  const [ephemeralMovies, setEphemeralMovies] = useState<MovieData[] | null>(null)
  // Debug/testing: allow manual trigger of thinking animation by clicking genie image
  const [debugThinking, setDebugThinking] = useState<boolean>(false)

  const DEFAULT_CHIPS: Chip[] = [
    { text: 'Broaden my horizon', type: 'broaden' },
    { text: 'What should I watch?', type: 'reset' },
    { text: 'Surprise me', type: 'curveball' },
  ]
  const chipsStorageKey = (chatId?: string) => (chatId ? `chat:${chatId}:chips` : '')
  const DISABLE_GENERATED_CHIPS = true

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
          // Set ephemeral movies so UI updates immediately; final state will be reconciled by effect below
          setEphemeralMovies(Array.isArray(raw.picks) ? raw.picks : [])
          setConversationChips(prev => (prev.length > 0 ? prev : DEFAULT_CHIPS))

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
          if (DISABLE_GENERATED_CHIPS) {
            return
          }
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
            setConversationChips(prev => (prev.length > 0 ? prev : DEFAULT_CHIPS));
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

  // Load chips from localStorage or set defaults on chat open/new chat
  useEffect(() => {
    try {
      if (!id) {
        setConversationChips(prev => (prev.length > 0 ? prev : DEFAULT_CHIPS))
        return
      }
      const key = chipsStorageKey(id)
      if (!key) return
      const raw = localStorage.getItem(key)
      if (raw) {
        const parsed = JSON.parse(raw) as Chip[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          setConversationChips(parsed)
          return
        }
      }
      setConversationChips(prev => (prev.length > 0 ? prev : DEFAULT_CHIPS))
    } catch {
      setConversationChips(prev => (prev.length > 0 ? prev : DEFAULT_CHIPS))
    }
  }, [id])

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

  // Persist chips per chat whenever they change
  useEffect(() => {
    if (!id) return
    try {
      if (conversationChips.length > 0) {
        localStorage.setItem(chipsStorageKey(id), JSON.stringify(conversationChips))
      }
    } catch {}
  }, [conversationChips, id])

  // Clear Mode B intro when a new request starts
  useEffect(() => {
    if (status === 'submitted') {
      setModeBIntro('')
    }
  }, [status])

  // Clear ephemeral movies once the persisted assistant message with tool results is visible
  useEffect(() => {
    if (!ephemeralMovies || ephemeralMovies.length === 0) return

    // Find the most recent assistant message that contains movies
    const candidate: MovieData[] = []
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]
      if (m.role !== 'assistant') continue
      const live = extractMoviesFromMessage(m)
      if (live.length > 0) {
        candidate.push(...live)
        break
      }
      const saved = savedMovies.get(m.id)
      if (saved && saved.length > 0) {
        candidate.push(...saved)
        break
      }
    }

    if (candidate.length === 0) return

    const key = (mv: MovieData) => `${mv.media_type}:${mv.id}`
    const sameSet = () => {
      if (candidate.length !== ephemeralMovies.length) return false
      const a = candidate.map(key).sort()
      const b = ephemeralMovies.map(key).sort()
      for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
      return true
    }

    if (sameSet()) {
      setEphemeralMovies(null)
    }
  }, [messages, savedMovies, ephemeralMovies])


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

    // If we have ephemeral movies from the latest Mode B response, prioritize them
    if (ephemeralMovies && ephemeralMovies.length > 0) {
      const next = ephemeralMovies.slice(0, 3)
      console.log('[CLIENT_RENDER_MOVIES] Using ephemeral Mode B movies for rendering:', next);
      setRecommendedMovies(next)
      return
    }

    // Sort by date descending and take the top 3
    allMoviesWithTimestamp.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const latestMovies = allMoviesWithTimestamp.slice(0, 3).map(item => item.movie);

    console.log('[CLIENT_RENDER_MOVIES] Final list of movies being set for rendering:', latestMovies);
    if (latestMovies.length > 0) {
      setRecommendedMovies(latestMovies);
    }

  }, [messages, savedMovies, ephemeralMovies]);

  // Ensure chips show up when posters render
  useEffect(() => {
    if (recommendedMovies.length > 0 && conversationChips.length === 0) {
      setConversationChips(DEFAULT_CHIPS)
    }
  }, [recommendedMovies, conversationChips.length])

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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      {/* New Layout: Genie on left, center content area */}
      <div className="flex gap-8 items-start">
        {/* Genie Image - Left Side */}
        <div className="hidden lg:block flex-shrink-0 cursor-pointer" onClick={() => setDebugThinking(v => !v)}>
          <img 
            src="/genie/genie-1.png" 
            alt="Watch Genie" 
            className={cn(
              "w-36 h-48 object-contain",
              (status === 'submitted' || status === 'streaming' || debugThinking) ? "genie-animated" : ""
            )}
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
                <span className={cn(
                  message.role === 'user'
                    ? cn(textVariants.labelUser, 'text-[#00E5FF]')
                    : textVariants.labelAssistant
                )}>
                  {message.role === 'user' ? 'Me: ' : 'Genie: '}
                </span>
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
                  <div className="font-normal">{message.content}</div>
                )}
              </div>
            ))}
            {modeBIntro && (
              <div className={`mb-4 text-xl leading-relaxed`}>
                <span className={textVariants.labelAssistant}>{'Genie: '}</span>
                <div className="font-normal">{modeBIntro}</div>
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
            isAiThinking={(status === 'submitted' || status === 'streaming') || debugThinking}
            thinkingVariant={"scroll"}
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

