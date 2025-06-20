
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { MovieData } from './MovieCardsSection'

interface HomepageCardProps {
    title: string
    href: string
    icon: React.ReactNode
    storageKey: 'watchlist' | 'watchHistory'
    emptyMessage: string
}

export function HomepageCard({
    title,
    href,
    icon,
    storageKey,
}: HomepageCardProps) {
    const [latestMovie, setLatestMovie] = useState<MovieData | null>(null)
    const [count, setCount] = useState(0)

    useEffect(() => {
        const items = JSON.parse(localStorage.getItem(storageKey) ?? '[]') as MovieData[]
        setCount(items.length)
        if (items.length > 0) {
            // Get the most recent item - check if it's an object (new format) or string (old format)
            const latest = items[items.length - 1]
            if (latest && typeof latest === 'object' && 'title' in latest) {
                setLatestMovie(latest)
            } else {
                // Old format was just strings, so no movie data available
                setLatestMovie(null)
            }
        }
    }, [storageKey])

    return (
        <Link href={href} className="block group">
            <div className="relative h-64 rounded-lg overflow-hidden shadow-lg transition-transform group-hover:scale-105">
                {/* Background image with blur */}
                {latestMovie?.poster_url && (
                    <div
                        className="absolute inset-0 bg-cover bg-center filter blur-[0.5px] scale-110"
                        style={{ backgroundImage: `url(${latestMovie.poster_url})` }}
                    />
                )}
                {!latestMovie?.poster_url && (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600" />
                )}

                {/* Darker at top, lighter at bottom */}
                <div className="absolute inset-0 bg-gradient-to-b from-black via-black/70 to-black/40" />
                {/* Content */}
                <div className="relative h-full p-6 flex flex-col justify-between text-white">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            {icon}
                            <h3 className="text-2xl font-bold">{title}</h3>
                        </div>
                    </div>
                </div>

                {/* Hover effect */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform" />
            </div>
        </Link>
    )
}