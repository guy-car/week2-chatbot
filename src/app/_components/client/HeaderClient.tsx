'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { magicButtonStyles } from '~/components/ui/button-magic'
import Image from 'next/image'
import { CustomSidebarTrigger } from '~/components/ui/custom-sidebar-trigger'
import { usePromotedIcons } from './ConversationChips'

interface HeaderClientProps {
    user?: {
        name?: string;
    } | null;
}

export function HeaderClient({ user }: HeaderClientProps) {
    const pathname = usePathname()
    
    // Get promoted icons if we're in the context
    let promotedIcons: string[] = []
    try {
        const { promotedIcons: icons } = usePromotedIcons()
        promotedIcons = icons
    } catch {
        // Not in context, ignore
    }

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

            {/* Promoted Icons */}
            {promotedIcons.length > 0 && (
                <div className="flex items-center gap-4 mx-4">
                    {promotedIcons.map((iconPath, index) => (
                        <div 
                            key={iconPath}
                            className="relative"
                        >
                            <img 
                                src={iconPath} 
                                alt="Promoted cinema equipment"
                                className="w-12 h-12 object-contain"
                                style={{
                                    transform: 'scale(1.1)',
                                    filter: 'drop-shadow(0 0 8px rgba(253, 142, 44, 1)) drop-shadow(0 0 16px rgba(253, 142, 44, 0.8)) drop-shadow(0 0 24px rgba(253, 142, 44, 0.4))'
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Right: Auth Buttons */}
            <div className='flex items-center gap-4'>
                {renderAuthButtons()}
            </div>
        </div>
    );
}