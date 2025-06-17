'use client'

import { useRouter } from 'next/navigation';
import { api } from "~/trpc/react";

interface NewChatComponentProps {
    user: {
        name?: string;
        // add other user properties as needed
    };
}

export function NewChatComponent({ user }: NewChatComponentProps) {
    const router = useRouter();
    const createChatMutation = api.chat.create.useMutation();

    const handleNewChat = async () => {
        try {
            const result = await createChatMutation.mutateAsync();
            router.push(`/chat/${result.chatId}`);
        } catch (error) {
            console.error('Failed to create chat:', error);
        }
    }

    return (
        <div className="text-center py-8">
            <h1 className="text-2xl font-bold mb-4">
                Welcome back, {user.name}!
            </h1>
            <button
                className='px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
                onClick={handleNewChat}
            >
                Start new chat
            </button>
        </div>
    );
}