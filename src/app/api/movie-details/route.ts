import { type NextRequest } from 'next/server'

interface TMDBMovieDetails {
    id: number;
    title?: string;
    name?: string;
    overview: string;
    vote_average: number;
    origin_country?: string[];
    homepage: string;
    poster_path: string | null;
    release_date?: string;
    first_air_date?: string;
    status_message?: string;
}


export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    const type = searchParams.get('type')

    if (!id || !type) {
        return Response.json({ error: 'Missing id or type parameter' }, { status: 400 })
    }

    if (type !== 'movie' && type !== 'tv') {
        return Response.json({ error: 'Invalid type parameter' }, { status: 400 })
    }

    try {
        const url = `https://api.themoviedb.org/3/${type}/${id}?language=en-US`
        const options = {
            method: 'GET',
            headers: {
                accept: 'application/json',
                Authorization: `Bearer ${process.env.TMDB_API_KEY}`
            }
        }

        const response = await fetch(url, options)
        const data = await response.json() as TMDBMovieDetails

        if (!response.ok) {
            throw new Error(data.status_message ?? 'Failed to fetch details')
        }

        // Extract only the fields we need
        return Response.json({
            id: data.id,
            title: data.title ?? data.name,
            overview: data.overview,
            vote_average: data.vote_average,
            origin_country: data.origin_country ?? [],
            homepage: data.homepage,
            poster_path: data.poster_path,
            release_date: data.release_date ?? data.first_air_date,
            media_type: type
        })

    } catch (error) {
        console.error('TMDB API error:', error)
        return Response.json(
            { error: 'Failed to fetch movie details' },
            { status: 500 }
        )
    }
}