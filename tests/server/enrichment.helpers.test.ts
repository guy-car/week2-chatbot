import { describe, it, expect } from '@jest/globals'
import { normalizeProviderName, PROVIDER_WHITELIST, filterProviders, parseRatings, pickBestTrailer } from '~/server/api/enrichment-helpers'
// @ts-nocheck
/* eslint-disable */

describe('normalizeProviderName', () => {
  it('maps HBO Max variants to Max', () => {
    expect(normalizeProviderName('HBO Max')).toBe('Max')
    expect(normalizeProviderName('HBO Max Amazon Channel')).toBe('Max')
    expect(normalizeProviderName('Max')).toBe('Max')
  })
  it('maps Prime Video to Amazon Prime Video', () => {
    expect(normalizeProviderName('Prime Video')).toBe('Amazon Prime Video')
    expect(normalizeProviderName('Amazon Prime Video')).toBe('Amazon Prime Video')
  })
  it('maps Netflix variants', () => {
    expect(normalizeProviderName('Netflix')).toBe('Netflix')
    expect(normalizeProviderName('Netflix Standard with Ads')).toBe('Netflix')
  })
  it('returns undefined for non-whitelisted', () => {
    expect(normalizeProviderName('Some Niche Provider')).toBeUndefined()
  })
})

describe('filterProviders', () => {
  it('filters to whitelist, orders, caps, dedupes, and builds logoPath', () => {
    const us = {
      link: 'https://example.com',
      flatrate: [
        { provider_id: 1899, provider_name: 'HBO Max', logo_path: '/x.jpg' },
        { provider_id: 1825, provider_name: 'HBO Max Amazon Channel', logo_path: '/y.jpg' },
        { provider_id: 8, provider_name: 'Netflix', logo_path: '/n.jpg' },
        { provider_id: 9, provider_name: 'Amazon Prime Video', logo_path: '/p.jpg' },
        { provider_id: 390, provider_name: 'Some Other', logo_path: '/o.jpg' },
      ]
    }
    const out = filterProviders(us as any)
    expect(out?.country).toBe('US')
    expect(out?.link).toBe('https://example.com')
    expect(out?.flatrate?.map(p => p.name)).toEqual([
      'Netflix', 'Amazon Prime Video', 'Max'
    ])
    expect(out?.flatrate?.map(p => p.logoPath).every(p => p.startsWith('/t/p/w92/'))).toBe(true)
  })
  it('returns undefined when no whitelist match and no link', () => {
    const out = filterProviders({ flatrate: [{ provider_id: 1, provider_name: 'Other', logo_path: '/z.jpg' }] } as any)
    expect(out).toBeUndefined()
  })
})

describe('parseRatings', () => {
  it('parses imdb, RT, metacritic', () => {
    const raw = { Ratings: [
      { Source: 'Internet Movie Database', Value: '8.8/10' },
      { Source: 'Rotten Tomatoes', Value: '91%' },
      { Source: 'Metacritic', Value: '74/100' },
    ]}
    expect(parseRatings(raw as any)).toEqual({ imdb: '8.8/10', rottenTomatoes: '91%', metacritic: '74/100' })
  })
  it('handles missing sources', () => {
    const raw = { Ratings: [ { Source: 'Internet Movie Database', Value: '8.8/10' } ] }
    expect(parseRatings(raw as any)).toEqual({ imdb: '8.8/10' })
  })
  it('returns undefined for empty', () => {
    expect(parseRatings({ Ratings: [] } as any)).toBeUndefined()
  })
})

describe('pickBestTrailer', () => {
  it('prefers official YouTube Trailer', () => {
    const vids = [
      { site: 'YouTube', type: 'Trailer', key: 'abc', name: 'T1', official: true },
      { site: 'YouTube', type: 'Trailer', key: 'def', name: 'T2', official: false },
    ]
    const t = pickBestTrailer(vids as any)
    expect(t?.url).toBe('https://www.youtube.com/watch?v=abc')
  })
  it('falls back to first YouTube Trailer', () => {
    const vids = [
      { site: 'YouTube', type: 'Trailer', key: 'def', name: 'T2', official: false },
      { site: 'YouTube', type: 'Clip', key: 'ghi', name: 'C1', official: false },
    ]
    const t = pickBestTrailer(vids as any)
    expect(t?.url).toBe('https://www.youtube.com/watch?v=def')
  })
  it('returns undefined when none', () => {
    const t = pickBestTrailer([])
    expect(t).toBeUndefined()
  })
})
