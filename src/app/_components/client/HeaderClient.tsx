'use client'

import { signOut, signIn } from '~/lib/auth-client'

interface HeaderClientProps {
    user?: {
        name?: string;
        // add other user properties as needed
    } | null;
}

export function HeaderClient({ user }: HeaderClientProps) {
    if (user) {
        return (
            <>
                <span>Logged in as {user.name}</span>
                <button
                    onClick={() => void signOut()}
                    className='px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600'
                >
                    Logout
                </button>
            </>
        );
    }

    return (
        <button
            onClick={() => signIn.social({ provider: 'github' })}
            className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
        >
            Sign in with GitHub
        </button>

    )
}