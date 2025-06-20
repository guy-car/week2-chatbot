export interface Chip {
    text: string
    type: 'broaden' | 'deepen' | 'curveball' | 'reset' | 'educational' |
    'tone_shift' | 'philosophical' | 'nostalgic' | 'style' | 'meta' |
    'similar_but_different' | 'hidden_gem' | 'completion'
}


export interface MovieData {
    id: number;
    title: string;
    poster_url: string | null;
    media_type: 'movie' | 'tv';
    release_date?: string;
    rating?: number;
    overview?: string;
}

// Additional types for database operations
export type CollectionType = 'watchlist' | 'history';
export type InteractionType = 'like' | 'dislike' | 'watchlist' | 'watched';

// Type for the full movie object stored in user_movies table
export interface UserMovie extends MovieData {
    userId: string;
    collectionType: CollectionType;
    addedAt: Date;
}

// Type guard for MovieData
export function isMovieData(data: unknown): data is MovieData {
    // First, check if it's an object
    if (typeof data !== 'object' || data === null) {
        return false;
    }

    // Now TypeScript knows it's an object, so we can use 'in' operator
    if (!('id' in data) || !('title' in data) || !('media_type' in data)) {
        return false;
    }

    // Cast to a temporary type for property checks
    const obj = data as { id: unknown; title: unknown; media_type: unknown };

    return (
        typeof obj.id === 'number' &&
        typeof obj.title === 'string' &&
        (obj.media_type === 'movie' || obj.media_type === 'tv')
    );
}

// Type guard for MovieData array
export function isMovieDataArray(data: unknown): data is MovieData[] {
    return Array.isArray(data) && data.every(isMovieData);
}