#!/usr/bin/env node

// Network smoke test for enrichment.enrich
// Usage: node scripts/smoke-enrichment.mjs [--host localhost] [--port 3000]

const args = process.argv.slice(2);
const hostArgIdx = args.indexOf('--host');
const portArgIdx = args.indexOf('--port');
const host = hostArgIdx >= 0 ? args[hostArgIdx + 1] : process.env.HOST || 'localhost';
const port = portArgIdx >= 0 ? args[portArgIdx + 1] : process.env.PORT || '3000';

const baseUrl = `http://${host}:${port}`;

/** @typedef {{ type: 'movie'|'tv', id: number, label?: string }} Case */

/** @type {Case[]} */
const CASES = [
  // Movies (15)
  { type: 'movie', id: 155, label: 'The Dark Knight (2008)' },
  { type: 'movie', id: 27205, label: 'Inception (2010)' },
  { type: 'movie', id: 603, label: 'The Matrix (1999)' },
  { type: 'movie', id: 680, label: 'Pulp Fiction (1994)' },
  { type: 'movie', id: 238, label: 'The Godfather (1972)' },
  { type: 'movie', id: 240, label: 'The Godfather Part II (1974)' },
  { type: 'movie', id: 550, label: 'Fight Club (1999)' },
  { type: 'movie', id: 13, label: 'Forrest Gump (1994)' },
  { type: 'movie', id: 424, label: 'Schindler\'s List (1993)' },
  { type: 'movie', id: 497, label: 'The Green Mile (1999)' },
  { type: 'movie', id: 496243, label: 'Parasite (2019)' },
  { type: 'movie', id: 272, label: 'Batman Begins (2005)' },
  { type: 'movie', id: 787, label: 'Se7en (1995)' },
  { type: 'movie', id: 78, label: 'Blade Runner (1982)' },
  { type: 'movie', id: 1891, label: 'The Empire Strikes Back (1980)' },
  // TV (15)
  { type: 'tv', id: 1396, label: 'Breaking Bad' },
  { type: 'tv', id: 1412, label: 'Arrow' },
  { type: 'tv', id: 1399, label: 'Game of Thrones' },
  { type: 'tv', id: 66732, label: 'Stranger Things' },
  { type: 'tv', id: 60735, label: 'The Flash' },
  { type: 'tv', id: 46261, label: 'Narcos' },
  { type: 'tv', id: 62688, label: 'Supergirl' },
  { type: 'tv', id: 1668, label: 'Friends' },
  { type: 'tv', id: 2316, label: 'The Office (US)' },
  { type: 'tv', id: 456, label: 'The Simpsons' },
  { type: 'tv', id: 82856, label: 'The Mandalorian' },
  { type: 'tv', id: 1402, label: 'The Walking Dead' },
  { type: 'tv', id: 1434, label: 'Family Guy' },
  { type: 'tv', id: 4629, label: 'Lost' },
  { type: 'tv', id: 1667, label: 'Seinfeld' },
];

const PROVIDER_WHITELIST = new Set([
  'Netflix',
  'Amazon Prime Video',
  'Disney+',
  'Max',
  'Hulu',
  'Apple TV+',
  'Peacock',
  'Paramount+',
]);

function urlFor(input) {
  const q = encodeURIComponent(JSON.stringify({ json: input }));
  return `${baseUrl}/api/trpc/enrichment.enrich?input=${q}`;
}

function ok(cond, msg) {
  if (cond) console.log(`- OK: ${msg}`);
  else console.log(`- FAIL: ${msg}`);
}

async function runCase(c) {
  console.log(`\n=== ${c.type.toUpperCase()} ${c.id}${c.label ? ' — ' + c.label : ''} ===`);
  const res = await fetch(urlFor({ type: c.type, id: c.id }));
  const json = await res.json();
  const data = json?.result?.data?.json ?? {};

  ok(typeof data === 'object', 'response shape present');
  ok(!data.error, 'no error field');

  ok(typeof data.imdbId === 'string', 'imdbId present');
  if (data.ratings) ok(!!data.ratings.imdb, 'ratings.imdb present when ratings object exists');

  if (data.watch?.flatrate) {
    const names = data.watch.flatrate.map(p => p.name);
    ok(names.every(n => PROVIDER_WHITELIST.has(n)), 'providers within whitelist');
    ok(data.watch.flatrate.length <= 5, 'providers capped at 5');
  } else {
    console.log('- INFO: no flatrate providers present (acceptable)');
  }

  if (c.type === 'movie') ok(typeof data.duration === 'number', 'duration (movie) is a number');
  else console.log('- INFO: duration (tv) may be missing');

  if (Array.isArray(data.genres)) ok(data.genres.length <= 2, 'genres length <= 2');
  if (data.trailer) ok(typeof data.trailer.url === 'string' && data.trailer.url.includes('youtube.com/watch'), 'trailer is YouTube url');

  if (c.type === 'movie') ok(typeof data.director === 'string', 'director (movie) present');
  else console.log('- INFO: director (tv) may be missing');
}

async function main() {
  console.log(`Running enrichment smoke on ${baseUrl}`);
  for (const c of CASES) {
    try { await runCase(c); } catch (e) { console.log(`- FAIL: exception ${String(e)}`); }
  }
  console.log('\nDone.');
}

main().catch(err => { console.error(err); process.exit(1); });
