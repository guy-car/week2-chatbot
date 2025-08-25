import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'

const { lookupBestByTitleYear } = await import('~/server/services/tmdb')

const originalFetch = global.fetch

beforeEach(() => {
  // @ts-expect-error set dummy key for service
  process.env.TMDB_API_KEY = process.env.TMDB_API_KEY ?? 'test-tmdb'
})

afterEach(() => {
  global.fetch = originalFetch as any
})

function makeRes(json: unknown) {
  return {
    ok: true,
    json: async () => json,
  } as any
}

describe('tmdb lookupBestByTitleYear', () => {
  it('prefers exact title match and correct year', async () => {
    let call = 0
    global.fetch = (async (url: string) => {
      call += 1
      if (url.includes('/search/movie')) {
        return makeRes({ results: [
          { id: 1, title: 'Inception', release_date: '2010-07-16', vote_average: 8.8, overview: 'x', media_type: 'movie', popularity: 100 },
          { id: 2, title: 'Inception 2', release_date: '2015-01-01', vote_average: 7.0, overview: 'y', media_type: 'movie', popularity: 200 },
        ] })
      }
      if (url.includes('/search/tv')) {
        return makeRes({ results: [
          { id: 3, name: 'Inception TV', first_air_date: '2010-01-01', vote_average: 6.5, overview: 'z', media_type: 'tv', popularity: 50 },
        ] })
      }
      return makeRes({ results: [] })
    }) as any

    const best = await lookupBestByTitleYear('Inception', 2010)
    expect(best?.id).toBe(1)
    expect(best?.media_type).toBe('movie')
    expect(call).toBe(2)
  })

  it('falls back to multi search when both empty', async () => {
    let call = 0
    global.fetch = (async (url: string) => {
      call += 1
      if (url.includes('/search/movie') || url.includes('/search/tv')) {
        return makeRes({ results: [] })
      }
      if (url.includes('/search/multi')) {
        return makeRes({ results: [ { id: 9, title: 'Dune', release_date: '2021-10-01', vote_average: 8.2, overview: 'd', media_type: 'movie', popularity: 80 } ] })
      }
      return makeRes({ results: [] })
    }) as any

    const best = await lookupBestByTitleYear('Dune', 2021)
    expect(best?.title.toLowerCase()).toContain('dune')
    expect(best?.media_type).toBe('movie')
    expect(call).toBe(3)
  })
})


