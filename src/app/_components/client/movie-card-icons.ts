// Icon mapping for movie card sidepanel actions
// Maps poster icons from public/icons/posters/ to their corresponding actions

export interface MovieCardAction {
  iconPath: string;
  actionName: string;
  tooltipText: string;
}

export const MOVIE_CARD_ACTIONS: MovieCardAction[] = [
  {
    iconPath: '/icons/posters/star.png',
    actionName: 'addToWatchlist',
    tooltipText: 'Add to Watchlist'
  },
  {
    iconPath: '/icons/posters/checked.png',
    actionName: 'markAsWatched',
    tooltipText: 'Add to Watch History'
  },
  {
    iconPath: '/icons/posters/light-bulb.png',
    actionName: 'moreInfo',
    tooltipText: 'More Info'
  },
  {
    iconPath: '/icons/posters/thumb-up.png',
    actionName: 'like',
    tooltipText: 'Like'
  },
  {
    iconPath: '/icons/posters/thumb-down-2.png',
    actionName: 'dislike',
    tooltipText: 'Dislike'
  }
];

// Icon display configuration
export const ICON_CONFIG = {
  displaySize: '32px', // 32px display size for consistent sizing
  aspectRatio: 'preserve', // Maintain original aspect ratios
  filter: 'brightness-0 invert', // Make icons white
  hoverScale: '1.1', // 10% scale increase on hover
  transitionDuration: '200ms' // Smooth transition for interactions
};

// Action type for TypeScript
export type MovieCardActionType = 'addToWatchlist' | 'markAsWatched' | 'moreInfo' | 'like' | 'dislike'; 