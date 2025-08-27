'use client'

import { toast } from 'react-hot-toast'
import Image from 'next/image'
import { useMovieCollections } from '~/app/_services/useMovieCollections'
import { useTasteProfile } from '~/app/_services/tasteProfile'
import { MovieCardSidepanel } from './MovieCardSidepanel'
import { useEffect, useRef, useState } from 'react'
import { api } from '~/trpc/react'

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
    const { addLikedMovie, addDislikedMovie } = useTasteProfile();
    const { addToWatchlist, markAsWatched } = useMovieCollections();
    const year = movie.release_date?.substring(0, 4)

    const handleAddToWatchlist = async () => {
        toast.dismiss()

        try {
            await addToWatchlist(movie);
            toast.success(`Added "${movie.title}" to watchlist`, {
                icon: (
                    <Image src="/icons/new_cyan/star.png" alt="" width={18} height={18} aria-hidden />
                ),
            });
        } catch (error) {
            if (error instanceof Error && error.message === 'Already in watchlist') {
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
            toast.success(`Marked "${movie.title}" as watched`, {
                icon: (
                    <Image src="/icons/new_cyan/eye.png" alt="" width={18} height={18} aria-hidden />
                ),
            });
        } catch (error) {
            if (error instanceof Error && error.message === 'Already watched') {
                toast(`"${movie.title}" is already in your watch history`);
            } else {
                toast.error('Failed to mark as watched');
            }
        }
    }

    const handleLike = async () => {
        toast.dismiss()
        await addLikedMovie(movie)
        toast.success('Taste profile updated', {
            icon: (
                <Image src="/icons/new_cyan/popcorn.png" alt="" width={18} height={18} aria-hidden />
            ),
        })
    }

    const handleDislike = async () => {
        await addDislikedMovie(movie)
        toast.success('Taste profile updated', {
            icon: (
                <Image src="/icons/new_cyan/popcorn.png" alt="" width={18} height={18} aria-hidden />
            ),
        })
    }

    const handleMoreInfo = () => {
        toast.dismiss()
        if (onMoreInfo) {
            onMoreInfo(movie.id, movie.media_type, movie.title)
        } else {
            toast('More info feature coming soon!')
        }
    }

    // Enrichment trigger (poster visibility)
    const posterContainerRef = useRef<HTMLDivElement | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (!posterContainerRef.current) return;
        let observed = true;
        const el = posterContainerRef.current;
        const io = new IntersectionObserver((entries) => {
            const entry = entries[0];
            if (entry?.isIntersecting) {
                setIsVisible(true);
                if (observed) {
                    io.unobserve(el);
                    observed = false;
                }
            }
        }, { root: null, threshold: 0.2 });
        io.observe(el);
        return () => {
            if (observed) io.unobserve(el);
            io.disconnect();
        };
    }, []);

    api.enrichment.enrich.useQuery(
        { type: movie.media_type, id: movie.id },
        { enabled: isVisible, staleTime: 1000 * 60 * 10 }
    );

    // Prefetch base movie data so modal opens with minimal loading
    api.movies.getMovieData.useQuery(
        { type: movie.media_type, id: movie.id },
        { enabled: isVisible, staleTime: 1000 * 60 * 10 }
    );

    return (
        <div className="flex flex-col items-center" ref={posterContainerRef}>
            <div className="text-center mb-2 w-40 px-2 h-12 flex items-center justify-center">
                <p className="font-semibold text-white line-clamp-2 text-movie-title-chat">
                    {movie.title}{year && ` (${year})`}
                </p>
            </div>
            {movie.poster_url ? (
                <MovieCardSidepanel
                    posterUrl={movie.poster_url}
                    movieTitle={movie.title}
                    movieId={movie.id} // Add movieId prop
                    onAddToWatchlist={handleAddToWatchlist}
                    onMarkAsWatched={handleMarkAsWatched}
                    onMoreInfo={handleMoreInfo}
                    onLike={handleLike}
                    onDislike={handleDislike}
                />
            ) : (
                <div className="w-48 h-72 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">No poster</span>
                </div>
            )}
        </div>
    )
}