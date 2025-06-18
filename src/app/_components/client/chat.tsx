'use client'

import { type Message, useChat } from '@ai-sdk/react';
import { createIdGenerator } from 'ai';
import { Loader2 } from "lucide-react";
import toast from 'react-hot-toast'

// Simple Movie Poster Component
function MoviePoster({ movieData }) {
  // Handle case where there's no poster
  if (!movieData.poster_url) {
    return (
      <div className="my-4 w-48 h-72 bg-gray-200 rounded-lg flex items-center justify-center">
        <span className="text-gray-500">No poster available</span>
      </div>
    );
  }

  return (
    <div className="my-4">
      <img
        src={movieData.poster_url}
        alt={movieData.title}
        className="w-48 h-auto rounded-lg shadow-md"
        onError={(e) => {
          // Fallback if image fails to load
          e.target.onerror = null;
          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"%3E%3Crect width="200" height="300" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%236b7280"%3ENo Image%3C/text%3E%3C/svg%3E';
        }}
      />
      <p className="mt-2 text-sm text-gray-600">{movieData.title}</p>
    </div>
  );
}

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
      // console.log('useChat finished:', message);
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
  const extractMovieTitle = (chipText: string) => {
    const match = /Add (.+?) to watchlist/i.exec(chipText);
    const title = match ? match[1].trim() : chipText;

    return title;
  };
  const addToWatchlist = (movieTitle: string) => {
    const existing = JSON.parse(localStorage.getItem('watchlist') || '[]');

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



  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Chat {id ? `(${id.slice(0, 8)}...)` : ''}</h1>

      <div className="h-96 border border-gray-300 p-4 mb-4 overflow-y-auto bg-gray-50 rounded-lg">
        {messages.map(message => (
          <div key={message.id} className="mb-3">
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

                // Handle tool invocations
                else if (part.type === 'tool-invocation') {
                  const invocation = part.toolInvocation;

                  // Check if it's our media_lookup tool and it has completed
                  if (invocation.toolName === 'media_lookup' && invocation.state === 'result') {
                    const movieData = invocation.result;

                    // Check if there's an error in the result
                    if (movieData.error) {
                      return (
                        <div key={index} className="my-2 text-sm text-red-600">
                          Failed to load movie details
                        </div>
                      );
                    }

                    // Render the movie poster
                    return <MoviePoster key={index} movieData={movieData} />;
                  }

                  // Show loading state if tool is still running
                  else if (invocation.toolName === 'media_lookup' && invocation.state === 'pending') {
                    return (
                      <div key={index} className="my-2 flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-gray-500">Looking up movie details...</span>
                      </div>
                    );
                  }

                  return null;
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