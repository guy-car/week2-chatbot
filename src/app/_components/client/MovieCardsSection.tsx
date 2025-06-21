'use client'

import { useState, useEffect } from 'react'
import { MovieCard } from './MovieCard'
import { MovieDetailsModal } from './MovieDetailsModal'

import { type MovieData } from "~/app/types/index"

interface MovieCardsSectionProps {
    movies: MovieData[]
}

export function MovieCardsSection({ movies }: MovieCardsSectionProps) {
    const [isVisible, setIsVisible] = useState(false)

    const [modalOpen, setModalOpen] = useState(false)
    const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null)
    const [selectedMediaType, setSelectedMediaType] = useState<'movie' | 'tv' | null>(null)
    const [selectedMovieTitle, setSelectedMovieTitle] = useState('')

    useEffect(() => {
        if (movies.length > 0) {
            setIsVisible(true)
        }
    }, [movies.length])

    const handleMoreInfo = (movieId: number, mediaType: 'movie' | 'tv', title: string) => {
        setSelectedMovieId(movieId)
        setSelectedMediaType(mediaType)
        setSelectedMovieTitle(title)
        setModalOpen(true)
    }

    const handleCloseModal = () => {
        setModalOpen(false)
        // Clear state after modal animation completes
        setTimeout(() => {
            setSelectedMovieId(null)
            setSelectedMediaType(null)
            setSelectedMovieTitle('')
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

            {/* Add the modal */}
            <MovieDetailsModal
                isOpen={modalOpen}
                onClose={handleCloseModal}
                movieId={selectedMovieId}
                mediaType={selectedMediaType}
                movieTitle={selectedMovieTitle}
            />
        </>
    )
}