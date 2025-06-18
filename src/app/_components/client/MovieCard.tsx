/* eslint-disable @next/next/no-img-element */
'use client'

import { ThumbsUp, ThumbsDown, Eye, Bookmark, MessageCircle } from 'lucide-react'
import { Tooltip } from 'react-tooltip'

interface MovieCardProps {
    movie: {
        id: number
        title: string
        poster_url: string | null
        release_date?: string
        media_type: 'movie' | 'tv'
    }
}

export function MovieCard({ movie }: MovieCardProps) {
    const year = movie.release_date?.substring(0, 4)
    const buttonClasses = "bg-black bg-opacity-50 rounded-lg transition-all flex items-center justify-center hover:bg-opacity-70 breathe"


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
                            <button
                                className={buttonClasses}
                                style={{ width: 'var(--button-size)', height: 'var(--button-size)' }}
                                data-tooltip-id="movie-actions"
                                data-tooltip-content="Add to Watchlist"
                            >
                                <Bookmark className="w-5 h-5 text-white" />
                            </button>
                            <button
                                className={buttonClasses}
                                style={{ width: 'var(--button-size)', height: 'var(--button-size)' }}
                                data-tooltip-id="movie-actions"
                                data-tooltip-content="Add to Watchlist"
                            >
                                <Eye className="w-5 h-5 text-white" />
                            </button>
                        </div>

                        {/* Center - More info button - FIXED */}
                        <button
                            className={`${buttonClasses} absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto`}
                            style={{ width: 'var(--button-size)', height: 'var(--button-size)' }}
                            data-tooltip-id="movie-actions"
                            data-tooltip-content="Add to Watchlist"
                        >
                            <MessageCircle className="w-6 h-6 text-white" />
                        </button>

                        {/* Bottom row - buttons 3 and 4 */}
                        <div className="absolute bottom-4 left-4 right-4 flex justify-between pointer-events-auto">
                            <button
                                className={buttonClasses}
                                style={{ width: 'var(--button-size)', height: 'var(--button-size)' }}
                                data-tooltip-id="movie-actions"
                                data-tooltip-content="Add to Watchlist"
                            >
                                <ThumbsUp className="w-5 h-5 text-white" />
                            </button>
                            <button
                                className={buttonClasses}
                                style={{ width: 'var(--button-size)', height: 'var(--button-size)' }}
                                data-tooltip-id="movie-actions"
                                data-tooltip-content="Add to Watchlist"
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