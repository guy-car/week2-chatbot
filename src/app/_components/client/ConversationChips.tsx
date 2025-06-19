'use client'

import { type Chip } from '~/app/types'

interface ConversationChipsProps {
    chips: Chip[]
    onChipClick: (chipText: string) => void
}

const chipCategoryColors: Record<Chip['type'], string> = {
    broaden: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    deepen: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200',
    curveball: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
    reset: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    educational: 'bg-green-100 text-green-700 hover:bg-green-200',
    tone_shift: 'bg-rose-100 text-rose-700 hover:bg-rose-200',
    philosophical: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200',
    nostalgic: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
    style: 'bg-teal-100 text-teal-700 hover:bg-teal-200',
    meta: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
    similar_but_different: 'bg-violet-100 text-violet-700 hover:bg-violet-200',
    hidden_gem: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
    completion: 'bg-sky-100 text-sky-700 hover:bg-sky-200'
}

export function ConversationChips({ chips, onChipClick }: ConversationChipsProps) {
    if (chips.length === 0) return null

    return (
        <div className="mb-6 flex flex-wrap gap-2 justify-center">
            {chips.map((chip, index) => (
                <button
                    key={index}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${chipCategoryColors[chip.type] || chipCategoryColors.broaden
                        }`}
                    onClick={() => onChipClick(chip.text)}
                >
                    {chip.text}
                </button>
            ))}
        </div>
    )
}