export type RatingsOut = { rottenTomatoes?: string; metacritic?: string; imdb?: string }

export type TMDBProvidersUS = {
  link?: string | null;
  flatrate?: { provider_id: number; provider_name: string; logo_path: string | null }[];
}

export type TMDBVideosResult = { key: string; name: string; site: string; type: string; official?: boolean }

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

export function parseRatings(raw: { Ratings?: { Source?: string; Value?: string }[] }): RatingsOut | undefined {
  const ratings = raw.Ratings ?? [];
  if (!Array.isArray(ratings) || ratings.length === 0) return undefined;
  const out: RatingsOut = {};
  for (const r of ratings) {
    const src = r.Source?.toLowerCase();
    if (!src || !r.Value) continue;
    if (src.includes('internet movie database') || src === 'imdb') out.imdb = r.Value;
    else if (src.includes('rotten tomatoes')) out.rottenTomatoes = r.Value;
    else if (src.includes('metacritic')) out.metacritic = r.Value;
  }
  return Object.keys(out).length ? out : undefined;
}

export function pickBestTrailer(videos?: TMDBVideosResult[]): { site: string; key: string; name: string; url: string } | undefined {
  if (!videos || videos.length === 0) return undefined;
  const youtubeTrailers = videos.filter(v => v.site === 'YouTube' && v.type === 'Trailer');
  const official = youtubeTrailers.find(v => v.official);
  const chosen = official ?? youtubeTrailers[0] ?? videos[0];
  if (!chosen) return undefined;
  const url = chosen.site === 'YouTube' && chosen.key ? `https://www.youtube.com/watch?v=${chosen.key}` : undefined;
  if (!url) return undefined;
  return { site: chosen.site, key: chosen.key, name: chosen.name, url };
}
