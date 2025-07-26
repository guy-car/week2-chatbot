'use client'

import { useEffect, useState } from 'react'
import { X, ExternalLink } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { modalVariants } from '~/styles/component-styles'

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
                className={modalVariants.backdrop}
                onClick={onClose}
            />

            {/* Modal */}
            <div className={modalVariants.container}>
                {/* Close button */}
                <button
                    onClick={onClose}
                    className={modalVariants.closeButton}
                >
                    <X className="w-5 h-5" />
                </button>

                <div className={modalVariants.content}>
                    {isLoading ? (
                        /* Skeleton loader */
                        <div className="animate-pulse">
                            <div className={modalVariants.skeletonTitle} />
                            <div className={modalVariants.skeletonText} />
                            <div className={modalVariants.skeletonText} />
                            <div className={modalVariants.skeletonShort} />
                            <div className="flex gap-4 mb-4">
                                <div className={modalVariants.skeletonChip} />
                                <div className={modalVariants.skeletonChipLarge} />
                            </div>
                        </div>
                    ) : details ? (
                        /* Actual content */
                        <>
                            <h2 className={modalVariants.title}>{details.title}</h2>

                            <div className="space-y-4">
                                <div>
                                    <h3 className={modalVariants.sectionHeader}>Overview</h3>
                                    <p className={modalVariants.bodyText}>{details.overview}</p>
                                </div>

                                <div className={modalVariants.infoRow}>
                                    <div>
                                        <span className={modalVariants.infoLabel}>User Score: </span>
                                        <span className={modalVariants.infoValue}>
                                            {(details.vote_average * 10).toFixed(0)}%
                                        </span>
                                    </div>

                                    {details.origin_country.length > 0 && (
                                        <div>
                                            <span className={modalVariants.infoLabel}>Country: </span>
                                            <span className={modalVariants.infoValue}>
                                                {details.origin_country.join(', ')}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {tmdbUrl && (
                                    <div className={modalVariants.divider}>
                                        <a
                                            href={tmdbUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={modalVariants.link}
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