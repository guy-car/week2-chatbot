'use client'

import { signOut, signIn } from '~/lib/auth-client'
import Link from 'next/link'

interface HeaderClientProps {
    user?: {
        name?: string;
    } | null;
}

export function HeaderClient({ user }: HeaderClientProps) {
    const handleSignOut = async () => {
        await signOut()
        window.location.href = '/'
    }

    const renderAuthButtons = () => {
        if (user) {
            return (
                <>
                    <span>Logged in as {user.name}</span>
                    <button
                        onClick={handleSignOut}
                        className='px-4 py-2 bg-gray-800 text-white rounded hover:bg-red-600'
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
        );
    }

    return (
        <div className="flex justify-between items-center w-full">
            <Link href="/" className="text-xl font-bold hover:text-blue-600 transition-colors">
                Watch Genie
            </Link>

            <div className='flex items-center gap-4'>
                {renderAuthButtons()}
            </div>
        </div>
    );
}