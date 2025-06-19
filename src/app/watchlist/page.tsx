'use client'

import { useState, useEffect } from 'react';
import { MovieGrid } from '~/app/_components/client/MovieGrid';
import type { MovieData } from '~/app/_components/client/MovieCardsSection';

export default function WatchlistPage() {
    const [movies, setMovies] = useState<(MovieData & { addedAt?: string })[]>([]);

    const loadMovies = () => {
        const watchlist = JSON.parse(localStorage.getItem('watchlist') ?? '[]') as (MovieData & { addedAt?: string })[];
        // Sort by most recently added
        watchlist.sort((a, b) => {
            const dateA = a.addedAt ? new Date(a.addedAt).getTime() : 0;
            const dateB = b.addedAt ? new Date(b.addedAt).getTime() : 0;
            return dateB - dateA;
        });
        setMovies(watchlist);
    };

    useEffect(() => {
        loadMovies();
    }, []);

    if (movies.length === 0) {
        return (
            <div className="max-w-7xl mx-auto p-6">
                <h1 className="text-3xl font-bold mb-6">My Watchlist</h1>
                <p className="text-gray-600">Your watchlist is empty. Start adding movies from your chats!</p>
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
                onUpdate={loadMovies}
            />
        </div>
    );
}