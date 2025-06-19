'use client'

import { useState, useEffect } from 'react';
import { MovieGrid } from '~/app/_components/client/MovieGrid';
import type { MovieData } from '~/app/_components/client/MovieCardsSection';

export default function HistoryPage() {
    const [movies, setMovies] = useState<(MovieData & { watchedAt?: string })[]>([]);

    const loadMovies = () => {
        const history = JSON.parse(localStorage.getItem('watchHistory') ?? '[]') as (MovieData & { watchedAt?: string })[];
        // Sort by most recently watched
        history.sort((a, b) => {
            const dateA = a.watchedAt ? new Date(a.watchedAt).getTime() : 0;
            const dateB = b.watchedAt ? new Date(b.watchedAt).getTime() : 0;
            return dateB - dateA;
        });
        setMovies(history);
    };

    useEffect(() => {
        loadMovies();
    }, []);

    if (movies.length === 0) {
        return (
            <div className="max-w-7xl mx-auto p-6">
                <h1 className="text-3xl font-bold mb-6">Watch History</h1>
                <p className="text-gray-600">You haven&apos;t watched any movies yet. Mark movies as watched from your watchlist!</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Watch History</h1>
            <p className="text-gray-600 mb-8">{movies.length} movie{movies.length !== 1 ? 's' : ''} watched</p>
            <MovieGrid
                movies={movies}
                variant="history"
                onUpdate={loadMovies}
            />
        </div>
    );
}