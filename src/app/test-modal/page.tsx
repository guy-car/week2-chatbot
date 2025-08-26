'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { modalVariants } from '~/styles/component-styles'
import movieData from './movie-data.json'

// Custom action set for the modal that matches the original design
const MODAL_ACTIONS = [
  {
    iconPath: '/icons/new_cyan/star.png',
    actionName: 'watchlist',
    tooltipText: 'Watchlist'
  },
  {
    iconPath: '/icons/new_cyan/eye.png',
    actionName: 'seen',
    tooltipText: 'Seen'
  },
  {
    iconPath: '/icons/new_cyan/thumb-up.png',
    actionName: 'showMore',
    tooltipText: 'Show more like this'
  },
  {
    iconPath: '/icons/new_cyan/thumb-down.png',
    actionName: 'showLess',
    tooltipText: 'Show less like this'
  }
]

export default function TestModalPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMovieIndex, setCurrentMovieIndex] = useState(0)
  
  const currentMovie = movieData[currentMovieIndex]
  
  // Dynamic title styling based on length
  const getTitleStyles = (title: string) => {
    const length = title.length;
    if (length <= 20) return 'text-[28px]';
    if (length <= 40) return 'text-[24px]';
    return 'text-[20px]';
  };
  
  // Smart title truncation with word boundary awareness
  const truncateTitle = (title: string, maxLength = 35) => {
    if (title.length <= maxLength) return title;
    
    // Try to break at word boundaries
    const words = title.split(' ');
    let result = '';
    
    for (const word of words) {
      if ((result + ' ' + word).length <= maxLength) {
        result += (result ? ' ' : '') + word;
      } else {
        break;
      }
    }
    
    return result + '...';
  };
  
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
            <div className="relative max-w-[1166px] w-[96vw] overflow-hidden pt-14 pl-14 pb-14 pr-0">
              {/* Header row - removed title and ratings, just close button */}
              <div className="">
                {/* Title and ratings moved to left column */}
              </div>

              {/* Main content: restructured to 5 sections */}
              <div className="grid grid-cols-[240px_1fr_100px] gap-8 items-start">
                {/* Left column: title/ratings + poster + where to watch */}
                <div className="flex flex-col items-center pr-10">
                  {/* Section 1: Title and Ratings */}
                  <div className="flex flex-col justify-center mb-6 w-full">
                    <div 
                      className={`${getTitleStyles(currentMovie.title)} font-normal text-center text-[#FAFAFA] font-inter leading-tight`}
                      title={currentMovie.title} // Tooltip shows full title on hover
                    >
                      {truncateTitle(currentMovie.title)}
                    </div>
                  </div>
                  
                  {/* Ratings below title */}
                  <div className="flex justify-center gap-6 text-sm mb-6">
                    <div className="flex items-center gap-2">
                      <img
                        src="/streaming_providers/IMDB.svg"
                        alt="IMDB"
                        className="w-6 h-6 object-contain"
                      />
                      <span className="text-[#E5E5E5] font-semibold">{currentMovie.ratings.imdb}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <img
                        src="/streaming_providers/rottentomatoes.png"
                        alt="Rotten Tomatoes"
                        className="w-6 h-6 object-contain"
                      />
                      <span className="text-[#E5E5E5] font-semibold">{currentMovie.ratings.rottenTomatoes}</span>
                    </div>
                  </div>
                  
                  {/* Section 2: Poster */}
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
                  
                  {/* Section 3: Where to Watch */}
                  <div className="mt-6 text-[#FAFAFA] w-[188px] flex flex-col items-center">
                    <div className="text-xl font-bold text-center mb-3">Where to watch</div>
                    <div className={modalVariants.providerCard}>
                      {currentMovie.watch?.flatrate ? (
                        <div className="grid grid-cols-2 gap-4">
                          {currentMovie.watch.flatrate.map((provider, index) => (
                            <div key={index} className="flex flex-col items-center gap-2">
                              <img
                                src={`https://image.tmdb.org${provider.logoPath}`}
                                alt={provider.name}
                                className="w-10 h-10 object-contain cursor-pointer hover:opacity-80 transition-opacity rounded-[11px]"
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

                {/* Center column: Section 4 - Trailer + Info + Content */}
                <div className="text-[#FAFAFA] pr-10 flex flex-col">
                  {/* Trailer */}
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
                    </div>
                  </div>
                  
                  {/* Info section: genre, duration, director, year */}
                  <div className="mt-3">
                    <div className={modalVariants.metaLine}>
                      {currentMovie.genres?.join(', ')} | {currentMovie.duration}min | Dir. {currentMovie.director} | {currentMovie.year}
                    </div>
                  </div>

                  {/* Content sections - scrollable container */}
                  <div className="mt-8 flex-1 overflow-y-auto max-h-[400px]">
                    <div className="space-y-6 pr-2">
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
                </div>

                {/* Right column: Section 5 - Action Rail */}
                <aside className={modalVariants.actionRail}>
                  {MODAL_ACTIONS.map((action, index) => (
                    <div key={action.actionName}>
                      <div className={modalVariants.actionRailSection}>
                        <div className="w-20 h-20 flex items-center justify-center">
                          <img
                            src={action.iconPath}
                            alt={action.tooltipText}
                            className="w-full h-full object-contain transition-all duration-200 hover:scale-110 cursor-pointer"
                            onClick={() => handleAction(action.actionName)}
                          />
                        </div>
                        <div className={`text-center leading-tight px-1 ${action.tooltipText.length > 15 ? 'text-sm' : 'text-m'}`} style={{ color: 'rgba(0,229,255,0.99)' }}>
                          {action.tooltipText}
                        </div>
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


