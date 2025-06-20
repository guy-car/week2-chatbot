'use client'

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
            <p className="text-lg text-gray-600 max-w-md mx-auto">
                {welcomeMessage}
            </p>
        </div>
    )
}