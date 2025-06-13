'use client'

import { useSession, signOut } from '~/lib/auth-client'

export function Header() {
    const { data: session } = useSession()

    const loginEl = () => {
        if (session) {
            return (
                <>
                <span>Logged in as {session.user.name}</span>
                    <button 
                        onClick={() => void signOut()}
                        className='px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600'
                    >
                    Logout
                    </button>
                </>
            )
        }
        return (
            <span>Not Logged in</span>
        )
    }

    return (
        <header className='w-full border-b p-4'>
            <div className='flex justify-between items-center max-w-7xl mx-auto'>
                <h1 className='text-xl font-bold'>Movie Chatbot</h1>

                <div className='flex items-center gap-4'>
                    {loginEl()}
                </div>
            </div>
        </header>
    )
}