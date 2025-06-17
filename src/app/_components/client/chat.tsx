'use client'

import { type Message, useChat } from '@ai-sdk/react';
import { createIdGenerator } from 'ai';
import { Loader2 } from "lucide-react";
import clsx from 'clsx'

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
    api: '/api/chat-with-chips',
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
    // Look for pattern "Add [anything] to watchlist"
    const match = /Add (.+?) to watchlist/i.exec(chipText);
    return match ? match[1].trim() : chipText; // fallback to full chip text
  };
  const addToWatchlist = (movieTitle: string) => {
    const existing = JSON.parse(localStorage.getItem('watchlist') || '[]');
    if (!existing.includes(movieTitle)) {
      existing.push(movieTitle);
      localStorage.setItem('watchlist', JSON.stringify(existing));
      return true; // successfully added
    }
    return false; // already exists
  };
  const handleChipClick = (chipText: string) => {
    // Check if this is a watchlist chip
    if (chipText.toLowerCase().includes('to watchlist')) {
      // Handle watchlist logic
      const movieTitle = extractMovieTitle(chipText);
      const success = addToWatchlist(movieTitle);

      if (success) {
        console.log(`Added "${movieTitle}" to watchlist!`); // temp notification
      } else {
        console.log(`"${movieTitle}" is already in your watchlist`); // temp notification
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

                // if AI decided to use a tool:
                else if (part.type === 'tool-invocation') {
                  const callId = part.toolInvocation.toolCallId;

                }
                return null; // Handle any other part types
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