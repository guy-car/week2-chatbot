'use client'

import { Tooltip } from 'react-tooltip'
import { sidepanelVariants } from '~/styles/component-styles'
import { MovieCardIcon } from './MovieCardIcon'
import { MOVIE_CARD_ACTIONS } from './movie-card-icons'
import type { MovieCardActionType } from './movie-card-icons'

interface MovieCardSidepanelProps {
  posterUrl: string;
  movieTitle: string;
  movieId: number;
  onAddToWatchlist?: () => void;
  onMarkAsWatched?: () => void;
  onMoreInfo: () => void;
  onLike: () => void;
  onDislike: () => void;
  onRemove?: () => void;
  actions?: MovieCardActionType[]; // Optional per-context actions
  posterWidth?: number; // px
  posterHeight?: number; // px
  className?: string;
}

export function MovieCardSidepanel({ 
  posterUrl, 
  movieTitle, 
  movieId,
  onAddToWatchlist,
  onMarkAsWatched,
  onMoreInfo,
  onLike,
  onDislike,
  onRemove,
  actions,
  posterWidth,
  posterHeight,
  className 
}: MovieCardSidepanelProps) {
  // Defaults maintain chat-mode sizing if not provided
  const widthPx = posterWidth ?? 150;
  const heightPx = posterHeight ?? 212;

  // Default chat action set (no remove by default)
  const defaultActions: MovieCardActionType[] = ['addToWatchlist', 'markAsWatched', 'like', 'dislike'];
  const actionsToRender: MovieCardActionType[] = actions ?? defaultActions;
  const handleAction = (actionType: MovieCardActionType) => {
    switch (actionType) {
      case 'addToWatchlist':
        if (onAddToWatchlist) {
          onAddToWatchlist();
        }
        break;
      case 'markAsWatched':
        if (onMarkAsWatched) {
          onMarkAsWatched();
        }
        break;
      case 'like':
        onLike();
        break;
      case 'dislike':
        onDislike();
        break;
      case 'remove':
        if (onRemove) {
          onRemove();
        }
        break;
    }
  };

  // Create a single shared tooltip ID for all icons in this sidepanel
  const tooltipId = `movie-actions-${movieId}`;

  return (
    <div 
      className={`group ${sidepanelVariants.container} ${className ?? ''}`}
      style={{ width: widthPx }}
    >
      {/* Movie Poster with Simple Icon Overlay */}
      <div 
        className="relative overflow-hidden rounded-[3px] cursor-pointer"
        style={{ width: widthPx, height: heightPx }}
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
      <div className={sidepanelVariants.panel} style={{ left: widthPx, height: heightPx }}>
        <div className={sidepanelVariants.iconContainer}>
          {MOVIE_CARD_ACTIONS
            .filter((action) => actionsToRender.includes(action.actionName as MovieCardActionType))
            .map((action) => (
              <MovieCardIcon
                key={action.actionName}
                iconPath={action.iconPath}
                actionType={action.actionName as MovieCardActionType}
                tooltipText={action.tooltipText}
                movieId={movieId}
                tooltipId={tooltipId}
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