'use client'

import { type Chip } from '~/app/types'
import { buttonVariants } from '~/styles/component-styles'

interface ConversationChipsProps {
    chips: Chip[]
    onChipClick: (chipText: string) => void
}

export function ConversationChips({ chips, onChipClick }: ConversationChipsProps) {
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