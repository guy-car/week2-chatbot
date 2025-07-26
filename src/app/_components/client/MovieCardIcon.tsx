'use client'

import { Tooltip } from 'react-tooltip'
import { sidepanelVariants } from '~/styles/component-styles'
import type { MovieCardActionType } from './movie-card-icons'

interface MovieCardIconProps {
  iconPath: string;
  actionType: MovieCardActionType;
  tooltipText: string;
  onClick: () => void;
  className?: string;
}

export function MovieCardIcon({ 
  iconPath, 
  actionType, 
  tooltipText, 
  onClick, 
  className 
}: MovieCardIconProps) {
  const tooltipId = `movie-action-${actionType}`;

  return (
    <>
      <button
        className={`${sidepanelVariants.iconButton} ${className ?? ''}`}
        onClick={onClick}
        data-tooltip-id={tooltipId}
        data-tooltip-content={tooltipText}
        aria-label={tooltipText}
        type="button"
      >
        <img
          src={iconPath}
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