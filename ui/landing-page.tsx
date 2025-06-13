'use client'

import { useRouter } from 'next/navigation';
import { useSession, signIn } from '~/lib/auth-client';
import { createChat } from 'tools/chat-store';

export function LandingPage() {
    const { data: session } = useSession()
    const router = useRouter()

    const handleNewChat = async () => {
        try {
            const response = await fetch('/api/chat/new', { method: 'POST' });
            const { chatId } = await response.json() as { chatId: string };
            router.push(`/chat/${chatId}`);
        } catch (error) {
            console.error('Failed to create chat:', error);
        }
    }

    if (session) {

        return (
            <div>
                <h1>Welcome back, {session.user.name}!</h1>
                <button onClick={handleNewChat}> Start new chat</button>
            </div>
        )
    }

    return (
        <div>
            <h1>Welcome to the movie recommendation chatbot</h1>
            <button onClick={() => signIn.social({ provider: 'github'})}>
                Sign in with GitHub
            </button>
        </div>
    )
}