'use client'

import { useState } from 'react'
import { api } from '~/trpc/react'
import type { MovieData } from '~/app/types'

export default function TestEnrichmentPage() {
  const [movieId, setMovieId] = useState('550') // Fight Club
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie')
  const [capsMs, setCapsMs] = useState(5000)

  // Fetch real MovieData from TMDB
  const { data: realMovieData, isLoading: isLoadingMovie, refetch: refetchMovie } = api.movies.getMovieData.useQuery(
    {
      type: mediaType,
      id: parseInt(movieId),
    },
    {
      enabled: false, // Don't auto-fetch
      retry: false
    }
  );

  const { data: enrichmentData, isLoading: isLoadingEnrichment, error, refetch } = api.enrichment.enrich.useQuery(
    {
      type: mediaType,
      id: parseInt(movieId),
      capsMs: { prefetch: capsMs }
    },
    {
      enabled: false, // Don't auto-fetch
      retry: false
    }
  )

  // Combine real MovieData with enrichment results
  const completeMovieData: MovieData = {
    id: realMovieData?.id ?? parseInt(movieId),
    title: realMovieData?.title ?? 'Loading...',
    poster_url: realMovieData?.poster_url ?? null,
    media_type: realMovieData?.media_type ?? mediaType,
    release_date: realMovieData?.release_date ?? undefined,
    year: realMovieData?.year ?? undefined,
    rating: realMovieData?.rating ?? undefined,
    overview: realMovieData?.overview ?? undefined,
    ...enrichmentData,
    reason: 'This movie is perfect for you because...', // Mock reason for now
  };

  const isLoading = isLoadingMovie || isLoadingEnrichment;

  const handleTest = async () => {
    // Fetch both MovieData and enrichment data
    await Promise.all([
      refetchMovie(),
      refetch()
    ]);
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Enrichment Query</h1>
      
      <div className="space-y-4 mb-6">
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Media Type</label>
            <select 
              value={mediaType} 
              onChange={(e) => setMediaType(e.target.value as 'movie' | 'tv')}
              className="border rounded px-3 py-2"
            >
              <option value="movie">Movie</option>
              <option value="tv">TV Show</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Movie ID</label>
            <input
              type="text"
              value={movieId}
              onChange={(e) => setMovieId(e.target.value)}
              placeholder="550 (Fight Club), 13 (Forrest Gump)"
              className="border rounded px-3 py-2 w-64"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Timeout (ms)</label>
            <input
              type="number"
              value={capsMs}
              onChange={(e) => setCapsMs(parseInt(e.target.value))}
              className="border rounded px-3 py-2 w-24"
            />
          </div>
        </div>
        
        <button
          onClick={handleTest}
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Test Enrichment'}
        </button>
      </div>

      {/* Sample Movie IDs */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Sample Movie IDs to Test:</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Movies:</strong>
            <ul className="list-disc list-inside ml-4">
              <li>550 - Fight Club</li>
              <li>13 - Forrest Gump</li>
              <li>238 - The Godfather</li>
              <li>680 - Pulp Fiction</li>
              <li>155 - The Dark Knight</li>
            </ul>
          </div>
          <div>
            <strong>TV Shows:</strong>
            <ul className="list-disc list-inside ml-4">
              <li>1399 - Game of Thrones</li>
              <li>1396 - Breaking Bad</li>
              <li>1398 - Sons of Anarchy</li>
              <li>1394 - Boardwalk Empire</li>
              <li>1392 - The Walking Dead</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Results */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          <h3 className="text-red-800 font-semibold">Error:</h3>
          <pre className="text-red-700 text-sm mt-2">{error.message}</pre>
        </div>
      )}

      {/* Complete MovieData Structure */}
      <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
        <h3 className="text-blue-800 font-semibold mb-3">Complete MovieData Structure (Modal Ready):</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-blue-700 mb-2">Core Fields (Always Present):</h4>
            <ul className="space-y-1 text-blue-600">
              <li>• ID: {completeMovieData.id}</li>
              <li>• Title: {completeMovieData.title}</li>
              <li>• Media Type: {completeMovieData.media_type}</li>
              <li>• Release Date: {completeMovieData.release_date}</li>
              <li>• Year: {completeMovieData.year}</li>
              <li>• Rating: {completeMovieData.rating}</li>
              <li>• Overview: {completeMovieData.overview?.slice(0, 50)}...</li>
              <li>• Poster: {completeMovieData.poster_url ? '✅ Available' : '❌ Missing'}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-700 mb-2">Progressive Enhancement Fields:</h4>
            <ul className="space-y-1 text-blue-600">
              <li>• Reason: {completeMovieData.reason ? '✅ Available' : '❌ Missing'}</li>
              <li>• IMDb ID: {completeMovieData.imdbId ? '✅ Available' : '❌ Missing'}</li>
              <li>• Ratings: {completeMovieData.ratings ? '✅ Available' : '❌ Missing'}</li>
              <li>• Watch Providers: {completeMovieData.watch?.flatrate ? '✅ Available' : '❌ Missing'}</li>
              <li>• Duration: {completeMovieData.duration ? '✅ Available' : '❌ Missing'}</li>
              <li>• Genres: {completeMovieData.genres ? '✅ Available' : '❌ Missing'}</li>
              <li>• Director: {completeMovieData.director ? '✅ Available' : '❌ Missing'}</li>
              <li>• Trailer: {completeMovieData.trailer ? '✅ Available' : '❌ Missing'}</li>
              {completeMovieData.trailer && (
                <li className="ml-4 text-xs">
                  • Thumbnails: {completeMovieData.trailer.thumbnails ? '✅ Available' : '❌ Missing'}
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Raw Enrichment Data */}
      {enrichmentData && (
        <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
          <h3 className="text-green-800 font-semibold mb-3">Raw Enrichment API Response:</h3>
          <pre className="text-green-700 text-sm overflow-auto max-h-96">
            {JSON.stringify(enrichmentData, null, 2)}
          </pre>
        </div>
      )}

      {/* Trailer Thumbnail Preview */}
      {completeMovieData.trailer?.thumbnails && (
        <div className="bg-orange-50 border border-orange-200 rounded p-4 mb-4">
          <h3 className="text-orange-800 font-semibold mb-3">Trailer Thumbnail Preview:</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-orange-700 font-medium mb-2">Medium Thumbnail (320x180):</h4>
              <img 
                src={completeMovieData.trailer.thumbnails.medium} 
                alt="Trailer thumbnail"
                className="border rounded shadow-sm"
              />
            </div>
            <div className="text-sm text-orange-600">
              <p><strong>Video Key:</strong> {completeMovieData.trailer.key}</p>
              <p><strong>Embed URL:</strong> {completeMovieData.trailer.embedUrl}</p>
              <p><strong>Watch URL:</strong> {completeMovieData.trailer.url}</p>
            </div>
          </div>
        </div>
      )}

      {/* Complete Combined Data */}
      {enrichmentData && (
        <div className="bg-purple-50 border border-purple-200 rounded p-4">
          <h3 className="text-purple-800 font-semibold mb-3">Complete Combined MovieData (JSON):</h3>
          <pre className="text-purple-700 text-sm overflow-auto max-h-96">
            {JSON.stringify(completeMovieData, null, 2)}
          </pre>
        </div>
      )}

      {/* Notes */}
      <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mt-4">
        <h3 className="text-yellow-800 font-semibold mb-2">Notes:</h3>
        <ul className="text-yellow-700 text-sm space-y-1">
          <li>• <strong>Core Fields:</strong> Always available from MovieData (poster, title, overview, etc.)</li>
          <li>• <strong>Reason Field:</strong> Comes from AI planner, not from enrichment API</li>
          <li>• <strong>Enriched Fields:</strong> Added progressively as enrichment.enrich completes</li>
          <li>• <strong>Modal Ready:</strong> This structure contains everything needed for rich movie modals</li>
        </ul>
      </div>
    </div>
  )
}
