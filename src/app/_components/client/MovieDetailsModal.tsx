'use client'

import { useEffect, useState } from 'react'
import { X, ExternalLink } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface MovieDetails {
    id: number
    title: string
    overview: string
    vote_average: number
    origin_country: string[]
    homepage?: string
    poster_path?: string
    release_date?: string
    media_type: 'movie' | 'tv'
}

interface MovieDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    movieId: number | null
    mediaType: 'movie' | 'tv' | null
    movieTitle: string
}

export function MovieDetailsModal({
    isOpen,
    onClose,
    movieId,
    mediaType,
}: MovieDetailsModalProps) {
    const [details, setDetails] = useState<MovieDetails | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (isOpen && movieId && mediaType) {
            setIsLoading(true)
            fetch(`/api/movie-details?id=${movieId}&type=${mediaType}`)
                .then(res => res.json())
                .then((data: MovieDetails | { error: string }) => {
                    if ('error' in data) {
                        throw new Error(data.error)
                    }
                    setDetails(data)
                })
                .catch(err => {
                    console.error('Failed to fetch details:', err)
                    toast.error('Failed to load movie details')
                    onClose()
                })
                .finally(() => {
                    setIsLoading(false)
                })
        }
    }, [isOpen, movieId, mediaType, onClose])

    if (!isOpen) return null

    const tmdbUrl = mediaType && movieId
        ? `https://www.themoviedb.org/${mediaType}/${movieId}`
        : null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray bg-opacity-40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-6">
                    {isLoading ? (
                        /* Skeleton loader */
                        <div className="animate-pulse">
                            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
                            <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                            <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                            <div className="h-4 bg-gray-200 rounded w-2/3 mb-4" />
                            <div className="flex gap-4 mb-4">
                                <div className="h-6 bg-gray-200 rounded w-24" />
                                <div className="h-6 bg-gray-200 rounded w-32" />
                            </div>
                        </div>
                    ) : details ? (
                        /* Actual content */
                        <>
                            <h2 className="text-2xl font-bold mb-4">{details.title}</h2>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-1">Overview</h3>
                                    <p className="text-gray-600">{details.overview}</p>
                                </div>

                                <div className="flex gap-6">
                                    <div>
                                        <span className="font-semibold text-gray-700">User Score: </span>
                                        <span className="text-gray-600">
                                            {(details.vote_average * 10).toFixed(0)}%
                                        </span>
                                    </div>

                                    {details.origin_country.length > 0 && (
                                        <div>
                                            <span className="font-semibold text-gray-700">Country: </span>
                                            <span className="text-gray-600">
                                                {details.origin_country.join(', ')}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {tmdbUrl && (
                                    <div className="pt-4 border-t">
                                        <a
                                            href={tmdbUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                                        >
                                            View on TMDB
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : null}
                </div>
            </div>
        </div >
    )
}