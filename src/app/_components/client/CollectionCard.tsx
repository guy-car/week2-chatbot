'use client'

import { toast } from 'react-hot-toast'
import type { MovieData } from '~/app/types'
import { useTasteProfile } from '~/app/_services/tasteProfile'
import { textVariants } from '~/styles/component-styles'
import { MovieCardSidepanel } from './MovieCardSidepanel'
import { HISTORY_ACTIONS, WATCHLIST_ACTIONS } from './movie-card-icons'

interface CollectionCardProps {
    movie: MovieData & { addedAt?: string; watchedAt?: string }
    variant: 'watchlist' | 'history'
    onRemove: (movieId: number) => void
    onMarkWatched?: (movie: MovieData) => void
    onMoreInfo: (movieId: number, mediaType: 'movie' | 'tv', title: string) => void
    onAddToWatchlist?: (movie: MovieData) => void
}

export function CollectionCard({
    movie,
    variant,
    onRemove,
    onMarkWatched,
    onMoreInfo,
    onAddToWatchlist
}: CollectionCardProps) {
    const { addLikedMovie, addDislikedMovie } = useTasteProfile();
    const year = movie.release_date?.substring(0, 4)

    const handleLike = async () => {
        toast.dismiss()
        await addLikedMovie(movie)
        toast.success(`You liked "${movie.title}"`)
    }

    const handleDislike = async () => {
        await addDislikedMovie(movie)
        toast.success(`You disliked "${movie.title}"`)
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }

    return (
        <div className="flex flex-col h-full items-center">
            {/* Title + Metadata block */}
            <div className="text-center mb-2 w-48 px-2 min-h-[4.5rem]">
                <h3 className={`font-semibold text-sm line-clamp-2 ${textVariants.primary}`}>
                    {movie.title}{year && ` (${year})`}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                    {variant === 'watchlist' && movie.addedAt && `Added ${formatDate(movie.addedAt)}`}
                    {variant === 'history' && movie.watchedAt && `Watched ${formatDate(movie.watchedAt)}`}
                </p>
            </div>

            {/* Poster with chat-mode hover UI */}
            {movie.poster_url ? (
                <div className="mb-4">
                    <MovieCardSidepanel
                        posterUrl={movie.poster_url}
                        movieTitle={movie.title}
                        movieId={movie.id}
                        onMoreInfo={() => onMoreInfo(movie.id, movie.media_type, movie.title)}
                        onLike={handleLike}
                        onDislike={handleDislike}
                        onRemove={() => onRemove(movie.id)}
                        onMarkAsWatched={variant === 'watchlist' && onMarkWatched ? () => onMarkWatched(movie) : undefined}
                        onAddToWatchlist={variant === 'history' && onAddToWatchlist ? () => onAddToWatchlist(movie) : undefined}
                        actions={variant === 'watchlist' ? WATCHLIST_ACTIONS : HISTORY_ACTIONS}
                        posterWidth={192}
                        posterHeight={288}
                    />
                </div>
            ) : (
                <div className="w-48 h-72 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">No poster</span>
                </div>
            )}
        </div>
    )
}