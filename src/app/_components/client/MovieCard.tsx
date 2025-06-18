/* eslint-disable @next/next/no-img-element */
'use client'

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

    return (
        <div className="flex flex-col items-center">
            <div className="text-center mb-2 w-40 px-2 h-12 flex items-center justify-center">
                <h3 className="font-semibold text-gray-800 line-clamp-2">
                    {movie.title}{year && ` (${year})`}
                </h3>
            </div>
            {movie.poster_url ? (
                <img
                    src={movie.poster_url}
                    alt={movie.title}
                    className="object-cover rounded-lg shadow-md"
                    style={{
                        width: 'min(160px, 15vw)',  // 15% of viewport width, max 160px
                        height: 'min(240px, 22.5vw)' // Maintains 1.5 aspect ratio
                    }}
                />
            ) : (
                <div className="w-48 h-72 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">No poster</span>
                </div>
            )}
        </div>
    )
}