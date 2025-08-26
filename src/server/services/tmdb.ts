import type { MovieData } from "~/app/types";

type TMDBSearchResult = {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  overview?: string;
  media_type?: 'movie' | 'tv' | 'person';
  popularity?: number;
};

type TMDBSearchResponse = {
  results?: TMDBSearchResult[];
};

export async function lookupBestByTitleYear(title: string, year?: number): Promise<MovieData | undefined> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey || !title) return undefined;

  const headers = {
    'accept': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  } as const;

  const q = (o: Record<string, string | number | undefined>) =>
    Object.entries(o)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join('&');

  // Try movie and TV in parallel
  const movieParams: Record<string, string | number | undefined> = { query: title, include_adult: 'false', language: 'en-US', page: 1 };
  if (year) movieParams.year = year;
  const tvParams: Record<string, string | number | undefined> = { query: title, include_adult: 'false', language: 'en-US', page: 1 };
  if (year) tvParams.first_air_date_year = year;

  const [movieRes, tvRes] = await Promise.all([
    fetch(`https://api.themoviedb.org/3/search/movie?${q(movieParams)}`, { headers }),
    fetch(`https://api.themoviedb.org/3/search/tv?${q(tvParams)}`, { headers }),
  ]);
  const movieJson: unknown = await movieRes.json().catch(() => ({}));
  const tvJson: unknown = await tvRes.json().catch(() => ({}));
  const movieData: TMDBSearchResponse = (movieJson && typeof movieJson === 'object') ? movieJson as TMDBSearchResponse : {};
  const tvData: TMDBSearchResponse = (tvJson && typeof tvJson === 'object') ? tvJson as TMDBSearchResponse : {};
  let allResults: TMDBSearchResult[] = [
    ...(movieData.results?.map(r => ({ ...r, media_type: 'movie' as const })) ?? []),
    ...(tvData.results?.map(r => ({ ...r, media_type: 'tv' as const })) ?? []),
  ];

  // Fallback to multi if both empty
  if (allResults.length === 0) {
    const multiParams: Record<string, string | number | undefined> = { query: title, include_adult: 'false', language: 'en-US', page: 1 };
    const multiRes = await fetch(`https://api.themoviedb.org/3/search/multi?${q(multiParams)}`, { headers });
    const multiJson: unknown = await multiRes.json().catch(() => ({}));
    const multiData: TMDBSearchResponse = (multiJson && typeof multiJson === 'object') ? multiJson as TMDBSearchResponse : {};
    allResults = (multiData.results ?? []).filter((r: TMDBSearchResult): r is TMDBSearchResult => r.media_type === 'movie' || r.media_type === 'tv');
  }

  if (!allResults.length) return undefined;

  // Scoring (mirrors existing tool logic): exact/partial title, year proximity, popularity bonus, prefer movies
  const cleanTitle = title.trim().toLowerCase();
  const scored = allResults.map(item => {
    let score = 0;
    const itemTitle = (item.title ?? item.name ?? '').toLowerCase();
    const itemYear = parseInt((item.release_date ?? item.first_air_date ?? '0').slice(0, 4));
    if (itemTitle === cleanTitle) score += 50; else if (itemTitle.includes(cleanTitle)) score += 20;
    if (year && itemYear) {
      if (itemYear === year) score += 60; else score -= Math.abs(itemYear - year) * 2;
    }
    const popBonus = Math.min((item.popularity ?? 0) / 100, 10);
    score += popBonus;
    if (item.media_type === 'movie') score += 5;
    return { item, score };
  }).sort((a, b) => b.score - a.score);

  const best = scored[0]?.item;
  if (!best) return undefined;

  const releaseDate = best.release_date ?? best.first_air_date;
  const computedYear = releaseDate ? parseInt(releaseDate.slice(0, 4)) : undefined;
  
  return {
    id: best.id,
    title: best.title ?? best.name ?? '',
    poster_url: best.poster_path ? `https://image.tmdb.org/t/p/w500${best.poster_path}` : null,
    release_date: releaseDate,
    year: computedYear,
    rating: Number(best.vote_average ?? 0),
    overview: best.overview ?? '',
    media_type: (best.media_type === 'tv') ? 'tv' : 'movie',
  };
}


