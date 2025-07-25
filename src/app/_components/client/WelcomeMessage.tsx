'use client'

import Image from 'next/image'

const WELCOME_MESSAGES = ["Let your curiosity speak. The Genie listens.",
    "Not all who wander are lost — some are just between films.",
    "Feeling indecisive? Whisper your mood and I'll do the rest.",
    "The screen is blank — until you speak your wish.",
    "What do you crave tonight: wonder, tension, or beauty?",
    "Speak freely. I specialize in unexpected delights.",
    "Welcome back, seeker of stories. What realm shall we explore today?",
    "Every film is a doorway. Tell me what kind of world you wish to enter.",
]

interface WelcomeMessageProps {
    chatId: string
}

export function WelcomeMessage({ chatId }: WelcomeMessageProps) {
    // Use chatId to generate a stable index (same chatId = same message)
    const getStableIndex = (id: string) => {
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            const char = id.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash) % WELCOME_MESSAGES.length;
    };

    const messageIndex = chatId ? getStableIndex(chatId) : 0;
    const welcomeMessage = WELCOME_MESSAGES[messageIndex];

    return (
        <div className="text-center py-12">
            <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 max-w-6xl mx-auto px-4">
                {/* Genie Logo - Large, responsive */}
                <div className="flex-shrink-0">
                    <Image
                        src="/genie/genie-1.png"
                        alt="Watch Genie"
                        width={400}
                        height={400}
                        className="w-90 h-90 sm:w-120 sm:h-120 md:w-150 md:h-150 lg:w-180 lg:h-180 object-contain"
                        priority
                    />
                </div>
                
                {/* Welcome Message */}
                <div className="flex-1 max-w-md lg:max-w-lg">
                    <p className="text-2xl sm:text-3xl lg:text-4xl text-[#FD8E2C] font-sans font-normal italic leading-relaxed"
                        style={{
                            textShadow: `
                                0 0 3px rgba(253, 142, 44, 0.47)
                            `
                        }}>
                        {welcomeMessage}
                    </p>
                </div>
            </div>
        </div>
    )
}