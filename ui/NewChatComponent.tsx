'use client'

import { useRouter } from 'next/navigation';
import { useSession } from '~/lib/auth-client';
import { api } from "~/trpc/react";

export function NewChatComponent() {
    const { data: session } = useSession()
    const router = useRouter()

    // const { data: chats, isLoading } = api.chat.getAll.useQuery()
    const createChatMutation = api.chat.create.useMutation();

    const handleNewChat = async () => {
        try {
            const result = await createChatMutation.mutateAsync();
            router.push(`/chat/${result.chatId}`);
        } catch (error) {
            console.error('Failed to create chat:', error);
        }
    }

    const unknownUserEl = () => {
        return (
            <div>
                <h1>Welcome to the movie recommendation chatbot</h1>
            </div>
        )
    }

    const loggedInUserEl = () => {
        return (
            <div>
                <div className='flex-1 pl-4'>
                    <div className='pl-4'>
                        <h1
                            className='text-xl font-bold'
                        >Welcome back, {session?.user.name}!</h1>
                        <button
                            className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
                            onClick={handleNewChat}> Start new chat</button>
                    </div>
                </div>
                <div>
                </div>
            </div>
        )
    }

    return session ? loggedInUserEl() : unknownUserEl();
}