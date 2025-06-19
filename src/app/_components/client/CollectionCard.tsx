/* eslint-disable @next/next/no-img-element */
'use client'

import { Trash2, Eye, MessageCircle, ThumbsUp, ThumbsDown } from 'lucide-react'
import { Tooltip } from 'react-tooltip'
import { toast } from 'react-hot-toast'
import type { MovieData } from './MovieCardsSection'

interface CollectionCardProps {
    movie: MovieData & { addedAt?: string; watchedAt?: string }
    variant: 'watchlist' | 'history'
    onRemove: (movieId: number) => void
    onMarkWatched?: (movie: MovieData) => void
    onMoreInfo: (movieId: number, mediaType: 'movie' | 'tv', title: string) => void
}

export function CollectionCard({
    movie,
    variant,
    onRemove,
    onMarkWatched,
    onMoreInfo
}: CollectionCardProps) {
    const year = movie.release_date?.substring(0, 4)
    const buttonClasses = "bg-black bg-opacity-50 rounded-lg transition-all flex items-center justify-center hover:bg-opacity-70"

    const handleLike = () => {
        toast.dismiss()
        toast.success(`You liked "${movie.title}"`)
    }

    const handleDislike = () => {
        toast.dismiss()
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
                <h3 className="font-semibold text-gray-800 text-sm line-clamp-2">
                    {movie.title}{year && ` (${year})`}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                    {variant === 'watchlist' && movie.addedAt && `Added ${formatDate(movie.addedAt)}`}
                    {variant === 'history' && movie.watchedAt && `Watched ${formatDate(movie.watchedAt)}`}
                </p>
            </div>

            {/* Poster */}
            {movie.poster_url ? (
                <div className="relative group w-48 h-72 mb-4">
                    <img
                        src={movie.poster_url}
                        alt={movie.title}
                        className="w-full h-full object-cover rounded-lg shadow-md"
                    />

                    <div className="absolute inset-0 pointer-events-none">
                        {/* Top row */}
                        <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-auto">
                            <button
                                className={`${buttonClasses} opacity-0 group-hover:opacity-100`}
                                style={{ width: '3.5rem', height: '3.5rem' }}
                                data-tooltip-id="movie-actions"
                                data-tooltip-content="Remove"
                                onClick={() => onRemove(movie.id)}
                            >
                                <Trash2 className="w-5 h-5 text-white" />
                            </button>

                            {variant === 'watchlist' && onMarkWatched && (
                                <button
                                    className={`${buttonClasses} opacity-0 group-hover:opacity-100`}
                                    style={{ width: '3.5rem', height: '3.5rem' }}
                                    data-tooltip-id="movie-actions"
                                    data-tooltip-content="Mark as watched"
                                    onClick={() => onMarkWatched(movie)}
                                >
                                    <Eye className="w-5 h-5 text-white" />
                                </button>
                            )}
                        </div>

                        {/* Center - More Info */}
                        <button
                            className={`${buttonClasses} absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto opacity-0 group-hover:opacity-100`}
                            style={{ width: '3.5rem', height: '3.5rem' }}
                            data-tooltip-id="movie-actions"
                            data-tooltip-content="More info"
                            onClick={() => onMoreInfo(movie.id, movie.media_type, movie.title)}
                        >
                            <MessageCircle className="w-6 h-6 text-white" />
                        </button>

                        {/* Bottom row - Like/Dislike */}
                        <div className="absolute bottom-4 left-4 right-4 flex justify-between pointer-events-auto">
                            <button
                                className={`${buttonClasses} opacity-0 group-hover:opacity-100`}
                                style={{ width: '3.5rem', height: '3.5rem' }}
                                data-tooltip-id="movie-actions"
                                data-tooltip-content="Like"
                                onClick={handleLike}
                            >
                                <ThumbsUp className="w-5 h-5 text-white" />
                            </button>

                            <button
                                className={`${buttonClasses} opacity-0 group-hover:opacity-100`}
                                style={{ width: '3.5rem', height: '3.5rem' }}
                                data-tooltip-id="movie-actions"
                                data-tooltip-content="Dislike"
                                onClick={handleDislike}
                            >
                                <ThumbsDown className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    </div>
                    <Tooltip id="movie-actions" place="top" delayShow={0} />
                </div>
            ) : (
                <div className="w-48 h-72 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">No poster</span>
                </div>
            )}
        </div>
    )