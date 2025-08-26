'use client'

import { useCallback, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { api } from '~/trpc/react'
import { modalVariants } from '~/styles/component-styles'
import type { MovieData } from '~/app/types'
import { useMovieCollections } from '~/app/_services/useMovieCollections'
import { useTasteProfile } from '~/app/_services/tasteProfile'

type MediaType = 'movie' | 'tv'

export function RichMovieModal({
  isOpen,
  onClose,
  movieId,
  mediaType,
  adjacent,
}: {
  isOpen: boolean
  onClose: () => void
  movieId: number | null
  mediaType: MediaType | null
  adjacent?: {
    items: Array<{ id: number; media_type: MediaType }>
    currentIndex: number
    onIndexChange: (nextIndex: number) => void
  }
}) {
  const enabled = isOpen && !!movieId && !!mediaType

  const { data: base, isLoading: isLoadingBase } = api.movies.getMovieData.useQuery(
    { type: mediaType!, id: movieId! },
    { enabled, staleTime: 1000 * 60 * 10 }
  )

  const { data: enrich, isLoading: isLoadingEnrich } = api.enrichment.enrich.useQuery(
    { type: mediaType!, id: movieId!, capsMs: { modal: 5000 } },
    { enabled, staleTime: 1000 * 60 * 10 }
  )

  const movie: MovieData | undefined = useMemo(() => {
    return base ? { ...base, ...enrich } : undefined
  }, [base, enrich])

  // Title helpers (from /test-modal)
  const getTitleStyles = useCallback((title: string) => {
    const length = title.length
    if (length <= 20) return 'text-[28px]'
    if (length <= 40) return 'text-[24px]'
    return 'text-[20px]'
  }, [])

  const truncateTitle = useCallback((title: string, maxLength = 35) => {
    if (title.length <= maxLength) return title
    const words = title.split(' ')
    let result = ''
    for (const word of words) {
      if ((result + ' ' + word).length <= maxLength) {
        result += (result ? ' ' : '') + word
      } else {
        break
      }
    }
    return result + '...'
  }, [])

  // Arrow handlers must be declared before effect uses them
  const canShowArrows = ((adjacent?.items?.length ?? 0) > 1)
  const goPrev = useCallback(() => {
    if (!adjacent) return
    const next = (adjacent.currentIndex - 1 + adjacent.items.length) % adjacent.items.length
    adjacent.onIndexChange(next)
  }, [adjacent])
  const goNext = useCallback(() => {
    if (!adjacent) return
    const next = (adjacent.currentIndex + 1) % adjacent.items.length
    adjacent.onIndexChange(next)
  }, [adjacent])

  // Keyboard controls: ESC to close, arrows to navigate
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose, goPrev, goNext])

  const { addToWatchlist, markAsWatched } = useMovieCollections()
  const { addLikedMovie, addDislikedMovie } = useTasteProfile()

  const handleProviderClick = useCallback((name: string) => {
    const host = name.toLowerCase().replace('+', 'plus')
    window.open(`https://www.${host}.com`, '_blank')
  }, [])

  

  if (!isOpen) return null

  const isLoading = isLoadingBase || isLoadingEnrich

  const arrowButtonSize = 'w-20 h-20';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className={modalVariants.backdrop} onClick={onClose} />

      <div className="relative">
        <div className={modalVariants.containerGradient}>
          <div className="relative max-w-[1166px] w-[96vw] overflow-hidden pt-14 pl-14 pb-14 pr-0">
            <div className="grid grid-cols-[240px_1fr_100px] gap-8 items-start">
              {/* Left column */}
              <div className="flex flex-col items-center pr-10">
                {/* Title and Ratings */}
                <div className="flex flex-col justify-center mb-6 w-full">
                  <div
                    className={`${getTitleStyles(movie?.title ?? '')} font-normal text-center text-[#FAFAFA] font-inter leading-tight`}
                    title={movie?.title ?? ''}
                  >
                    {movie?.title ? truncateTitle(movie.title) : '\u00A0'}
                  </div>
                </div>

                {/* Ratings below title */}
                <div className="flex justify-center gap-6 text-sm mb-6">
                  {movie?.ratings?.imdb && (
                    <div className="flex items-center gap-2">
                      <img src="/streaming_providers/IMDB.svg" alt="IMDB" className="w-6 h-6 object-contain" />
                      <span className="text-[#E5E5E5] font-semibold">{movie.ratings.imdb}</span>
                    </div>
                  )}
                  {movie?.ratings?.rottenTomatoes && (
                    <div className="flex items-center gap-2">
                      <img src="/streaming_providers/rottentomatoes.png" alt="Rotten Tomatoes" className="w-6 h-6 object-contain" />
                      <span className="text-[#E5E5E5] font-semibold">{movie.ratings.rottenTomatoes}</span>
                    </div>
                  )}
                </div>

                {/* Poster */}
                <div className={modalVariants.poster}>
                  {movie?.poster_url && (
                    <Image
                      src={movie.poster_url}
                      width={188}
                      height={282}
                      alt={`Poster for ${movie.title}`}
                      className="h-full w-full object-cover"
                      priority
                    />
                  )}
                </div>

                {/* Where to watch */}
                <div className="mt-6 text-[#FAFAFA] w-[188px] flex flex-col items-center">
                  <div className="text-xl font-bold text-center mb-3">Where to watch</div>
                  <div className={modalVariants.providerCard}>
                    {movie?.watch?.flatrate ? (
                      <div className="grid grid-cols-2 gap-4">
                        {movie.watch.flatrate.map((provider, index) => (
                          <div key={index} className="flex flex-col items-center gap-2">
                            <img
                              src={`https://image.tmdb.org${provider.logoPath}`}
                              alt={provider.name}
                              className="w-10 h-10 object-contain cursor-pointer hover:opacity-80 transition-opacity rounded-[11px]"
                              onClick={() => handleProviderClick(provider.name)}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center">
                        <span className="text-[#FAFAFA] opacity-80">No streaming data</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Center column */}
              <div className="text-[#FAFAFA] pr-10 flex flex-col">
                {/* Trailer */}
                <div className={modalVariants.trailerFrame}>
                  <div
                    className="aspect-video w-full relative bg-gradient-to-br from-black/80 to-gray-900/80 flex items-center justify-center group cursor-pointer overflow-hidden"
                    onClick={() => movie?.trailer?.url && window.open(movie.trailer.url, '_blank')}
                  >
                    {movie?.trailer?.key && (
                      <img
                        src={`https://img.youtube.com/vi/${movie.trailer.key}/mqdefault.jpg`}
                        alt="Trailer thumbnail"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </div>

                {/* Meta line */}
                <div className="mt-3">
                  <div className={modalVariants.metaLine}>
                    {[
                      movie?.genres?.join(', '),
                      movie?.duration ? `${movie.duration}min` : undefined,
                      movie?.director ? `Dir. ${movie.director}` : undefined,
                      movie?.year,
                    ].filter(Boolean).join(' | ')}
                  </div>
                </div>

                {/* Content sections */}
                <div className="mt-8 flex-1 overflow-y-auto max-h-[400px]">
                  <div className="space-y-6 pr-2">
                    {movie?.reason && (
                      <section>
                        <h3 className="text-xl font-bold mb-2">Why it&apos;s right for you</h3>
                        <p className="text-[#E5E5E5]">{movie.reason}</p>
                      </section>
                    )}
                    {movie?.overview && (
                      <section>
                        <h3 className="text-xl font-bold mb-2">Synopsis</h3>
                        <p className="text-[#E5E5E5]">{movie.overview}</p>
                      </section>
                    )}
                  </div>
                </div>
              </div>

              {/* Right column: Action Rail */}
              <aside className={modalVariants.actionRail}>
                <div className={modalVariants.actionRailSection}>
                  <div className="w-20 h-20 flex items-center justify-center">
                    <img
                      src="/icons/posters/star.png"
                      alt="Watchlist"
                      className="w-full h-full object-contain transition-all duration-200 hover:scale-110 cursor-pointer"
                      onClick={() => movie && addToWatchlist(movie)}
                    />
                  </div>
                  <div className="text-center leading-tight px-1" style={{ color: 'rgba(0,229,255,0.99)' }}>
                    Watchlist
                  </div>
                </div>
                <div className={modalVariants.actionRailSeparator} />
                <div className={modalVariants.actionRailSection}>
                  <div className="w-20 h-20 flex items-center justify-center">
                    <img
                      src="/icons/new_cyan/eye.png"
                      alt="Seen"
                      className="w-full h-full object-contain transition-all duration-200 hover:scale-110 cursor-pointer"
                      onClick={() => movie && markAsWatched(movie)}
                    />
                  </div>
                  <div className="text-center leading-tight px-1" style={{ color: 'rgba(0,229,255,0.99)' }}>
                    Seen
                  </div>
                </div>
                <div className={modalVariants.actionRailSeparator} />
                <div className={modalVariants.actionRailSection}>
                  <div className="w-20 h-20 flex items-center justify-center">
                    <img
                      src="/icons/posters/thumb-up.png"
                      alt="Show more like this"
                      className="w-full h-full object-contain transition-all duration-200 hover:scale-110 cursor-pointer"
                      onClick={() => movie && addLikedMovie(movie)}
                    />
                  </div>
                  <div className="text-center leading-tight px-1" style={{ color: 'rgba(0,229,255,0.99)' }}>
                    Show more like this
                  </div>
                </div>
                <div className={modalVariants.actionRailSeparator} />
                <div className={modalVariants.actionRailSection}>
                  <div className="w-20 h-20 flex items-center justify-center">
                    <img
                      src="/icons/posters/thumb-down-2.png"
                      alt="Show less like this"
                      className="w-full h-full object-contain transition-all duration-200 hover:scale-110 cursor-pointer"
                      onClick={() => movie && addDislikedMovie(movie)}
                    />
                  </div>
                  <div className="text-center leading-tight px-1" style={{ color: 'rgba(0,229,255,0.99)' }}>
                    Show less like this
                  </div>
                </div>
              </aside>
            </div>

            {isLoading && (
              <div className="absolute inset-0 pointer-events-none" />
            )}
          </div>
        </div>

        {canShowArrows && (
          <>
            <button
              aria-label="Previous"
              onClick={goPrev}
              className={`absolute -left-28 top-1/2 -translate-y-1/2 z-50 rounded-[11px] border border-[rgba(0,229,255,0.5)] text-white bg-[rgba(2,255,251,0.07)] hover:bg-[rgba(2,255,251,0.25)] ${arrowButtonSize}`}
            >
              ←
            </button>
            <button
              aria-label="Next"
              onClick={goNext}
              className={`absolute -right-28 top-1/2 -translate-y-1/2 z-50 rounded-[11px] border border-[rgba(0,229,255,0.5)] text-white bg-[rgba(2,255,251,0.07)] hover:bg-[rgba(2,255,251,0.25)] ${arrowButtonSize}`}
            >
              →
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default RichMovieModal


