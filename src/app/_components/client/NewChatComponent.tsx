'use client'

import { useRouter } from 'next/navigation';
import { api } from "~/trpc/react";
import { useMemo } from 'react';

const GENIE_GREETINGS = [
    "Let your curiosity speak. The Genie listens.",
    "Not all who wander are lost — some are just between films.",
    "Feeling indecisive? Whisper your mood and I’ll do the rest.",
    "The screen is blank — until you speak your wish.",
    "What do you crave tonight: wonder, tension, or beauty?",
    "Speak freely. I specialize in unexpected delights.",
    "Your next favorite film is already waiting. Let's find it.",
    "The mood, the tone, the texture — tell me what moves you.",
    "Welcome back, seeker of stories. What realm shall we explore today?",
    "Every film is a doorway. Tell me what kind of world you wish to enter.",

]

interface NewChatComponentProps {
    user: {
        name?: string;
    };
}

export function NewChatComponent({ user }: NewChatComponentProps) {
    const router = useRouter();
    const createChatMutation = api.chat.create.useMutation();

    // Random greeting that stays consistent during the session
    const greeting = useMemo(() => {
        return GENIE_GREETINGS[Math.floor(Math.random() * GENIE_GREETINGS.length)]
    }, []);

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
            <h1 className="text-2xl font-bold mb-2">
                Welcome back, {user.name}!
            </h1>
            <p className="text-lg text-gray-600 mb-6">
                {greeting}
            </p>
            <button
                className='px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
                onClick={handleNewChat}
            >
                Start new chat
            </button>
        </div>
    );
}