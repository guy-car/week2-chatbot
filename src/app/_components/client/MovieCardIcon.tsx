'use client'

import { useState, useEffect } from 'react'
import { Tooltip } from 'react-tooltip'
import { sidepanelVariants } from '~/styles/component-styles'
import { MOVIE_CARD_ACTIONS } from './movie-card-icons'
import { cn } from '~/lib/utils'
import type { MovieCardActionType } from './movie-card-icons'

interface MovieCardIconProps {
  iconPath: string;
  actionType: MovieCardActionType;
  tooltipText: string;
  onClick: () => void;
  movieId: number; // Add movieId for unique storage key
  className?: string;
}

export function MovieCardIcon({ 
  iconPath, 
  actionType, 
  tooltipText, 
  onClick, 
  movieId,
  className 
}: MovieCardIconProps) {
  const tooltipId = `movie-action-${actionType}-${movieId}`;
  const storageKey = `movie-${movieId}-${actionType}-clicked`;
  
  // State for clicked status
  const [isClicked, setIsClicked] = useState(false);

  // Load clicked state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored === 'true') {
      setIsClicked(true);
    }
  }, [storageKey]);

  const handleClick = () => {
    // Don't mark "More Info" as clicked since it shouldn't change appearance
    if (actionType !== 'moreInfo') {
      setIsClicked(true);
      localStorage.setItem(storageKey, 'true');
    }
    
    // Call the original onClick handler
    onClick();
  };

  // Function to get the appropriate icon path based on state and action type
  const getIconPath = () => {
    const action = MOVIE_CARD_ACTIONS.find(a => a.actionName === actionType);
    if (!action) return iconPath;
    
    // For "More Info", always return the default icon
    if (actionType === 'moreInfo') {
      return action.iconPath;
    }
    
    // For other actions, return filled icon if clicked, default icon otherwise
    return isClicked ? action.filledIconPath : action.iconPath;
  };

  return (
    <>
      <button
        className={cn(
          sidepanelVariants.iconButton,
          'focus:outline-none',
          className ?? ''
        )}
        onClick={handleClick}
        data-tooltip-id={tooltipId}
        data-tooltip-content={tooltipText}
        aria-label={tooltipText}
        type="button"
      >
        <img
          src={getIconPath()}
          alt={tooltipText}
          className={sidepanelVariants.iconImage}
          style={{
            width: '32px',
            height: '32px',
            objectFit: 'contain' as const
          }}
        />
      </button>
      
      <Tooltip 
        id={tooltipId} 
        place="left" 
        delayShow={0}
        className="z-50"
      />
    </>
  );
} 