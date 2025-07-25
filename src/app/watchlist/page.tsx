'use client'

import { useMovieCollections } from '~/app/_services/useMovieCollections';
import { MovieGrid } from '~/app/_components/client/MovieGrid';
import type { MovieData } from '~/app/types';

export default function WatchlistPage() {
    const { watchlist, isLoading } = useMovieCollections();

    // Transform database format to MovieData format
    const movies: MovieData[] = watchlist.map(item => ({
        id: parseInt(item.movieId),
        title: item.title,
        poster_url: item.posterUrl,
        media_type: item.mediaType,
        release_date: item.releaseDate ?? undefined,
        rating: item.rating ?? undefined,
        overview: item.overview ?? undefined,
    }));

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto p-6">
                <h1 className="text-3xl font-bold mb-6">My Watchlist</h1>
                <p className="text-gray-600">Loading your watchlist...</p>
            </div>
        );
    }

    if (movies.length === 0) {
        return (
            <div className="max-w-7xl mx-auto p-6">
                <h1 className="text-3xl font-bold mb-6 text-[#FD8E2C] glow-gold-subtle text-center">My Watchlist</h1>
                <div className="text-center py-8">
                    <div className="text-center space-y-4">
                        <p className="text-[#A1A1A1] text-lg">Your watchlist is empty...</p>
                        <p className="text-gray-400 italic">Fill it up to satiate the Genie</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">My Watchlist</h1>
            <p className="text-gray-600 mb-8">{movies.length} movie{movies.length !== 1 ? 's' : ''} to watch</p>
            <MovieGrid
                movies={movies}
                variant="watchlist"
            />
        </div>
    );
}