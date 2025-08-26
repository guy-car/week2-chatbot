'use client'

import { Tooltip } from 'react-tooltip'
import { sidepanelVariants } from '~/styles/component-styles'
import { MovieCardIcon } from './MovieCardIcon'
import { MOVIE_CARD_ACTIONS } from './movie-card-icons'
import type { MovieCardActionType } from './movie-card-icons'

interface MovieCardSidepanelProps {
  posterUrl: string;
  movieTitle: string;
  movieId: number; // Add movieId prop
  onAddToWatchlist: () => void;
  onMarkAsWatched: () => void;
  onMoreInfo: () => void;
  onLike: () => void;
  onDislike: () => void;
  className?: string;
}

export function MovieCardSidepanel({ 
  posterUrl, 
  movieTitle, 
  movieId, // Add movieId to destructuring
  onAddToWatchlist,
  onMarkAsWatched,
  onMoreInfo,
  onLike,
  onDislike,
  className 
}: MovieCardSidepanelProps) {
  const handleAction = (actionType: MovieCardActionType) => {
    switch (actionType) {
      case 'addToWatchlist':
        onAddToWatchlist();
        break;
      case 'markAsWatched':
        onMarkAsWatched();
        break;
      case 'like':
        onLike();
        break;
      case 'dislike':
        onDislike();
        break;
    }
  };

  // Create a single shared tooltip ID for all icons in this sidepanel
  const tooltipId = `movie-actions-${movieId}`;

  return (
    <div 
      className={`group ${sidepanelVariants.container} ${className ?? ''}`}
    >
      {/* Movie Poster with Simple Icon Overlay */}
      <div 
        className="relative w-[150px] h-[212px] overflow-hidden rounded-[3px] cursor-pointer"
        onClick={onMoreInfo}
      >
        {/* Poster image */}
        <img
          src={posterUrl}
          alt={`Poster for ${movieTitle}`}
          className="w-full h-full object-cover"
        />
        
        {/* Dark overlay - shows on hover */}
        <div className="absolute inset-0 bg-black opacity-0 transition-opacity duration-300 group-hover:opacity-30"></div>
        
        {/* Magnifying glass icon overlay - shows on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <img
            src="/icons/new_cyan/glass.png"
            alt="More Info"
            className="w-12 h-12"
          />
        </div>
      </div>
      
      {/* Sliding Panel */}
      <div className={sidepanelVariants.panel}>
        <div className={sidepanelVariants.iconContainer}>
          {MOVIE_CARD_ACTIONS.map((action) => (
            <MovieCardIcon
              key={action.actionName}
              iconPath={action.iconPath}
              actionType={action.actionName as MovieCardActionType}
              tooltipText={action.tooltipText}
              movieId={movieId} // Pass movieId to each icon
              tooltipId={tooltipId} // Pass shared tooltip ID to each icon
              onClick={() => handleAction(action.actionName as MovieCardActionType)}
            />
          ))}
        </div>
      </div>

      {/* Single tooltip instance for the whole sidepanel */}
      <Tooltip 
        id={tooltipId} 
        place="left" 
        delayShow={0}
        className="z-50"
      />
    </div>
  );
} 