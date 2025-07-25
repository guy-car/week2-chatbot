'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { magicButtonStyles } from '~/components/ui/button-magic'
import Image from 'next/image'
import { CustomSidebarTrigger } from '~/components/ui/custom-sidebar-trigger'

interface HeaderClientProps {
    user?: {
        name?: string;
    } | null;
}

export function HeaderClient({ user }: HeaderClientProps) {
    const pathname = usePathname()

    const renderAuthButtons = () => {
        if (user) {
            return null; // No logout button - handled in sidebar
        }

        // Don't show auth buttons on auth pages
        if (pathname.startsWith('/auth')) {
            return null
        }

        return (
            <Link href="/auth/sign-in" className={magicButtonStyles.genie}>
                Sign In
            </Link>
        );
    }

    return (
        <div className="flex items-center justify-between w-full h-full px-4">
            {/* Left: Sidebar Trigger */}
            <div className="flex items-center">
                <CustomSidebarTrigger />
            </div>

            {/* Center: Logo */}
            <div className="flex-1 flex justify-left ml-8">
                <Link href="/" className="flex items-center">
                    <Image
                        src="/title/main-title-horizontal-v2png.png"
                        alt="Watch Genie"
                        width={400}
                        height={63}
                        className="w-auto max-h-[190px]"
                        priority
                    />
                </Link>
            </div>

            {/* Right: Auth Buttons */}
            <div className='flex items-center gap-4'>
                {renderAuthButtons()}
            </div>
        </div>
    );
}