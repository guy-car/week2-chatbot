'use client'

import { useState, useEffect } from 'react'
import { MovieCard } from './MovieCard'
import { RichMovieModal } from './RichMovieModal'

import { type MovieData } from "~/app/types/index"

interface MovieCardsSectionProps {
    movies: MovieData[]
}

export function MovieCardsSection({ movies }: MovieCardsSectionProps) {
    const [isVisible, setIsVisible] = useState(false)

    const [modalOpen, setModalOpen] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

    useEffect(() => {
        if (movies.length > 0) {
            setIsVisible(true)
        }
    }, [movies.length])

    const handleMoreInfo = (movieId: number, mediaType: 'movie' | 'tv', title: string) => {
        const idx = movies.findIndex(m => m.id === movieId && m.media_type === mediaType)
        setSelectedIndex(idx >= 0 ? idx : 0)
        setModalOpen(true)
    }

    const handleCloseModal = () => {
        setModalOpen(false)
        // Clear state after modal animation completes
        setTimeout(() => {
            setSelectedIndex(null)
        }, 300)
    }


    if (movies.length === 0) return null

    return (
        <>
            <div
                className={`border-t border-b border-border py-6 mb-6 transition-all duration-500 ease-in-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
                    }`}
            >
                <div className="flex flex-wrap justify-evenly gap-10">
                    {movies.map((movie) => (
                        <MovieCard
                            key={movie.id}
                            movie={movie}
                            onMoreInfo={handleMoreInfo}  // Pass the handler
                        />
                    ))}
                </div>
            </div>

            {/* Add the new rich modal */}
            <RichMovieModal
                isOpen={modalOpen}
                onClose={handleCloseModal}
                movieId={selectedIndex !== null ? movies[selectedIndex]?.id ?? null : null}
                mediaType={selectedIndex !== null ? movies[selectedIndex]?.media_type ?? null : null}
                adjacent={selectedIndex !== null ? {
                    items: movies.map(m => ({ id: m.id, media_type: m.media_type })),
                    currentIndex: selectedIndex,
                    onIndexChange: (next) => setSelectedIndex(next),
                } : undefined}
            />
        </>
    )
}