'use client'

import { useState, useEffect } from 'react'
import { Tooltip } from 'react-tooltip'
import { sidepanelVariants, animationVariants } from '~/styles/component-styles'
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
  
  // State for clicked status and animation
  const [isClicked, setIsClicked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Load clicked state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored === 'true') {
      setIsClicked(true);
    }
  }, [storageKey]);

  const handleClick = async () => {
    // Prevent multiple rapid clicks
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    // Mark as clicked and save to localStorage
    setIsClicked(true);
    localStorage.setItem(storageKey, 'true');
    
    // Call the original onClick handler
    onClick();
    
    // Reset animation state after animation completes
    setTimeout(() => {
      setIsAnimating(false);
    }, 600); // Match animation duration
  };

  return (
    <>
      <button
        className={cn(
          sidepanelVariants.iconButton,
          animationVariants.clickScale,
          animationVariants.clickGlow,
          isAnimating && animationVariants.successPulse,
          className ?? ''
        )}
        onClick={handleClick}
        data-tooltip-id={tooltipId}
        data-tooltip-content={tooltipText}
        aria-label={tooltipText}
        type="button"
        disabled={isAnimating}
      >
        <img
          src={iconPath}
          alt={tooltipText}
          className={cn(
            sidepanelVariants.iconImage,
            isClicked ? animationVariants.iconActive : animationVariants.iconInactive
          )}
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

// Helper function to combine classes (if not already imported)
const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
}; 