// Design tokens are imported for reference but not directly used in this file
// They are used indirectly through the design system

// Utility function to combine classes
export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

// Button variants using design tokens
export const buttonVariants = {
  // Primary button (Send button) - Orange outline, dark gray background
  primary: cn(
    'px-6 py-3 rounded-[11px] transition-all',
    'bg-[#292929] border border-[#fd8e2c]',
    'text-white font-medium',
    'hover:bg-[#292929]/80',
    'focus:outline-none focus:ring-2 focus:ring-[#fd8e2c]'
  ),
  
  // Chip button (Conversation chips) - Orange glow effect
  chip: cn(
    'px-4 py-2 rounded-[20px] transition-all',
    'bg-[rgba(2,255,251,0.07)]',
    'border border-[rgba(244,243,241,0.05)]',
    'text-white text-sm font-medium',
    'shadow-[0px_0px_18px_-2px_#fd8e2c,0px_0px_22px_-4px_#fd8e2c]',
    'hover:bg-[rgba(2,255,251,0.15)]',
    'cursor-pointer'
  ),
  
  // Sidebar button - Cyan outline, cyan transparent background
  sidebar: cn(
    'px-6 py-3 rounded-br-[11px] rounded-tr-[11px] transition-all',
    'bg-[rgba(2,255,251,0.25)]',
    'border border-[rgba(0,229,255,0.99)]',
    'text-white font-bold text-[21px]',
    'hover:bg-[rgba(2,255,251,0.35)]'
  ),
};

// Card variants
export const cardVariants = {
  // Movie card with cyan glow
  movie: cn(
    'rounded-[3px] shadow-lg transition-all',
    'hover:shadow-xl',
    'bg-cover bg-center bg-no-repeat',
    'relative overflow-hidden'
  ),
  
  // Chat container
  chat: cn(
    'rounded-[11px] border border-[#fd8e2c]',
    'bg-[#292929] p-6',
    'shadow-lg'
  ),
  
  // Sidebar card
  sidebar: cn(
    'rounded-br-[11px] rounded-tr-[11px]',
    'border border-[rgba(0,229,255,0.99)]',
    'transition-all'
  ),
};

// Input variants
export const inputVariants = {
  // Chat input field
  chat: cn(
    'px-4 py-2 rounded-[11px]',
    'bg-[#292929] border border-[#fd8e2c]',
    'text-white placeholder-gray-400',
    'focus:outline-none focus:ring-2 focus:ring-[#fd8e2c]',
    'transition-all'
  ),
  
  // Search input
  search: cn(
    'px-4 py-2 rounded-lg',
    'bg-white/10 border border-white/20',
    'text-white placeholder-white/50',
    'focus:outline-none focus:ring-2 focus:ring-white/50',
    'transition-all'
  ),
};

// Chip variants
export const chipVariants = {
  // Conversation chip
  conversation: cn(
    'px-4 py-2 rounded-[20px]',
    'bg-[rgba(2,255,251,0.07)]',
    'border border-[rgba(244,243,241,0.05)]',
    'text-white text-sm font-medium',
    'shadow-[0px_0px_18px_-2px_#fd8e2c,0px_0px_22px_-4px_#fd8e2c]',
    'hover:bg-[rgba(2,255,251,0.15)]',
    'transition-all cursor-pointer'
  ),
  
  // Tag chip
  tag: cn(
    'px-3 py-1 rounded-full',
    'bg-[rgba(0,229,255,0.1)]',
    'border border-[rgba(0,229,255,0.3)]',
    'text-[#00E5FF] text-xs font-medium',
    'hover:bg-[rgba(0,229,255,0.2)]',
    'transition-all'
  ),
};

// Text variants
export const textVariants = {
  // Heading styles
  h1: cn(
    'text-2xl font-bold text-white',
    'font-display'
  ),
  
  h2: cn(
    'text-xl font-bold text-white',
    'font-display'
  ),
  
  h3: cn(
    'text-lg font-semibold text-white'
  ),
  
  // Body text
  body: cn(
    'text-base text-white leading-relaxed'
  ),
  
  bodySmall: cn(
    'text-sm text-white/80 leading-normal'
  ),
  
  // Accent text
  accent: cn(
    'text-[#FFC559] font-medium'
  ),
  
  // Caption text
  caption: cn(
    'text-xs text-white/60'
  ),
};

// Layout utilities
export const layoutVariants = {
  // Container with max width
  container: cn(
    'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'
  ),
  
  // Flex layouts
  flexCenter: cn(
    'flex items-center justify-center'
  ),
  
  flexBetween: cn(
    'flex items-center justify-between'
  ),
  
  flexCol: cn(
    'flex flex-col'
  ),
  
  // Grid layouts
  grid: cn(
    'grid gap-4'
  ),
  
  gridCols2: cn(
    'grid grid-cols-1 sm:grid-cols-2 gap-4'
  ),
  
  gridCols3: cn(
    'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
  ),
};

// Animation utilities
export const animationVariants = {
  // Fade in
  fadeIn: cn(
    'animate-in fade-in duration-300'
  ),
  
  // Slide in from bottom
  slideUp: cn(
    'animate-in slide-in-from-bottom-4 duration-300'
  ),
  
  // Scale in
  scaleIn: cn(
    'animate-in zoom-in-95 duration-200'
  ),
  
  // Hover effects
  hoverScale: cn(
    'transition-transform hover:scale-105'
  ),
  
  hoverGlow: cn(
    'transition-shadow hover:shadow-glowCyan'
  ),
}; 