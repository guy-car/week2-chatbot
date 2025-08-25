'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { modalVariants } from '~/styles/component-styles'
import movieData from './movie-data.json'

// Custom action set for the modal that matches the original design
const MODAL_ACTIONS = [
  {
    iconPath: '/icons/posters/star.png',
    actionName: 'watchlist',
    tooltipText: 'Watchlist'
  },
  {
    iconPath: '/icons/posters/checked.png',
    actionName: 'seen',
    tooltipText: 'Seen'
  },
  {
    iconPath: '/icons/posters/thumb-up.png',
    actionName: 'showMore',
    tooltipText: 'Show more like this'
  },
  {
    iconPath: '/icons/posters/thumb-down-2.png',
    actionName: 'showLess',
    tooltipText: 'Show less like this'
  }
]

export default function TestModalPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMovieIndex, setCurrentMovieIndex] = useState(0)
  
  const currentMovie = movieData[currentMovieIndex]
  
  const nextMovie = () => {
    setCurrentMovieIndex((prev) => (prev + 1) % movieData.length)
  }
  
  const prevMovie = () => {
    setCurrentMovieIndex((prev) => (prev + 1 + movieData.length) % movieData.length)
  }
  
  const open = () => setIsOpen(true)
  const close = useCallback(() => setIsOpen(false), [])
  
  // Action handlers
  const handleAction = (actionName: string) => {
    if (!currentMovie) return
    
    switch (actionName) {
      case 'watchlist':
        console.log('Added to watchlist:', currentMovie.title)
        break
      case 'seen':
        console.log('Marked as seen:', currentMovie.title)
        break
      case 'showMore':
        console.log('Show more like:', currentMovie.title)
        break
      case 'showLess':
        console.log('Show less like:', currentMovie.title)
        break
      default:
        console.log('Unknown action:', actionName)
    }
  }
  
  // Escape to close
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, close])
  
  // Guard clause to ensure currentMovie exists
  if (!currentMovie) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B] p-8">
      <div className="flex flex-col items-center gap-4">
        <button
          className="px-4 py-2 rounded-[11px] border border-[rgba(0,229,255,0.99)] text-white bg-[rgba(2,255,251,0.07)] hover:bg-[rgba(2,255,251,0.35)] transition-all"
          onClick={open}
        >
          Open Modal Sandbox
        </button>
        
        <div className="flex items-center gap-4 text-white">
          <button
            onClick={prevMovie}
            className="px-3 py-1 rounded border border-[rgba(0,229,255,0.5)] hover:bg-[rgba(0,229,255,0.1)] transition-all"
          >
            ← Prev
          </button>
          <span className="text-sm opacity-80">
            {currentMovieIndex + 1} of {movieData.length}: {currentMovie.title}
          </span>
          <button
            onClick={nextMovie}
            className="px-3 py-1 rounded border border-[rgba(0,229,255,0.5)] hover:bg-[rgba(0,229,255,0.1)] transition-all"
          >
            Next →
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className={modalVariants.backdrop} onClick={close} />

          {/* Container with cyan glow and dual gradient overlay from Figma */}
          <div className={modalVariants.containerGradient}>
            <div className="relative max-w-[1166px] w-[96vw]  overflow-hidden">
              {/* Header row - removed title and ratings, just close button */}
              <div className="pt-8 pr-6">
                {/* Title and ratings moved to left column */}
              </div>

              {/* Main content: left column + center + right rail */}
              {/* Three columns with action rail extending to right edge */}
              <div className="pl-14 pt-14 pr-0 pb-14 grid grid-cols-[240px_1fr_80px] gap-8 items-start">
                {/* Left column: title + ratings + poster + providers */}
                <div className="flex flex-col items-center">
                  {/* Title centered in left column */}
                  <div className="text-[36px] font-normal text-center text-[#FAFAFA] font-inter mb-4 w-full">
                    {currentMovie.title} ({currentMovie.year})
                  </div>
                  
                  {/* Ratings below title with better styling */}
                  <div className="flex justify-center gap-4 text-sm mb-6">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs text-[#FAFAFA] opacity-60">IMDB</span>
                      <span className="text-[#E5E5E5] font-semibold">{currentMovie.ratings.imdb}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs text-[#FAFAFA] opacity-60">RT</span>
                      <span className="text-[#E5E5E5] font-semibold">{currentMovie.ratings.rottenTomatoes}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs text-[#FAFAFA] opacity-60">MC</span>
                      <span className="text-[#E5E5E5] font-semibold">{currentMovie.ratings.metacritic}</span>
                    </div>
                  </div>
                  
                  {/* Poster */}
                  <div className={modalVariants.poster}>
                    <Image
                      src={currentMovie.poster_url}
                      width={188}
                      height={282}
                      alt={`Poster for ${currentMovie.title}`}
                      className="h-full w-full object-cover"
                      priority
                    />
                  </div>
                  
                  {/* Providers */}
                  <div className="mt-6 text-[#FAFAFA] w-[188px]">
                    <div className="text-xl font-bold text-center mb-3">Where to watch</div>
                    <div className={modalVariants.providerCard}>
                      {currentMovie.watch?.flatrate ? (
                        <div className="grid grid-cols-2 gap-4">
                          {currentMovie.watch.flatrate.map((provider, index) => (
                            <div key={index} className="flex flex-col items-center gap-2">
                              <img
                                src={`https://image.tmdb.org${provider.logoPath}`}
                                alt={provider.name}
                                className="w-12 h-12 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => window.open(`https://www.${provider.name.toLowerCase().replace('+', 'plus')}.com`, '_blank')}
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

                {/* Center: trailer + meta + sections */}
                <div className="text-[#FAFAFA]">
                  <div className={modalVariants.trailerFrame}>
                    <div 
                      className="aspect-video w-full relative bg-gradient-to-br from-black/80 to-gray-900/80 flex items-center justify-center group cursor-pointer overflow-hidden"
                      onClick={() => window.open(currentMovie.trailer?.url, '_blank')}
                    >
                      {/* Trailer thumbnail */}
                      {currentMovie.trailer?.key && (
                        <img
                          src={`https://img.youtube.com/vi/${currentMovie.trailer.key}/mqdefault.jpg`}
                          alt="Trailer thumbnail"
                          className="w-full h-full object-cover"
                        />
                      )}
                      
                      {/* Video info overlay */}
                      <div className="absolute bottom-3 left-3 bg-black/70 px-2 py-1 rounded text-xs text-white font-medium">
                        {currentMovie.trailer?.name || 'TRAILER'}
                      </div>
                      
                      {/* Duration overlay */}
                      <div className="absolute bottom-3 right-3 bg-black/70 px-2 py-1 rounded text-xs text-white font-medium">
                        1:58
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className={modalVariants.metaLine}>
                      {currentMovie.genres?.join(', ')} | {currentMovie.duration}min | Dir. {currentMovie.director}
                    </div>
                  </div>

                  <div className="mt-8 space-y-6">
                    <section>
                      <h3 className="text-xl font-bold mb-2">Why it&apos;s right for you</h3>
                      <p className="text-[#E5E5E5]">{currentMovie.reason}</p>
                    </section>

                    <section>
                      <h3 className="text-xl font-bold mb-2">Synopsis</h3>
                      <p className="text-[#E5E5E5]">{currentMovie.overview}</p>
                    </section>
                  </div>
                </div>

                {/* Right action rail - Updated to match poster hover panel */}
                <aside className={modalVariants.actionRail}>
                  {MODAL_ACTIONS.map((action, index) => (
                    <div key={action.actionName}>
                      <div className={modalVariants.actionRailSection}>
                        <div className="w-10 h-10 flex items-center justify-center mb-2">
                          <img
                            src={action.iconPath}
                            alt={action.tooltipText}
                            className="w-full h-full object-contain transition-all duration-200 hover:scale-110 cursor-pointer"
                            onClick={() => handleAction(action.actionName)}
                          />
                        </div>
                        <div className="text-sm text-center leading-tight px-1">{action.tooltipText}</div>
                      </div>
                      {index < MODAL_ACTIONS.length - 1 && (
                        <div className={modalVariants.actionRailSeparator} />
                      )}
                    </div>
                  ))}
                </aside>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


