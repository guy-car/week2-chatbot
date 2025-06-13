'use client'

import { useRouter } from 'next/navigation';
import { useSession, signIn } from '~/lib/auth-client';
import { createChat } from 'tools/chat-store';
import { api } from "~/trpc/react";

export function LandingPage() {
    const { data: session } = useSession()
    const router = useRouter()

    const { data: chats, isLoading } = api.chat.getAll.useQuery();

    const createChatMutation = api.chat.create.useMutation()

    const handleNewChat = async () => {
        try {
            const result = await createChatMutation.mutateAsync()
            router.push(`/chat/${result.chatId}`)
        } catch (error) {
            console.error('Failed to create chat:', error)
        }
    }

    const chatListEl = () => {
        if (isLoading) {
            return <p>Loading chats...</p>
        } 
        if (chats) {
            return (
                <div>
                    <ul>
                        {chats.map((chat) => (
                            <li key={chat.id}>{chat.id}</li>
                        ))}
                    </ul>
                </div>
            )
        }
    }

    const unknownUserEl = () => {
        return (
            <div>
                <h1>Welcome to the movie recommendation chatbot</h1>
                <button onClick={() => signIn.social({ provider: 'github'})}>
                    Sign in with GitHub
                </button>
            </div>
        )
    }

    const loggedInUserEl = () => {
        return (
            <div>
                <div className='pl-4'>
                    <h1>Welcome back, {session?.user.name}!</h1>
                    <button onClick={handleNewChat}> Start new chat</button>
                </div>
                <div>
                    <h1>List of all previous chats</h1>
                    {chatListEl()}
                </div>
            </div>
        )
    }

    return session ? loggedInUserEl() : unknownUserEl();
}