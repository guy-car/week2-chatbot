'use client'

import { type Message, useChat } from '@ai-sdk/react';
import { createIdGenerator } from 'ai';
import { Loader2 } from "lucide-react";
import toast from 'react-hot-toast'

import { useState, useEffect, useRef } from 'react'
import { MovieCardsSection, type MovieData } from './MovieCardsSection'
import { ConversationChips } from './ConversationChips'
import { type Chip } from '~/app/types'

function Spinner() {
  return (
    <div className="flex items-center space-x-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm text-gray-600">AI is thinking...</span>
    </div>
  );
}

export default function Chat({
  id,
  initialMessages,
}: { id?: string | undefined; initialMessages?: Message[] } = {}) {

  const { messages,
    input, status, error,
    handleInputChange, handleSubmit,
    stop, reload, append
  } = useChat({
    api: '/api/chat-tmdb-tool',
    onError: (error) => {
      console.log('useChat error:', error);
    },
    onFinish: (message) => {
      // Cast messages to the correct type
      const typedMessages = messages as Message[];

      // Now find the last user message with proper typing
      const lastUserMsg = typedMessages
        .filter((m): m is Message & { role: 'user' } => m.role === 'user')
        .pop();

      // Type guard to ensure both exist and are strings
      if (lastUserMsg?.content && message.role === 'assistant' && message.content) {
        void generateChips(lastUserMsg.content, message.content);
      }
    },
    id,
    initialMessages,
    maxSteps: 5,
    sendExtraMessageFields: true,
    experimental_prepareRequestBody({ messages, id }) {
      return { message: messages[messages.length - 1], id };
    },
    generateId: createIdGenerator({
      prefix: 'msgc',
      size: 16,
    }),
  })

  const [recommendedMovies, setRecommendedMovies] = useState<MovieData[]>([])
  const [conversationChips, setConversationChips] = useState<Chip[]>([])

  const generateChips = async (lastUserMsg: string, lastAssistantMsg: string): Promise<void> => {
    const mentionedMovies = recommendedMovies.filter(movie =>
      lastAssistantMsg.includes(movie.title)
    );

    try {
      const response = await fetch('/api/generate-chips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lastUserMessage: lastUserMsg,
          lastAssistantMessage: lastAssistantMsg,
          recommendedMovies: mentionedMovies.map(m => ({
            title: m.title,
            release_date: m.release_date
          }))
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

  const extractMovieTitle = (chipText: string) => {
    const match = /Add (.+?) to watchlist/i.exec(chipText);
    const title = match?.[1] ? match[1].trim() : chipText;

    return title;
  };
  const addToWatchlist = (movieTitle: string) => {
    const existing = JSON.parse(localStorage.getItem('watchlist') ?? '[]') as string[];


    if (!existing.includes(movieTitle)) {
      existing.push(movieTitle);
      localStorage.setItem('watchlist', JSON.stringify(existing));
      return true;
    }
    return false;
  };
  const handleChipClick = (chipText: string) => {
    // Check if this is a watchlist chip
    if (chipText.toLowerCase().includes('to watchlist')) {
      // Handle watchlist logic
      const movieTitle = extractMovieTitle(chipText);
      const success = addToWatchlist(movieTitle);


      if (success) {
        toast.success(`Added "${movieTitle}" to watchlist!`);
      } else {
        toast.error(`"${movieTitle}" is already in your watchlist`);
      }
    } else {
      // Handle regular chips (send as message)
      void append({
        role: 'user',
        content: chipText
      });
    }
  };

  useEffect(() => {
    console.log('🔍 Movie extraction running, total messages:', messages.length);

    // Find the last assistant message
    const lastAssistantMessage = messages
      .slice()
      .reverse()
      .find(msg => msg?.role === 'assistant');

    if (!lastAssistantMessage) {
      console.log('❌ No assistant message found');
      setRecommendedMovies([]);
      return;
    }

    console.log('✅ Found last assistant message:', {
      content: lastAssistantMessage.content?.substring(0, 100) + '...',
      partsCount: lastAssistantMessage.parts?.length || 0,
      partTypes: lastAssistantMessage.parts?.map(p => p.type) || []
    });

    // Extract movies in the ORDER they appear in parts
    const extractedMovies: MovieData[] = [];

    lastAssistantMessage.parts?.forEach((part, index) => {
      console.log(`📦 Part ${index}:`, part.type);

      if (part.type === 'tool-invocation') {
        console.log(`🔧 Tool invocation details:`, {
          toolName: part.toolInvocation.toolName,
          state: part.toolInvocation.state,
          hasResult: !!part.toolInvocation.result,
          hasError: !!part.toolInvocation.result?.error
        });
      }

      if (
        part.type === 'tool-invocation' &&
        part.toolInvocation.toolName === 'media_lookup' &&
        part.toolInvocation.state === 'result' &&
        part.toolInvocation.result &&
        !part.toolInvocation.result.error
      ) {
        extractedMovies.push(part.toolInvocation.result as MovieData);
        console.log(`✅ Added movie:`, part.toolInvocation.result.title);
      }
    });

    console.log(`🎬 Total movies extracted: ${extractedMovies.length}`);
    setRecommendedMovies(extractedMovies.slice(0, 3));
  }, [messages])

  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-6">Chat {id ? `(${id.slice(0, 8)}...)` : ''}</h1>
      <div
        ref={chatContainerRef}
        className="h-64 border border-gray-300 p-6 mb-6 overflow-y-auto bg-gray-50 rounded-lg">
        {messages.map(message => (
          <div key={message.id} className={`mb-4 ${message.role === 'assistant' ? 'text-xl leading-relaxed' : 'text-base'}`}>
            <strong>{message.role === 'user' ? 'User: ' : 'AI: '}</strong>
            {message.parts
              ?.filter(part => part.type !== 'source')
              .map((part, index) => {
                if (part.type === 'text') {
                  const text = part.text;

                  // Check if this text contains chips
                  if (text.includes('CHIPS:')) {
                    const [mainText, chipsText] = text.split('CHIPS:');
                    const chips = chipsText?.trim()
                      .split('|')
                      .map(chip => chip.trim().replace(/\[|\]/g, ''));

                    return (
                      <div key={index}>
                        <div>{mainText?.trim()}</div>
                        {chips && chips.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {chips.map((chip, chipIndex) => (
                              <button
                                key={chipIndex}
                                className={`px-3 py-1 rounded-full text-sm hover:bg-opacity-80 ${chip.toLowerCase().includes('to watchlist')
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                  }`}
                                onClick={() => handleChipClick(chip)}
                              >
                                {chip}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return <div key={index}>{text}</div>;
                }
                return null;
              })}
            {message.parts
              ?.filter(part => part.type === 'source')
              .map(part => (
                <span key={`source-${part.source.id}`}>
                  [
                  <a href={part.source.url} target="_blank" className="text-blue-500 hover:underline">
                    {part.source.title ?? new URL(part.source.url).hostname}
                  </a>
                  ]
                </span>
              ))}
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