'use client'

import { signOut, signIn } from '~/lib/auth-client'
import Link from 'next/link'
import { magicButtonStyles } from '~/components/ui/button-magic'

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
                        className='px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-500'
                    >
                        Logout
                    </button>
                </>
            );
        }

        return (
            <button
                onClick={() => signIn.social({ provider: 'github' })}
                className={magicButtonStyles.genie}
            >
                Sign in
            </button>
        );
    }

    return (
        <div className="flex justify-between items-center w-full">
            <Link
                href="/"
                className="text-5xl font-bold bg-gradient-to-t from-[#adf1f0] to-[#FFC559] bg-clip-text text-transparent transition-all hover:brightness-110 text-glow-gold"
            >
                <h1>Watch Genie</h1>
            </Link>

            <div className='flex items-center gap-4'>
                {renderAuthButtons()}
            </div>
        </div>
    );
}