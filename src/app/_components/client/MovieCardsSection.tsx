'use client'

import { useState, useEffect } from 'react'
import { MovieCard } from './MovieCard'

export interface MovieData {
    id: number
    title: string
    poster_url: string | null
    release_date?: string
    rating?: number
    overview?: string
    media_type: 'movie' | 'tv'
}

interface MovieCardsSectionProps {
    movies: MovieData[]
}

export function MovieCardsSection({ movies }: MovieCardsSectionProps) {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        if (movies.length > 0) {
            setIsVisible(true)
        }
    }, [movies.length])

    if (movies.length === 0) return null

    const recentMovies = movies.slice(-3)

    return (
        <div
            className={`border-t border-b border-gray-300 bg-gray-50 py-6 mb-6 transition-all duration-500 ease-in-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
                }`}
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 justify-items-center">
                {recentMovies.map((movie) => (
                    <MovieCard key={movie.id} movie={movie} />
                ))}
            </div>
        </div>
    )
}