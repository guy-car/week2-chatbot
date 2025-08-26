'use client'

import Link from 'next/link'

interface HomepageCardProps {
    title: string
    href: string
    icon: React.ReactNode
    latestMovie?: {
        id: string;
        title: string;
        movieId: string;
        posterUrl: string | null;
        mediaType: "movie" | "tv";
        releaseDate: string | null;
        rating: number | null;
        overview: string | null;
    } | null
    count?: number
    emptyMessage: string
}

export function HomepageCard({
    title,
    href,
    icon,
    latestMovie,
    count = 0,
    emptyMessage
}: HomepageCardProps) {
    return (
        <Link href={href} className="block group">
            <div className="relative h-80 overflow-hidden shadow-lg transition-transform group-hover:scale-105" style={{ borderRadius: '11px' }}>
                {/* Background image or gradient */}
                {latestMovie?.posterUrl ? (
                    <div
                        className="absolute inset-0 bg-cover bg-center filter blur-[0.5px] scale-110"
                        style={{ backgroundImage: `url(${latestMovie.posterUrl})` }}
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600" />
                )}

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-black via-black/70 to-black/40" />

                {/* Content */}
                <div className="relative h-full p-6 flex flex-col justify-between text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center">
                            {icon}
                        </div>
                        <h3 className="text-2xl font-bold">{title}</h3>
                    </div>

                    <div className="space-y-2">
                        {latestMovie ? (
                            <>
                                <p className="text-sm opacity-80">Latest: {latestMovie.title}</p>
                                <p className="text-lg font-semibold">{count} {count === 1 ? 'movie' : 'movies'}</p>
                            </>
                        ) : (
                            <p className="text-sm opacity-80">{emptyMessage}</p>
                        )}
                    </div>
                </div>

                {/* Hover effect */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#FD8E2C] transform scale-x-0 group-hover:scale-x-100 transition-transform" />
            </div>
        </Link>
    )
}