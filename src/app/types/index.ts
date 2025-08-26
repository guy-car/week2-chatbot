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
    year?: number;      // Computed from release_date for easy access
    rating?: number;
    overview?: string;
    
    // Progressive enhancement fields (added as available)
    reason?: string;  // "Why it's right for you" from AI planner
    
    // Enriched fields from enrichment.enrich query
    imdbId?: string;
    ratings?: { rottenTomatoes?: string; metacritic?: string; imdb?: string };
    watch?: { country: 'US'; link?: string; flatrate?: { id: number; name: string; logoPath: string }[] };
    duration?: number;  // Runtime in minutes
    trailer?: { 
      site: string; 
      key: string; 
      name: string; 
      url: string;
      thumbnails: {
        default: string;    // 120x90
        medium: string;     // 320x180
        high: string;       // 480x360
      };
      embedUrl: string;     // YouTube embed URL
    };
    genres?: string[];  // First 1-2 genres
    director?: string;
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

// Type guards for progressive enhancement fields
export function hasEnrichment(movie: MovieData): movie is MovieData & Required<Pick<MovieData, 'imdbId' | 'ratings' | 'watch' | 'duration' | 'genres' | 'director' | 'trailer'>> {
    return !!(movie.imdbId && movie.ratings && movie.watch && movie.duration && movie.genres && movie.director && movie.trailer);
}

export function hasReason(movie: MovieData): movie is MovieData & Required<Pick<MovieData, 'reason'>> {
    return !!movie.reason;
}

export function hasRatings(movie: MovieData): movie is MovieData & Required<Pick<MovieData, 'ratings'>> {
    return !!movie.ratings;
}

export function hasWatchProviders(movie: MovieData): movie is MovieData & Required<Pick<MovieData, 'watch'>> {
    return !!movie.watch && !!movie.watch.flatrate;
}

// Tool schemas (Zod) — server validates Responses output against these
import { z } from 'zod';

export const DecideModeSchema = z.object({
    mode: z.enum(['A', 'B']),
    reason: z.string().max(160)
});

export const PlanPicksInputSchema = z.object({
    blocked: z.array(z.object({
        id_tmdb: z.number(),
        media_type: z.enum(['movie','tv']),
        title: z.string(),
        year: z.number(),
    })),
    tasteProfileSummary: z.string().max(600)
});

export const PlanPicksOutputSchema = z.object({
    intro: z.string(),
    picks: z.array(z.object({
        title: z.string(),
        year: z.number(),
        reason: z.string(),
    })).min(1).max(3)
});
