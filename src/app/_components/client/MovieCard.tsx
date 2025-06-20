/* eslint-disable @next/next/no-img-element */
'use client'

import { ThumbsUp, ThumbsDown, Eye, Bookmark, MessageCircle } from 'lucide-react'
import { Tooltip } from 'react-tooltip'
import { toast } from 'react-hot-toast'
import { tasteProfileService } from '~/app/_services/tasteProfile'
import { useMovieCollections } from '~/app/_services/useMovieCollections'


interface MovieCardProps {
    movie: {
        id: number
        title: string
        poster_url: string | null
        release_date?: string
        media_type: 'movie' | 'tv'
    }
    onMoreInfo?: (movieId: number, mediaType: 'movie' | 'tv', title: string) => void
}

export function MovieCard({ movie, onMoreInfo }: MovieCardProps) {
    const year = movie.release_date?.substring(0, 4)
    const buttonClasses = "bg-black bg-opacity-50 rounded-lg transition-all flex items-center justify-center hover:bg-opacity-70 opacity-25 group-hover:opacity-100"

    const { addToWatchlist, markAsWatched, watchlist, watchHistory } = useMovieCollections();

    const handleAddToWatchlist = async () => {
        toast.dismiss()

        try {
            await addToWatchlist(movie);
            toast.success(`Added "${movie.title}" to watchlist`);
        } catch (error) {
            if (error.message === 'Already in watchlist') {
                toast.error(`"${movie.title}" is already in your watchlist`);
            } else {
                toast.error('Failed to add to watchlist');
            }
        }
    }

    const handleMarkAsWatched = async () => {
        toast.dismiss()

        try {
            await markAsWatched(movie);
            toast.success(`Marked "${movie.title}" as watched`);
        } catch (error) {
            if (error.message === 'Already watched') {
                toast(`"${movie.title}" is already in your watch history`);
            } else {
                toast.error('Failed to mark as watched');
            }
        }
    }

    const handleLike = () => {
        toast.dismiss()
        tasteProfileService.addLikedMovie(movie)
        toast.success(`You liked "${movie.title}"`)
    }

    const handleDislike = () => {
        tasteProfileService.addDislikedMovie(movie)
        toast.success(`You disliked "${movie.title}"`)
    }

    const handleMoreInfo = () => {
        toast.dismiss()
        if (onMoreInfo) {
            onMoreInfo(movie.id, movie.media_type, movie.title)
        } else {
            toast('More info feature coming soon!')
        }
    }

    return (
        <div className="flex flex-col items-center">
            <div className="text-center mb-2 w-40 px-2 h-12 flex items-center justify-center">
                <h3 className="font-semibold text-gray-800 line-clamp-2">
                    {movie.title}{year && ` (${year})`}
                </h3>
            </div>
            {movie.poster_url ? (
                <div className="relative group" style={{ '--button-size': '3.5rem' } as React.CSSProperties}>
                    <img
                        src={movie.poster_url}
                        alt={movie.title}
                        className="w-48 h-72 md:w-56 md:h-84 lg:w-64 lg:h-96 object-cover rounded-lg shadow-md"
                    />

                    {/* Button container */}
                    <div className="absolute inset-0 pointer-events-none">
                        {/* Top row - buttons 1 and 2 */}
                        <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-auto">
                            {/* Add to Watchlist */}
                            <button
                                className={buttonClasses}
                                style={{ width: 'var(--button-size)', height: 'var(--button-size)' }}
                                data-tooltip-id="movie-actions"
                                data-tooltip-content="Add to Watchlist"
                                onClick={handleAddToWatchlist}
                            >
                                <Bookmark className="w-5 h-5 text-white" />
                            </button>
                            {/* Mark as watched */}
                            <button
                                className={buttonClasses}
                                style={{ width: 'var(--button-size)', height: 'var(--button-size)' }}
                                data-tooltip-id="movie-actions"
                                data-tooltip-content="Mark as watched"
                                onClick={handleMarkAsWatched}
                            >
                                <Eye className="w-5 h-5 text-white" />
                            </button>
                        </div>

                        {/* More info */}
                        <button
                            className={`${buttonClasses} absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto`}
                            style={{ width: 'var(--button-size)', height: 'var(--button-size)' }}
                            data-tooltip-id="movie-actions"
                            data-tooltip-content="More info"
                            onClick={handleMoreInfo}
                        >
                            <MessageCircle className="w-6 h-6 text-white" />
                        </button>
                        <div className="absolute bottom-4 left-4 right-4 flex justify-between pointer-events-auto">
                            {/* Like */}
                            <button
                                className={buttonClasses}
                                style={{ width: 'var(--button-size)', height: 'var(--button-size)' }}
                                data-tooltip-id="movie-actions"
                                data-tooltip-content="Like"
                                onClick={handleLike}
                            >
                                <ThumbsUp className="w-5 h-5 text-white" />
                            </button>
                            {/* Dislike */}
                            <button
                                className={buttonClasses}
                                style={{ width: 'var(--button-size)', height: 'var(--button-size)' }}
                                data-tooltip-id="movie-actions"
                                data-tooltip-content="Dislike"
                                onClick={handleDislike}
                            >
                                <ThumbsDown className="w-5 h-5 text-white" />
                            </button>
                            <Tooltip id="movie-actions" place="top" delayShow={0} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="w-48 h-72 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">No poster</span>
                </div>
            )}
        </div>
    )
}