'use client'

import { sidepanelVariants } from '~/styles/component-styles'
import { MovieCardIcon } from './MovieCardIcon'
import { MOVIE_CARD_ACTIONS } from './movie-card-icons'
import type { MovieCardActionType } from './movie-card-icons'

interface MovieCardSidepanelProps {
  posterUrl: string;
  movieTitle: string;
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
      case 'moreInfo':
        onMoreInfo();
        break;
      case 'like':
        onLike();
        break;
      case 'dislike':
        onDislike();
        break;
    }
  };

  return (
    <div className={`group ${sidepanelVariants.container} ${className ?? ''}`}>
      {/* Movie Poster */}
      <div 
        className={sidepanelVariants.poster}
        style={{
          backgroundImage: `url(${posterUrl})`,
          width: '150px',
          height: '212px'
        }}
        role="img"
        aria-label={`Movie poster for ${movieTitle}`}
      />
      
      {/* Sliding Panel */}
      <div className={sidepanelVariants.panel}>
        <div className={sidepanelVariants.iconContainer}>
          {MOVIE_CARD_ACTIONS.map((action) => (
            <MovieCardIcon
              key={action.actionName}
              iconPath={action.iconPath}
              actionType={action.actionName as MovieCardActionType}
              tooltipText={action.tooltipText}
              onClick={() => handleAction(action.actionName as MovieCardActionType)}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 