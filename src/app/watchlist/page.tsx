'use client'

import { useState, useEffect } from 'react';

export default function WatchlistPage() {
    const [movies, setMovies] = useState<string[]>([]);

    useEffect(() => {
        const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
        setMovies(watchlist);
    }, []);

    if (movies.length === 0) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <h1 className="text-3xl font-bold mb-6">My Watchlist</h1>
                <p className="text-gray-600">Your watchlist is empty</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">My Watchlist</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {movies.map((movie, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-white shadow">
                        <h3 className="font-semibold">{movie}</h3>
                    </div>
                ))}
            </div>
        </div>
    );
}