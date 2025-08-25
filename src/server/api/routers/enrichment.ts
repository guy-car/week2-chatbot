import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';

export type EnrichOutput = {
  imdbId?: string,
  ratings?: { rottenTomatoes?: string; metacritic?: string; imdb?: string },
  watch?: { country: 'US'; link?: string; flatrate?: { id: number; name: string; logoPath: string }[] },
  duration?: number, // minutes
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
  },
  genres?: string[],
  director?: string,
};

type TMDBExternalIds = {
  imdb_id?: string | null;
  [key: string]: unknown;
};

type OmdbRating = {
  Source: string;
  Value: string;
};

type OmdbResponse = {
  Ratings?: OmdbRating[];
  Response?: string;
  [key: string]: unknown;
};

type TMDBProvidersUS = {
  link?: string | null;
  flatrate?: { provider_id: number; provider_name: string; logo_path: string | null }[];
};

type TMDBProvidersResponse = {
  results?: { US?: TMDBProvidersUS };
};

type TMDBMovieDetails = {
  runtime?: number | null;
  genres?: { id: number; name: string }[];
};

type TMDBTvDetails = {
  episode_run_time?: number[];
  genres?: { id: number; name: string }[];
};

type TMDBVideosResponse = {
  results?: { key: string; name: string; site: string; type: string; official?: boolean }[];
};

type TMDBMovieCredits = {
  crew?: { job?: string; name?: string }[];
};

type TMDBTvAggregateCredits = {
  crew?: { jobs?: { job?: string }[]; name?: string }[];
};

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout:${label}:${ms}ms`)), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err instanceof Error ? err : new Error(String(err))); }
    );
  });
}

async function fetchExternalIds(type: 'movie' | 'tv', id: number, capMs: number): Promise<{ imdbId?: string }> {
  const url = `https://api.themoviedb.org/3/${type}/${id}/external_ids`;
  const start = Date.now();
  try {
    const res = await withTimeout(fetch(url, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
      },
    }), capMs, `external_ids:${type}:${id}`);
    const raw = (await res.json()) as unknown as TMDBExternalIds;
    const duration = Date.now() - start;
    console.log('[ENRICH][external_ids] url=', url, 'status=', res.status, 'ms=', duration, 'raw=', raw);
    const imdbId = typeof raw?.imdb_id === 'string' && raw.imdb_id ? raw.imdb_id : undefined;
    console.log('[ENRICH][external_ids] extracted imdbId=', imdbId);
    return imdbId ? { imdbId } : {};
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    const duration = Date.now() - start;
    console.log('[ENRICH][external_ids] error:', err.message, 'ms=', duration, 'url=', url);
    return {};
  }
}

export function parseRatings(raw: OmdbResponse): { rottenTomatoes?: string; metacritic?: string; imdb?: string } | undefined {
  const ratings = raw.Ratings ?? [];
  if (!Array.isArray(ratings) || ratings.length === 0) return undefined;
  const out: { rottenTomatoes?: string; metacritic?: string; imdb?: string } = {};
  for (const r of ratings) {
    const src = r.Source?.toLowerCase();
    if (!src || !r.Value) continue;
    if (src.includes('internet movie database') || src === 'imdb') out.imdb = r.Value;
    else if (src.includes('rotten tomatoes')) out.rottenTomatoes = r.Value;
    else if (src.includes('metacritic')) out.metacritic = r.Value;
  }
  return Object.keys(out).length ? out : undefined;
}

async function fetchOmdbRatings(imdbId: string, capMs: number): Promise<{ rottenTomatoes?: string; metacritic?: string; imdb?: string } | undefined> {
  const apiKey = process.env.OMDB_API_KEY;
  const url = `https://www.omdbapi.com/?i=${encodeURIComponent(imdbId)}&apikey=${encodeURIComponent(apiKey ?? '')}`;
  const start = Date.now();
  try {
    const res = await withTimeout(fetch(url, { method: 'GET', headers: { accept: 'application/json' } }), capMs, `omdb:${imdbId}`);
    const raw = (await res.json()) as unknown as OmdbResponse;
    const duration = Date.now() - start;
    console.log('[ENRICH][omdb] url=', url, 'status=', res.status, 'ms=', duration, 'raw=', raw);
    const parsed = parseRatings(raw);
    console.log('[ENRICH][omdb] parsed=', parsed);
    return parsed;
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    const duration = Date.now() - start;
    console.log('[ENRICH][omdb] error:', err.message, 'ms=', duration, 'url=', url);
    return undefined;
  }
}

// Canonical whitelist in priority order
export const PROVIDER_WHITELIST = [
  'Netflix',
  'Amazon Prime Video',
  'Disney+',
  'Max',
  'Hulu',
  'Apple TV+',
  'Peacock',
  'Paramount+',
] as const;

export function normalizeProviderName(input: string): string | undefined {
  const name = input.trim();
  const lower = name.toLowerCase();
  if (lower.includes('netflix')) return 'Netflix';
  if (lower.includes('prime video') || lower.includes('amazon prime video')) return 'Amazon Prime Video';
  if (lower === 'disney+' || lower.includes('disney plus')) return 'Disney+';
  if (lower.includes('hbo max') || lower === 'max') return 'Max';
  if (lower === 'hulu') return 'Hulu';
  if (lower.includes('apple tv+')) return 'Apple TV+';
  if (lower.includes('peacock')) return 'Peacock';
  if (lower.includes('paramount+')) return 'Paramount+';
  return undefined;
}

export function filterProviders(us: TMDBProvidersUS | undefined) {
  if (!us) return undefined;
  const link = us.link ?? undefined;
  const flatrate = Array.isArray(us.flatrate) ? us.flatrate : [];
  const orderMap = new Map<string, number>(PROVIDER_WHITELIST.map((name, idx) => [name, idx]));

  const seen = new Set<string>();
  const normalized = [] as { id: number; name: string; logoPath: string }[];
  for (const p of flatrate) {
    if (!p.logo_path) continue;
    const canonical = normalizeProviderName(p.provider_name);
    if (!canonical) continue;
    if (!orderMap.has(canonical)) continue;
    if (seen.has(canonical)) continue;
    seen.add(canonical);
    normalized.push({ id: p.provider_id, name: canonical, logoPath: `/t/p/w92${p.logo_path}` });
  }

  normalized.sort((a, b) => (orderMap.get(a.name)! - orderMap.get(b.name)!));
  const capped = normalized.slice(0, 5);
  if (!capped.length && !link) return undefined;
  return { country: 'US' as const, link, flatrate: capped.length ? capped : undefined };
}

async function fetchWatchProviders(type: 'movie' | 'tv', id: number, capMs: number): Promise<EnrichOutput['watch'] | undefined> {
  const url = `https://api.themoviedb.org/3/${type}/${id}/watch/providers`;
  const start = Date.now();
  try {
    const res = await withTimeout(fetch(url, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
      },
    }), capMs, `providers:${type}:${id}`);
    const raw = (await res.json()) as unknown as TMDBProvidersResponse;
    const duration = Date.now() - start;
    console.log('[ENRICH][providers] url=', url, 'status=', res.status, 'ms=', duration, 'raw.US=', raw?.results?.US);
    const watch = filterProviders(raw?.results?.US);
    console.log('[ENRICH][providers] filtered=', watch);
    return watch;
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    const duration = Date.now() - start;
    console.log('[ENRICH][providers] error:', err.message, 'ms=', duration, 'url=', url);
    return undefined;
  }
}

async function fetchDetails(type: 'movie' | 'tv', id: number, capMs: number): Promise<{ duration?: number; genres?: string[] }> {
  const url = `https://api.themoviedb.org/3/${type}/${id}?language=en-US`;
  const start = Date.now();
  try {
    const res = await withTimeout(fetch(url, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
      },
    }), capMs, `details:${type}:${id}`);
    const raw = (await res.json()) as unknown;
    const duration = Date.now() - start;
    console.log('[ENRICH][details] url=', url, 'status=', res.status, 'ms=', duration);
    if (type === 'movie') {
      const md = raw as TMDBMovieDetails;
      const minutes = typeof md.runtime === 'number' && md.runtime > 0 ? md.runtime : undefined;
      const genres = Array.isArray(md.genres) ? md.genres.map(g => g.name).filter(Boolean).slice(0, 2) : undefined;
      return { duration: minutes, genres };
    } else {
      const td = raw as TMDBTvDetails;
      const minutes = Array.isArray(td.episode_run_time) && td.episode_run_time.length > 0 ? td.episode_run_time[0] : undefined;
      const genres = Array.isArray(td.genres) ? td.genres.map(g => g.name).filter(Boolean).slice(0, 2) : undefined;
      return { duration: minutes, genres };
    }
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    const duration = Date.now() - start;
    console.log('[ENRICH][details] error:', err.message, 'ms=', duration, 'url=', url);
    return {};
  }
}

export function pickBestTrailer(videos?: TMDBVideosResponse['results']): { 
  site: string; 
  key: string; 
  name: string; 
  url: string;
  thumbnails: {
    default: string;
    medium: string;
    high: string;
  };
  embedUrl: string;
} | undefined {
  if (!videos || videos.length === 0) return undefined;
  const youtubeTrailers = videos.filter(v => v.site === 'YouTube' && v.type === 'Trailer');
  const official = youtubeTrailers.find(v => v.official);
  const chosen = official ?? youtubeTrailers[0] ?? videos[0];
  if (!chosen) return undefined;
  
  if (chosen.site === 'YouTube' && chosen.key) {
    const key = chosen.key;
    return {
      site: chosen.site,
      key: key,
      name: chosen.name,
      url: `https://www.youtube.com/watch?v=${key}`,
      thumbnails: {
        default: `https://img.youtube.com/vi/${key}/default.jpg`,
        medium: `https://img.youtube.com/vi/${key}/mqdefault.jpg`,
        high: `https://img.youtube.com/vi/${key}/hqdefault.jpg`
      },
      embedUrl: `https://www.youtube.com/embed/${key}`
    };
  }
  
  return undefined;
}

async function fetchTrailer(type: 'movie' | 'tv', id: number, capMs: number): Promise<EnrichOutput['trailer'] | undefined> {
  const url = `https://api.themoviedb.org/3/${type}/${id}/videos?language=en-US`;
  const start = Date.now();
  try {
    const res = await withTimeout(fetch(url, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
      },
    }), capMs, `videos:${type}:${id}`);
    const raw = (await res.json()) as unknown as TMDBVideosResponse;
    const duration = Date.now() - start;
    console.log('[ENRICH][videos] url=', url, 'status=', res.status, 'ms=', duration, 'count=', raw?.results?.length ?? 0);
    return pickBestTrailer(raw.results ?? []);
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    const duration = Date.now() - start;
    console.log('[ENRICH][videos] error:', err.message, 'ms=', duration, 'url=', url);
    return undefined;
  }
}

async function fetchDirector(type: 'movie' | 'tv', id: number, capMs: number): Promise<string | undefined> {
  const creditsPath = type === 'movie' ? `${type}/${id}/credits` : `${type}/${id}/aggregate_credits`;
  const url = `https://api.themoviedb.org/3/${creditsPath}?language=en-US`;
  const start = Date.now();
  try {
    const res = await withTimeout(fetch(url, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
      },
    }), capMs, `credits:${type}:${id}`);
    const raw = (await res.json()) as unknown;
    const duration = Date.now() - start;
    console.log('[ENRICH][credits] url=', url, 'status=', res.status, 'ms=', duration);
    if (type === 'movie') {
      const cd = raw as TMDBMovieCredits;
      const director = cd.crew?.find(c => c.job === 'Director')?.name;
      return director ?? undefined;
    } else {
      const agg = raw as TMDBTvAggregateCredits;
      // Most frequent "Director" across jobs
      const names = (agg.crew ?? []).filter(c => Array.isArray(c.jobs) && c.jobs.some(j => j.job === 'Director')).map(c => c.name).filter(Boolean) as string[];
      if (names.length === 0) return undefined;
      const freq = new Map<string, number>();
      for (const n of names) freq.set(n, (freq.get(n) ?? 0) + 1);
      let best: string | undefined;
      let bestCount = -1;
      for (const [n, count] of freq) {
        if (count > bestCount) { best = n; bestCount = count; }
      }
      return best;
    }
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    const duration = Date.now() - start;
    console.log('[ENRICH][credits] error:', err.message, 'ms=', duration, 'url=', url);
    return undefined;
  }
}

export const enrichmentRouter = createTRPCRouter({
  enrich: publicProcedure
    .input(z.object({
      type: z.enum(['movie', 'tv']),
      id: z.number(),
      // optional longer caps for modal retries in future extension
      capsMs: z.object({ prefetch: z.number().optional(), modal: z.number().optional() }).optional(),
    }))
    .query(async ({ input }): Promise<EnrichOutput> => {
      const capMs = input.capsMs?.prefetch ?? 3000; // 3s default for background prefetch
      const { type, id } = input;

      const [external, watch, details, trailer, director] = await Promise.all([
        fetchExternalIds(type, id, capMs),
        fetchWatchProviders(type, id, capMs),
        fetchDetails(type, id, capMs),
        fetchTrailer(type, id, capMs),
        fetchDirector(type, id, capMs),
      ]);

      const output: EnrichOutput = {};
      if (external.imdbId) {
        output.imdbId = external.imdbId;
        const ratings = await fetchOmdbRatings(external.imdbId, capMs);
        if (ratings) output.ratings = ratings;
      }
      if (watch) output.watch = watch;
      if (typeof details.duration === 'number') output.duration = details.duration;
      if (Array.isArray(details.genres) && details.genres.length) output.genres = details.genres;
      if (trailer) output.trailer = trailer;
      if (director) output.director = director;

      return output;
    }),
});
