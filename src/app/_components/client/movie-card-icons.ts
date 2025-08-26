// Icon mapping for movie card sidepanel actions
// Maps poster icons from public/icons/posters/ to their corresponding actions

export interface MovieCardAction {
  iconPath: string;
  filledIconPath: string;
  actionName: string;
  tooltipText: string;
}

export const MOVIE_CARD_ACTIONS: MovieCardAction[] = [
  {
    iconPath: '/icons/new_cyan/star.png',
    filledIconPath: '/icons/new_cyan/star-filled-2.png',
    actionName: 'addToWatchlist',
    tooltipText: 'Add to Watchlist'
  },
  {
    iconPath: '/icons/new_cyan/eye.png',
    filledIconPath: '/icons/new_cyan/eye-filled-70-opct-dark.png',
    actionName: 'markAsWatched',
    tooltipText: 'Add to Watch History'
  },
  {
    iconPath: '/icons/new_cyan/thumb-up.png',
    filledIconPath: '/icons/new_cyan/thumb-up-filled-2.png',
    actionName: 'like',
    tooltipText: 'Like'
  },
  {
    iconPath: '/icons/new_cyan/thumb-down.png',
    filledIconPath: '/icons/new_cyan/thumb-down-filled-2.png',
    actionName: 'dislike',
    tooltipText: 'Dislike'
  }
];

// Icon display configuration
export const ICON_CONFIG = {
  displaySize: '32px', // 32px display size for consistent sizing
  aspectRatio: 'preserve', // Maintain original aspect ratios
  hoverScale: '1.1', // 10% scale increase on hover
  transitionDuration: '200ms' // Smooth transition for interactions
};

// Action type for TypeScript
export type MovieCardActionType = 'addToWatchlist' | 'markAsWatched' | 'like' | 'dislike'; 