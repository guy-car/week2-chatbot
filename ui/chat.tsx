'use client';

import { type Message, useChat } from '@ai-sdk/react';
import { createIdGenerator } from 'ai';
import { log } from 'console';
import { Loader2 } from "lucide-react";

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
    stop, reload, 
    addToolResult } = useChat({
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
  async onToolCall({ toolCall }) {
    if (toolCall.toolName === 'getLocation') {
      const cities = ['New York', 'Los Angeles', 'Chicago', 'San Francisco'];
      return cities[Math.floor(Math.random() * cities.length)];
    }
  },
  });

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
                  return <div key={index}>{part.text}</div>;
                }

                // if AI decided to use a tool:
                else if (part.type === 'tool-invocation') {
                    const callId = part.toolInvocation.toolCallId;

                    // if AI decides the request requires confirmation
                    if (part.toolInvocation.toolName === 'askForConfirmation') {
                    switch (part.toolInvocation.state) {
                        case 'partial-call':
                            return (
                                <div key={callId} className="p-2 bg-gray-100 border border-gray-300 rounded">
                                Preparing confirmation dialog...
                                </div>
                            );
                        case 'call':
                            return (
                            <div key={callId} className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                                {(part.toolInvocation.args as { message: string }).message}
                                <div className="mt-2">
                                <button
                                    onClick={() =>
                                    addToolResult({
                                        toolCallId: callId,
                                        result: 'Yes, confirmed.',
                                    })
                                    }
                                    className="mr-2 px-3 py-1 bg-green-500 text-white rounded"
                                >
                                    Yes
                                </button>
                                <button
                                    onClick={() =>
                                    addToolResult({
                                        toolCallId: callId,
                                        result: 'No, denied',
                                    })
                                    }
                                >
                                    No
                                </button>
                                </div>
                            </div>
                            );
                        case 'result':
                            return (
                                <div key={callId} className="p-2 bg-gray-50 border border-gray-200 rounded">
                                    Confirmation result: {part.toolInvocation.result}
                                </div>
                            );
                        }
                    }

                  // if AI decides it needs weather info
                    if (part.toolInvocation.toolName === 'getWeatherInformation') {
                        switch (part.toolInvocation.state) {
                            case 'partial-call':
                                return (
                                    <div key={callId} className="p-2 bg-gray-100 border border-gray-300 rounded">
                                    Preparing weather report...
                                    </div>
                                );
                            case 'call':
                                return (
                                <div key={callId} className="p-2 bg-blue-50 border border-blue-200 rounded">
                                    Getting weather information for {(part.toolInvocation.args as {city: string}).city}...
                                </div>
                                );
                            case 'result':
                                return (
                                <div key={callId} className="p-2 bg-green-50 border border-green-200 rounded">
                                    Weather in {(part.toolInvocation.args as {city: string}).city}: {part.toolInvocation.result}
                                </div>
                                );
                            }
                    }

                    // AI decides it needs location info
                    if (part.toolInvocation.toolName === 'getLocation') {
                        switch (part.toolInvocation.state) {
                            case 'partial-call':
                                console.log('this is a partial call')
                                return (
                                    <div key={callId} className="p-2 bg-gray-100 border border-gray-300 rounded">
                                    Retrieving location information...
                                    </div>
                                );
                            case 'call':
                                return <div key={callId}>Getting location...</div>;
                            case 'result':
                                return (
                                <div key={callId}>
                                    Location: {part.toolInvocation.result}
                                </div>
                        );
                    }
                    }
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
          className={`px-6 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            status !== 'ready' 
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