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
    iconPath: '/icons/posters/star.png',
    filledIconPath: '/icons/posters/star-filled.png',
    actionName: 'addToWatchlist',
    tooltipText: 'Add to Watchlist'
  },
  {
    iconPath: '/icons/posters/checked.png',
    filledIconPath: '/icons/posters/checked-filled.png',
    actionName: 'markAsWatched',
    tooltipText: 'Add to Watch History'
  },
  {
    iconPath: '/icons/posters/light-bulb.png',
    filledIconPath: '/icons/posters/light-bulb.png', // Same icon for "More Info"
    actionName: 'moreInfo',
    tooltipText: 'More Info'
  },
  {
    iconPath: '/icons/posters/thumb-up.png',
    filledIconPath: '/icons/posters/thumb-up-filled.png',
    actionName: 'like',
    tooltipText: 'Like'
  },
  {
    iconPath: '/icons/posters/thumb-down-2.png',
    filledIconPath: '/icons/posters/thumb-down-filled.png',
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
export type MovieCardActionType = 'addToWatchlist' | 'markAsWatched' | 'moreInfo' | 'like' | 'dislike'; 