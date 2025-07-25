'use client'

import { useRouter } from 'next/navigation';
import { api } from "~/trpc/react";
import { magicButtonStyles } from '~/components/ui/button-magic';

interface NewChatComponentProps {
    user: {
        name?: string;
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
            <h2 className="text-2xl font-bold mb-12 font-sans">
                Welcome back, {user.name}!
            </h2>
            <button
                className={magicButtonStyles.caramel}
                onClick={handleNewChat}
            >
                Ask the Genie
            </button>
        </div>
    );
}