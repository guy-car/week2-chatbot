'use client'

import { type Chip } from '~/app/types'

interface ConversationChipsProps {
    chips: Chip[]
    onChipClick: (chipText: string) => void
}

const chipCategoryColors: Record<Chip['type'], string> = {
    broaden: 'bg-[#221745]/80 text-[#FFC559] border border-[#FFC559]/30 hover:bg-[#221745] hover:glow-gold-subtle transition-all',
    deepen: 'bg-[#024845]/80 text-[#6ADFDB] border border-[#6ADFDB]/30 hover:bg-[#024845] hover:glow-gold-subtle transition-all',
    curveball: 'bg-[#D18843]/20 text-[#D18843] border border-[#D18843]/30 hover:bg-[#D18843]/30 hover:glow-gold transition-all',
    reset: 'bg-gray-800/50 text-gray-300 border border-gray-600/30 hover:bg-gray-800/70 transition-all',
    educational: 'bg-emerald-900/50 text-emerald-300 border border-emerald-400/30 hover:bg-emerald-900/70 transition-all',
    tone_shift: 'bg-rose-900/50 text-rose-300 border border-rose-400/30 hover:bg-rose-900/70 transition-all',
    philosophical: 'bg-indigo-900/50 text-indigo-300 border border-indigo-400/30 hover:bg-indigo-900/70 hover:glow-gold-subtle transition-all',
    nostalgic: 'bg-amber-900/50 text-amber-300 border border-amber-400/30 hover:bg-amber-900/70 hover:glow-gold-subtle transition-all',
    style: 'bg-teal-900/50 text-teal-300 border border-teal-400/30 hover:bg-teal-900/70 transition-all',
    meta: 'bg-orange-900/50 text-orange-300 border border-orange-400/30 hover:bg-orange-900/70 transition-all',
    similar_but_different: 'bg-violet-900/50 text-violet-300 border border-violet-400/30 hover:bg-violet-900/70 transition-all',
    hidden_gem: 'bg-[#024845]/80 text-[#FFC559] border border-[#FFC559]/30 hover:bg-[#024845] hover:glow-gold-strong transition-all',
    completion: 'bg-sky-900/50 text-sky-300 border border-sky-400/30 hover:bg-sky-900/70 transition-all'
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