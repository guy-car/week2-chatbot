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

function Spinner() {
  return (
    <div className="flex items-center space-x-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm text-gray-600">AI is thinking...</span>
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
    maxSteps: 1,
    sendExtraMessageFields: true,
    generateId: createIdGenerator({
      prefix: 'msgc',
      size: 16,
    }),
  }) // <-- useChat ends here

  console.log('🎭 Chat state:', {
    id,
    messagesCount: messages.length,
    firstMessage: messages[0]
  });


  useChatTitle(id ?? '', messages);

  const [recommendedMovies, setRecommendedMovies] = useState<MovieData[]>([])
  const [conversationChips, setConversationChips] = useState<Chip[]>([])
  const [savedMovies, setSavedMovies] = useState<Map<string, MovieData[]>>(new Map());

  useEffect(() => {
    if (id) {
      void (async () => {
        console.log('🔄 Loading saved movies for chat:', id);
        const movieData = await loadMoviesForChat(id);
        console.log('📦 Loaded movie data:', movieData);

        const movieMap = new Map<string, MovieData[]>();
        movieData.forEach(({ messageId, movies }) => {
          movieMap.set(messageId, movies);
        });

        console.log('🗺️ Movie map:', Array.from(movieMap.entries()));
        setSavedMovies(movieMap);
      })();
    }
  }, [id]);


  useEffect(() => {
    console.log('🔍 Movie extraction running, total messages:', messages.length);

    const lastAssistantMessage = messages
      .slice()
      .reverse()
      .find(msg => msg?.role === 'assistant');

    if (!lastAssistantMessage) {
      console.log('❌ No assistant message found');
      setRecommendedMovies([]);
      return;
    }

    // First check if we have saved movies for this message
    console.log('🔍 Checking saved movies for message:', lastAssistantMessage.id);
    console.log('🗺️ Current saved movies map:', Array.from(savedMovies.entries()));

    const extractedMovies = extractMoviesFromMessage(lastAssistantMessage);
    if (extractedMovies && extractedMovies.length > 0) {
      console.log(`🎬 Total movies extracted: ${extractedMovies.length}`);
      setRecommendedMovies(extractedMovies.slice(0, 3));
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
      {messages.length === 0 && <WelcomeMessage chatId={id ?? ''} />}
      <div
        ref={chatContainerRef}
        className="h-64 border border-gray-300 p-6 mb-6 overflow-y-auto bg-gray-50 rounded-lg">
        {messages.map(message => (
          <div key={message.id} className={`mb-4 ${message.role === 'assistant' ? 'text-xl leading-relaxed' : 'text-base'}`}>
            <strong>{message.role === 'user' ? 'User: ' : 'AI: '}</strong>
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
        <div className="mb-4 flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            {status === 'submitted' && <Spinner />}
            {status === 'streaming' && <span className="text-sm text-gray-600">AI is responding...</span>}
          </div>
          <button
            type="button"
            onClick={() => stop()}
            className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
          >
            Stop
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-3">

        <button
          type="button"
          onClick={handleNewChat}
          className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
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
          type="submit"
          className={`px-6 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${status !== 'ready'
            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
            : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          disabled={status !== 'ready'}
        >
          Send
        </button>
      </form>
    </div>
  );
}

