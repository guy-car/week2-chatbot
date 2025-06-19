import { useEffect, useRef } from 'react';
import { api } from "~/trpc/react";

export function useChatTitle(chatId: string, messages: Array<{ role: string; content: string }>) {
    const hasSetTitle = useRef(false);
    const updateTitle = api.chat.updateTitle.useMutation();

    useEffect(() => {
        // Only run once, and only if we have messages
        if (hasSetTitle.current || messages.length === 0) return;

        // Check if this is the first user message
        const firstUserMessage = messages.find(msg => msg.role === 'user');

        if (firstUserMessage && !hasSetTitle.current) {
            hasSetTitle.current = true;

            const title = firstUserMessage.content.trim().slice(0, 40);
            const finalTitle = title.length === 40 ? title + '...' : title;

            updateTitle.mutate({
                chatId,
                title: finalTitle
            });
        }
    }, [messages, chatId, updateTitle]);
}