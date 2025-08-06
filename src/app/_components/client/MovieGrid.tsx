'use client'

import { useState } from 'react'
import { CollectionCard } from './CollectionCard'
import { MovieDetailsModal } from './MovieDetailsModal'
import type { MovieData } from '~/app/types'
import { toast } from 'react-hot-toast'
import { useMovieCollections } from '~/app/_services/useMovieCollections';

interface MovieGridProps {
    movies: (MovieData & { addedAt?: string; watchedAt?: string })[]
    variant: 'watchlist' | 'history'
}

export function MovieGrid({ movies, variant }: MovieGridProps) {
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null)
    const [selectedMediaType, setSelectedMediaType] = useState<'movie' | 'tv' | null>(null)
    const [selectedMovieTitle, setSelectedMovieTitle] = useState('')

    const { removeFromWatchlist, removeFromHistory, markAsWatched } = useMovieCollections();

    const handleRemove = async (movieId: number) => {
        try {
            if (variant === 'watchlist') {
                await removeFromWatchlist(movieId);
            } else {
                await removeFromHistory(movieId);
            }
            const movie = movies.find(m => m.id === movieId);
            toast.success(`Removed "${movie?.title}" from ${variant}`);
        } catch {
            toast.error('Failed to remove movie');
        }
    }

    const handleMarkWatched = async (movie: MovieData) => {
        try {
            await markAsWatched(movie);
            toast.success(`Moved "${movie.title}" to watch history`);
        } catch {
            toast.error('Failed to mark as watched');
        }
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-14">
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