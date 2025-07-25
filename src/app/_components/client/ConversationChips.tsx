'use client'

import { type Chip } from '~/app/types'
import { buttonVariants } from '~/styles/component-styles'

// Cinema icons for the loading state
const CINEMA_ICONS = [
  '/icons/footer/camera-2-modern.png',
  '/icons/footer/clap.png', 
  '/icons/footer/crew-1.png',
  '/icons/footer/light.png',
  '/icons/footer/pop-corn.png',
  '/icons/footer/reel-1.png'
];

interface ConversationChipsProps {
    chips: Chip[]
    isAiThinking?: boolean
    onChipClick: (chipText: string) => void
}

export function ConversationChips({ chips, isAiThinking = false, onChipClick }: ConversationChipsProps) {
    // Show cinema icons when AI is thinking
    if (isAiThinking) {
        return (
            <div className="mb-6 flex justify-between items-center w-full">
                {CINEMA_ICONS.map((icon, index) => (
                    <div 
                        key={icon}
                        className="opacity-100 transition-opacity duration-300"
                    >
                        <img 
                            src={icon} 
                            alt="Cinema equipment" 
                            className="w-12 h-12 object-contain"
                        />
                    </div>
                ))}
            </div>
        )
    }

    // Show regular chips when not thinking and chips exist
    if (chips.length === 0) return null

    return (
        <div className="mb-6 flex flex-wrap gap-2 justify-center">
            {chips.map((chip, index) => (
                <button
                    key={index}
                    className={buttonVariants.chip}
                    onClick={() => onChipClick(chip.text)}
                >
                    {chip.text}
                </button>
            ))}
        </div>
    )
}