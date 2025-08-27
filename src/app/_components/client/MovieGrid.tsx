'use client'

import { useState } from 'react'
import { CollectionCard } from './CollectionCard'
import { RichMovieModal } from './RichMovieModal'
import type { MovieData } from '~/app/types'
import { toast } from 'react-hot-toast'
import Image from 'next/image'
import { useMovieCollections } from '~/app/_services/useMovieCollections';

interface MovieGridProps {
    movies: (MovieData & { addedAt?: string; watchedAt?: string })[]
    variant: 'watchlist' | 'history'
}

export function MovieGrid({ movies, variant }: MovieGridProps) {
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

    const { removeFromWatchlist, removeFromHistory, markAsWatched, addToWatchlist } = useMovieCollections();

    const handleRemove = async (movieId: number) => {
        try {
            if (variant === 'watchlist') {
                await removeFromWatchlist(movieId);
            } else {
                await removeFromHistory(movieId);
            }
            const movie = movies.find(m => m.id === movieId);
            toast.success(`Removed "${movie?.title}" from ${variant}`, {
                icon: (
                    <Image src="/icons/new_cyan/trash.png" alt="" width={18} height={18} aria-hidden />
                ),
            });
        } catch {
            toast.error('Failed to remove movie');
        }
    }

    const handleMarkWatched = async (movie: MovieData) => {
        try {
            await markAsWatched(movie);
            toast.success(`Moved "${movie.title}" to watch history`, {
                icon: (
                    <Image src="/icons/new_cyan/eye.png" alt="" width={18} height={18} aria-hidden />
                ),
            });
        } catch {
            toast.error('Failed to mark as watched');
        }
    }
    const handleAddToWatchlist = async (movie: MovieData) => {
        try {
            await addToWatchlist(movie);
            toast.success(`Added "${movie.title}" to watchlist`, {
                icon: (
                    <Image src="/icons/new_cyan/star.png" alt="" width={18} height={18} aria-hidden />
                ),
            });
        } catch {
            toast.error('Failed to add to watchlist');
        }
    }
    const handleMoreInfo = (movieId: number, mediaType: 'movie' | 'tv', _title: string) => {
        const idx = movies.findIndex(m => m.id === movieId && m.media_type === mediaType)
        setSelectedIndex(idx >= 0 ? idx : 0)
        setModalOpen(true)
    }

    const handleCloseModal = () => {
        setModalOpen(false)
        setTimeout(() => {
            setSelectedIndex(null)
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
                        onAddToWatchlist={variant === 'history' ? handleAddToWatchlist : undefined}
                        onMoreInfo={handleMoreInfo}
                    />
                ))}
            </div>

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