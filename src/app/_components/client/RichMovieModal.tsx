'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { toast } from 'react-hot-toast'
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
  seed,
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
  seed?: Partial<MovieData>
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
    return base ? { ...base, ...enrich, ...(seed ?? {}) } : undefined
  }, [base, enrich, seed])

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

  const { addToWatchlist, markAsWatched, removeFromWatchlist, removeFromHistory, watchlist, watchHistory } = useMovieCollections()
  const { addLikedMovie, addDislikedMovie, profile } = useTasteProfile()

  const handleProviderClick = useCallback((name: string) => {
    const host = name.toLowerCase().replace('+', 'plus')
    window.open(`https://www.${host}.com`, '_blank')
  }, [])

  // Determine if current movie is already in the user's watchlist
  const isInWatchlist = useMemo(() => {
    if (!movie) return false
    return watchlist.some((item: { movieId: string }) => item.movieId === movie.id.toString())
  }, [movie, watchlist])

  // Determine if current movie is already in the user's watch history
  const isInWatchHistory = useMemo(() => {
    if (!movie) return false
    return watchHistory.some((item: { movieId: string }) => item.movieId === movie.id.toString())
  }, [movie, watchHistory])

  // Optimistic UI state and pending guards
  const [optimistic, setOptimistic] = useState<{ watchlist?: boolean; history?: boolean }>({})
  const [pending, setPending] = useState<{ watchlist: boolean; history: boolean }>({ watchlist: false, history: false })
  const [pulse, setPulse] = useState<{ watchlist: boolean; history: boolean; like: boolean; dislike: boolean }>({ watchlist: false, history: false, like: false, dislike: false })
  const [reaction, setReaction] = useState<'like' | 'dislike' | null>(null)

  const isWatchlisted = (optimistic.watchlist ?? isInWatchlist)
  const isWatched = (optimistic.history ?? isInWatchHistory)

  const triggerPulse = (key: 'watchlist' | 'history') => {
    setPulse(prev => ({ ...prev, [key]: true }))
    setTimeout(() => setPulse(prev => ({ ...prev, [key]: false })), 250)
  }

  const triggerPulseReaction = (key: 'like' | 'dislike') => {
    setPulse(prev => ({ ...prev, [key]: true }))
    setTimeout(() => setPulse(prev => ({ ...prev, [key]: false })), 250)
  }

  const onToggleWatchlist = async () => {
    if (!movie || pending.watchlist) return
    const next = !isWatchlisted
    setOptimistic(o => ({ ...o, watchlist: next }))
    setPending(p => ({ ...p, watchlist: true }))
    triggerPulse('watchlist')
    try {
      if (next) {
        await addToWatchlist(movie)
        toast.success(`Added "${movie.title}" to watchlist`, {
          icon: (
            <Image src="/icons/new_cyan/star.png" alt="" width={18} height={18} aria-hidden />
          ),
        })
      } else {
        await removeFromWatchlist(movie.id)
        toast.success(`Removed "${movie.title}" from watchlist`, {
          icon: (
            <Image src="/icons/new_cyan/star.png" alt="" width={18} height={18} aria-hidden />
          ),
        })
      }
    } catch {
      setOptimistic(o => ({ ...o, watchlist: !next }))
      toast.error('Watchlist update failed')
    } finally {
      setPending(p => ({ ...p, watchlist: false }))
    }
  }

  const onToggleWatched = async () => {
    if (!movie || pending.history) return
    const next = !isWatched
    setOptimistic(o => ({ ...o, history: next }))
    setPending(p => ({ ...p, history: true }))
    triggerPulse('history')
    try {
      if (next) {
        await markAsWatched(movie)
        toast.success(`Marked "${movie.title}" as watched`, {
          icon: (
            <Image src="/icons/new_cyan/eye.png" alt="" width={18} height={18} aria-hidden />
          ),
        })
      } else {
        await removeFromHistory(movie.id)
        toast.success(`Removed "${movie.title}" from history`, {
          icon: (
            <Image src="/icons/new_cyan/eye.png" alt="" width={18} height={18} aria-hidden />
          ),
        })
      }
    } catch {
      setOptimistic(o => ({ ...o, history: !next }))
      toast.error('Watch history update failed')
    } finally {
      setPending(p => ({ ...p, history: false }))
    }
  }

  // Initialize reaction from profile when available
  useEffect(() => {
    if (!movie) return
    const liked = profile?.likedMovies?.split(', ').includes(movie.title) ?? false
    const disliked = profile?.dislikedMovies?.split(', ').includes(movie.title) ?? false
    if (liked) setReaction('like')
    else if (disliked) setReaction('dislike')
    else setReaction(null)
  }, [movie, profile?.likedMovies, profile?.dislikedMovies])

  const onLike = async () => {
    if (!movie) return
    // Optimistic flip to like
    setReaction('like')
    triggerPulseReaction('like')
    try {
      await addLikedMovie(movie)
      toast.success('Taste profile updated', {
        icon: (
          <Image src="/icons/new_cyan/popcorn.png" alt="" width={18} height={18} aria-hidden />
        ),
      })
    } catch {
      // silent fail, keep UI as-is
    }
  }

  const onDislike = async () => {
    if (!movie) return
    // Optimistic flip to dislike
    setReaction('dislike')
    triggerPulseReaction('dislike')
    try {
      await addDislikedMovie(movie)
      toast.success('Taste profile updated', {
        icon: (
          <Image src="/icons/new_cyan/popcorn.png" alt="" width={18} height={18} aria-hidden />
        ),
      })
    } catch {
      // silent fail
    }
  }

  

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
                      src={isWatchlisted ? "/icons/new_cyan/star-filled-2.png" : "/icons/new_cyan/star.png"}
                      alt="Watchlist"
                      className={`w-full h-full object-contain transition-all duration-200 hover:scale-110 cursor-pointer ${pulse.watchlist ? 'pulse-once' : ''}`}
                      onClick={onToggleWatchlist}
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
                      src={isWatched ? "/icons/new_cyan/eye-filled-70-opct-dark.png" : "/icons/new_cyan/eye.png"}
                      alt="Seen"
                      className={`w-full h-full object-contain transition-all duration-200 hover:scale-110 cursor-pointer ${pulse.history ? 'pulse-once' : ''}`}
                      onClick={onToggleWatched}
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
                      src={reaction === 'like' ? '/icons/new_cyan/thumb-up-filled-2.png' : '/icons/new_cyan/thumb-up.png'}
                      alt="Show more like this"
                      className={`w-full h-full object-contain transition-all duration-200 hover:scale-110 cursor-pointer ${pulse.like ? 'pulse-once' : ''}`}
                      onClick={onLike}
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
                      src={reaction === 'dislike' ? '/icons/new_cyan/thumb-down-filled-2.png' : '/icons/new_cyan/thumb-down.png'}
                      alt="Show less like this"
                      className={`w-full h-full object-contain transition-all duration-200 hover:scale-110 cursor-pointer ${pulse.dislike ? 'pulse-once' : ''}`}
                      onClick={onDislike}
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


