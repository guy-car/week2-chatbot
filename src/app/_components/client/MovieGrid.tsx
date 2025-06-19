'use client'

import { useState } from 'react'
import { CollectionCard } from './CollectionCard'
import { MovieDetailsModal } from './MovieDetailsModal'
import type { MovieData } from './MovieCardsSection'
import { toast } from 'react-hot-toast'

interface MovieGridProps {
    movies: (MovieData & { addedAt?: string; watchedAt?: string })[]
    variant: 'watchlist' | 'history'
    onUpdate: () => void  // Callback to refresh the list after changes
}

export function MovieGrid({ movies, variant, onUpdate }: MovieGridProps) {
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null)
    const [selectedMediaType, setSelectedMediaType] = useState<'movie' | 'tv' | null>(null)
    const [selectedMovieTitle, setSelectedMovieTitle] = useState('')

    const handleRemove = (movieId: number) => {
        const storageKey = variant === 'watchlist' ? 'watchlist' : 'watchHistory'
        const items = JSON.parse(localStorage.getItem(storageKey) ?? '[]') as any[]
        const filtered = items.filter(item => item.id !== movieId)
        localStorage.setItem(storageKey, JSON.stringify(filtered))

        const movie = movies.find(m => m.id === movieId)
        toast.success(`Removed "${movie?.title}" from ${variant}`)
        onUpdate()
    }

    const handleMarkWatched = (movie: MovieData) => {
        // Add to history
        const history = JSON.parse(localStorage.getItem('watchHistory') ?? '[]') as any[]
        const movieData = {
            ...movie,
            watchedAt: new Date().toISOString()
        }
        history.push(movieData)
        localStorage.setItem('watchHistory', JSON.stringify(history))

        // Remove from watchlist
        const watchlist = JSON.parse(localStorage.getItem('watchlist') ?? '[]') as any[]
        const filtered = watchlist.filter(item => item.id !== movie.id)
        localStorage.setItem('watchlist', JSON.stringify(filtered))

        toast.success(`Moved "${movie.title}" to watch history`)
        onUpdate()
    }

    const handleMoreInfo = (movieId: number, mediaType: 'movie' | 'tv', title: string) => {
        setSelectedMovieId(movieId)
        setSelectedMediaType(mediaType)
        setSelectedMovieTitle(title)
        setModalOpen(true)
    }

    const handleCloseModal = () => {
        setModalOpen(false)
        setTimeout(() => {
            setSelectedMovieId(null)
            setSelectedMediaType(null)
            setSelectedMovieTitle('')
        }, 300)
    }

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {movies.map((movie) => (
                    <CollectionCard
                        key={movie.id}
                        movie={movie}
                        variant={variant}
                        onRemove={handleRemove}
                        onMarkWatched={variant === 'watchlist' ? handleMarkWatched : undefined}
                        onMoreInfo={handleMoreInfo}
                    />
                ))}
            </div>

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