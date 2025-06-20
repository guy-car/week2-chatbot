'use client'

import { useMemo } from 'react'

const WELCOME_MESSAGES = ["Let your curiosity speak. The Genie listens.",
    "Not all who wander are lost — some are just between films.",
    "Feeling indecisive? Whisper your mood and I’ll do the rest.",
    "The screen is blank — until you speak your wish.",
    "What do you crave tonight: wonder, tension, or beauty?",
    "Speak freely. I specialize in unexpected delights.",
    "Your next favorite film is already waiting. Let's find it.",
    "The mood, the tone, the texture — tell me what moves you.",
    "Welcome back, seeker of stories. What realm shall we explore today?",
    "Every film is a doorway. Tell me what kind of world you wish to enter.",
]

interface WelcomeMessageProps {
    chatId: string
}

export function WelcomeMessage({ chatId }: WelcomeMessageProps) {
    const welcomeMessage = WELCOME_MESSAGES[0];

    return (
        <div className="text-center py-12">
            <p className="text-lg text-gray-600 max-w-md mx-auto">
                {welcomeMessage}
            </p>
        </div>
    )
}