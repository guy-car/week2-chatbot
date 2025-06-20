/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import type { Message } from 'ai';
import type { MovieData } from '~/app/types/index';

/**
 * Extracts movie data from various message part formats
 * Handles both 'tool-result' and 'tool-invocation' formats from Vercel AI SDK
 * 
 * Note: We use 'any' here because the AI SDK uses different types for streaming vs saved messages
 */
export function extractToolResults(message: Message): MovieData[] | null {
    if (message.role !== 'assistant' || !('parts' in message) || !message.parts) {
        return null;
    }

    const toolResults: MovieData[] = [];
    const parts = message.parts as any[];

    for (const part of parts) {
        if (!part || typeof part !== 'object') continue;

        // Format 1: tool-result (from saved messages)
        if (part.type === 'tool-result' && part.toolName === 'media_lookup' && part.result && !part.result.error) {
            toolResults.push(part.result as MovieData);
        }
        // Format 2: tool-invocation (from streaming responses)
        else if (part.type === 'tool-invocation' && part.toolInvocation) {
            const invocation = part.toolInvocation;
            if (invocation.toolName === 'media_lookup' &&
                invocation.state === 'result' &&
                invocation.result &&
                !invocation.result.error) {
                toolResults.push(invocation.result as MovieData);
            }
        }
    }

    return toolResults.length > 0 ? toolResults : null;
}

/**
 * Reconstructs message parts array from saved tool results
 */
export function reconstructMessageParts(content: string, toolResults: MovieData[]): any[] {
    return [
        { type: 'text', text: content },
        ...toolResults.map(movie => ({
            type: 'tool-invocation',
            toolInvocation: {
                toolName: 'media_lookup',
                state: 'result',
                result: movie
            }
        }))
    ];
}

/**
 * Generates a concise chat title from the first message
 */
export function generateChatTitle(message: string): string {
    const cleaned = message.trim().replace(/\s+/g, ' ');

    if (cleaned.length <= 40) {
        return cleaned;
    }

    const truncated = cleaned.substring(0, 40);
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastSpace > 30) {
        return truncated.substring(0, lastSpace) + '...';
    }

    return truncated + '...';
}