'use client'

import { type Message, useChat } from '@ai-sdk/react';
import { createIdGenerator } from 'ai';
import { Loader2 } from "lucide-react";

import { useState, useEffect, useRef } from 'react'
import { MovieCardsSection } from './MovieCardsSection'
import type { MovieData } from '~/app/types'
import { ConversationChips } from './ConversationChips'
import { type Chip } from '~/app/types'
import { useChatTitle } from '~/app/_hooks/useChatTitle'
import { WelcomeMessage } from './WelcomeMessage';

import { useRouter } from 'next/navigation'
import { api } from "~/trpc/react"
import { loadMoviesForChat } from 'tools/chat-store';
import { cn } from "~/lib/utils"
import { magicButtonStyles } from '~/components/ui/button-magic';

const THINKING_MESSAGES = [
  "Consulting the cosmic catalog...",
  "Weaving threads of story and mood...",
  "The Genie ponders your desire...",
  "Sifting through realms of possibility...",
  "Divining the perfect tale for you...",
  "The stars align to reveal...",
  "Summoning stories from the ether...",
  "Your wish echoes in the vault of dreams...",
  "Casting nets into the sea of cinema...",
  "The oracle of entertainment awakens...",
  "Translating your mood into moving pictures...",
  "The wheel of fortune spins...",
  "Brewing a potion of perfect picks...",
  "Your taste profile glimmers in my crystal ball...",
  "The archives whisper their secrets..."
];

function Spinner() {
  const [message] = useState(() =>
    THINKING_MESSAGES[Math.floor(Math.random() * THINKING_MESSAGES.length)]
  );

  return (
    <div className="flex items-center space-x-2">
      <Loader2 className="h-4 w-4 animate-spin text-[#FFC559] glow-gold-strong" />
      <span className="text-sm text-[#FFC559] glow-gold-subtle">{message}</span>
    </div>
  );
}

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

  const { messages, input, status, error, handleInputChange, handleSubmit, stop, reload, append } = useChat({
    api: '/api/chat-tmdb-tool',
    body: {
    },
    id,
    initialMessages,
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

  const [recommendedMovies, setRecommendedMovies] = useState<MovieData[]>([])
  const [conversationChips, setConversationChips] = useState<Chip[]>([])
  const [savedMovies, setSavedMovies] = useState<Map<string, MovieData[]>>(new Map());

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
    setRecommendedMovies(latestMovies);

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
    <div className="w-full git max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {messages.length === 0 && <WelcomeMessage chatId={id ?? ''} />}
      <div
        ref={chatContainerRef}
        className="glow-gold h-64  p-6 mb-6 overflow-y-auto bg-[#229e9c70] rounded-lg">
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
      </div>
      <MovieCardsSection movies={recommendedMovies} />
      <ConversationChips
        chips={conversationChips}
        onChipClick={(text) => {
          void append({ role: 'user', content: text })
          setConversationChips([])
        }}
      />
      {error && (
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

      {(status === 'submitted' || status === 'streaming') && (
        <div className="mb-4 flex items-center justify-between p-3 bg-[#024845] border border-[#D18843] rounded-lg">
          <div className="flex items-center">
            {status === 'submitted' && <Spinner />}
            {status === 'streaming' && <span className="text-sm text-[#FFC559] glow-gold-subtle">AI is responding...</span>}
          </div>
          <button
            type="button"
            onClick={() => stop()}
            className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
          >
            Stop
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-3">

        <button
          type="button"
          onClick={handleNewChat}
          className={magicButtonStyles.success}
          title="Start new chat"
        >
          New chat
        </button>

        <input
          name="prompt"
          value={input}
          onChange={handleInputChange}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Type your message..."
          disabled={status !== 'ready'}
        />
        <button
          className={cn(
            "px-6 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2",
            status !== 'ready'
              ? "bg-gray-400 text-gray-200 cursor-not-allowed focus:ring-gray-400"
              : [magicButtonStyles.caramel, "focus:ring-[#221745]"]
          )}
          disabled={status !== 'ready'}
        >
          Send
        </button>
      </form>
    </div>
  );
}

