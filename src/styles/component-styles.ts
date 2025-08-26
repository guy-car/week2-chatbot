// Import design tokens for centralized styling
import { colors, borderRadius, shadows, typography } from './design-tokens';

// Utility function to combine classes
export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

// Design token utility functions - these output the exact same CSS classes as before
// but now they're sourced from design tokens for centralized control
const tokens = {
  bg: {
    main: `bg-[${colors.background.main}]`,           // bg-[#0A0A0B]
    secondary: `bg-[${colors.background.secondary}]`, // bg-[#292929] 
    chip: `bg-[${colors.background.chip}]`,           // bg-[rgba(2,255,251,0.07)]
  },
  border: {
    primary: `border-[${colors.border.primary}]`,     // border-[#FD8E2C]
    secondary: `border-[${colors.border.secondary}]`, // border-[rgba(0,229,255,0.99)]
    subtle: `border-[${colors.border.subtle}]`,       // border-[rgba(244,243,241,0.05)]
  },
  text: {
    primary: `text-[${colors.text.primary}]`,         // text-[#FAFAFA]
    secondary: `text-[${colors.text.secondary}]`,     // text-[#E5E5E5]
    accent: `text-[${colors.text.accent}]`,           // text-[#FFFFFF]
    muted: `text-[${colors.text.muted}]`,             // text-[#A1A1A1]
    gold: `text-[${colors.glow.gold}]`,               // text-[#FFC559]
  },
  radius: {
    sm: `rounded-[${borderRadius.sm}]`,                // rounded-[3px]
    md: `rounded-[${borderRadius.md}]`,                // rounded-[11px]
    lg: `rounded-[${borderRadius.lg}]`,                // rounded-[20px]
  },
  shadow: {
    orange: `shadow-[${shadows.glowOrange}]`,          // Orange glow effect
  },
  focus: {
    ring: `focus:ring-[${colors.focus.ring}]`,        // focus:ring-[rgba(250,250,250,0.5)]
    border: `focus:border-[${colors.focus.primary}]`, // focus:border-[#FAFAFA]
    orange: `focus:border-[${colors.focus.orange}]`,  // focus:border-[#FD8E2C]
    orangeRing: `focus:ring-[${colors.focus.orangeRing}]`, // Orange focus ring
  },
  hover: {
    primary: `hover:bg-[${colors.hover.primary}]`,    // Orange hover
    chip: `hover:bg-[${colors.hover.chip}]`,          // Chip hover
    button: `hover:bg-[${colors.hover.button}]`,      // Button hover
    genie: `hover:bg-[${colors.hover.genie}]`,        // More visible orange hover
  }
};

// Button variants using design tokens
export const buttonVariants = {
  // Primary button (Send button) - Orange outline, dark gray background
  primary: cn(
    'px-6 py-3 transition-all',
    tokens.radius.md,
    `bg-transparent border ${tokens.border.primary}`,
    `${tokens.text.accent} font-medium`,
    tokens.hover.primary,
          'focus:outline-none focus:ring-2 focus:ring-[rgba(253,142,44,0.3)] focus:border-[#FD8E2C] focus:animate-[glow-fade_2500ms_ease-out_forwards]'
  ),
  
  // Chip button (Conversation chips) - Orange glow effect
  chip: cn(
    'px-4 py-2 transition-all',
    tokens.radius.lg,
    tokens.bg.chip,
    `border ${tokens.border.subtle}`,
    `${tokens.text.accent} text-sm font-medium`,
    'shadow-[0px_0px_18px_-2px_#fd8e2c,0px_0px_22px_-4px_#fd8e2c]',
    tokens.hover.chip,
    'cursor-pointer'
  ),
  
  // Sidebar button - Cyan outline, cyan transparent background
  sidebar: cn(
    'px-6 py-3 rounded-br-[11px] rounded-tr-[11px] transition-all',
    'bg-[rgba(2,255,251,0.075)]',
    'border border-[rgba(0,229,255,0.99)]',
    'text-white font-bold text-[21px]',
    'hover:bg-[rgba(2,255,251,0.35)]'
  ),
    // Sidebar button - Cyan outline, cyan transparent background
    homepageNewChat: cn(
      'px-4 py-2 rounded-[20px] transition-all',
      'bg-[rgba(2,255,251,0.07)]',
      'border border-[rgba(244,243,241,0.05)]',
      'text-white text-xl font-medium',
      'shadow-[0px_0px_18px_-2px_#fd8e2c,0px_0px_22px_-4px_#fd8e2c]',
      tokens.hover.genie,
      'focus:outline-none focus:ring-2 focus:ring-[rgba(253,142,44,0.3)] focus:border-[#FD8E2C]',
      'cursor-pointer'
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
    `${tokens.radius.md} border ${tokens.border.primary}`,
    `${tokens.bg.secondary} p-6`,
    'shadow-lg'
  ),
  
  // Sidebar card
  sidebar: cn(
    `rounded-br-[${borderRadius.md}] rounded-tr-[${borderRadius.md}]`,
    `border ${tokens.border.secondary}`,
    'transition-all'
  ),
};

// Input variants
export const inputVariants = {
  // Chat input field
  chat: cn(
    'px-4 py-2',
    tokens.radius.md,
    `${tokens.bg.secondary} border-2 ${tokens.border.primary}`,
    `${tokens.text.accent} placeholder-gray-400`,
    'focus:outline-none focus:ring-2 focus:ring-[rgba(253,142,44,0.3)] focus:border-[#FD8E2C]',
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
    tokens.hover.primary,
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
  // Core text colors from design tokens
  primary: cn(tokens.text.primary),     // Primary text (soft white)
  secondary: cn(tokens.text.secondary), // Secondary text (muted)
  accent: cn(tokens.text.accent),       // Pure white for emphasis
  muted: cn(tokens.text.muted),         // Subtle text
  
  // Heading styles
  h1: cn(
    `text-2xl font-bold ${tokens.text.primary}`,
    'font-display'
  ),
  
  h2: cn(
    `text-xl font-bold ${tokens.text.primary}`,
    'font-display'
  ),
  
  h3: cn(
    `text-lg font-semibold ${tokens.text.primary}`
  ),
  
  // Body text
  body: cn(
    `text-base ${tokens.text.primary} leading-relaxed`
  ),
  
  bodySmall: cn(
    `text-sm ${tokens.text.secondary} leading-normal`
  ),
  
  // Special accent text
  brand: cn(
    `${tokens.text.gold} font-medium`
  ),
  
  // Caption text
  caption: cn(
    `text-xs ${tokens.text.muted}`
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
  
  // Icon state transitions
  iconActive: cn(
    'transition-all duration-300'
  ),
  
  iconInactive: cn(
    'transition-all duration-300'
  ),
};

// Sidepanel variants using design tokens
export const sidepanelVariants = {
  // Parent container with glow effect
  container: cn(
    'relative transition-all duration-400',
    'bg-[rgba(0,229,255,0.25)]', // Semi-transparent cyan background
    'shadow-[0px_0px_22px_0px_rgba(0,229,255,0.99),0px_0px_35px_0px_rgba(0,229,255,0.25),0px_0px_12px_-4px_rgba(0,229,255,0.99)]', // Cyan glow effect
    'rounded-[11px]',
    'w-[150px]' // Fixed width - no expansion needed
  ),
  
  // Movie poster container
  poster: cn(
    'relative overflow-hidden',
    'bg-cover bg-center bg-no-repeat',
    'rounded-[3px]'
  ),
  
  // Sliding panel container
  panel: cn(
    'absolute top-0 left-[150px] h-full z-10', // Position to the right of the poster, above other content
    'bg-[rgba(0,229,255,0.15)]', // Semi-transparent cyan background
    'flex flex-col items-center justify-center',
    'transition-all duration-300 ease-in-out',
    'opacity-0 pointer-events-none', // Hidden by default, no pointer events
    'group-hover:opacity-100 group-hover:pointer-events-auto', // Fade in on hover, enable pointer events
    'w-[50px] rounded-tr-[11px] rounded-br-[11px]' // Fixed panel width with rounded right corners
  ),
  
  // Icon container within panel
  iconContainer: cn(
    'flex flex-col items-center justify-center',
    'space-y-3', // 12px spacing between icons
    'p-4' // 16px padding
  ),
  
  // Individual icon button
  iconButton: cn(
    'w-8 h-8', // 32px display size
    'flex items-center justify-center',
    'transition-all duration-200',
    'hover:scale-110', // Slight scale on hover
    'cursor-pointer'
  ),
  
  // Icon image styling
  iconImage: cn(
    'w-full h-full',
    'object-contain', // Maintain aspect ratio
    'transition-all duration-200'
  ),
  
  // Mobile overlay variant
  mobileOverlay: cn(
    'fixed inset-0 z-50',
    'bg-black bg-opacity-50',
    'flex items-center justify-center',
    'p-4'
  ),
  
  // Mobile panel variant (slides in from right)
  mobilePanel: cn(
    'relative h-full max-w-[200px]',
    'bg-[rgba(0,229,255,0.15)]',
    'flex flex-col items-center justify-center',
    'transform translate-x-full',
    'transition-transform duration-400 ease-in-out',
    'group-hover:translate-x-0'
  ),
}; 

// Modal variants using design tokens
export const modalVariants = {
  // Modal backdrop with design system overlay
  backdrop: cn(
    'absolute inset-0',
    `bg-[${colors.system.pure.blackAlpha}]`,
    'backdrop-blur-sm',
    'transition-opacity duration-300'
  ),
  
  // Enhanced container with cyan glow and subtle gradients (for modal sandbox)
  containerGlow: cn(
    'relative',
    'bg-[rgba(0,229,255,0.05)]',
    `rounded-[${borderRadius.md}]`,
    // Cyan glow matching Figma exactly
    'shadow-[0px_0px_22px_0px_rgba(2,255,251,0.81)]'
  ),
  
  // Container with dual gradient overlay (from Figma)
  containerGradient: cn(
    'relative',
    'bg-[rgba(0,229,255,0.05)]',
    `rounded-[${borderRadius.md}]`,
    // Dual gradient overlay from Figma
    'bg-gradient-to-br from-transparent via-transparent to-[rgba(2,255,251,0.21)]',
    'before:absolute before:inset-0 before:rounded-[11px] before:bg-gradient-to-br before:from-transparent before:via-transparent before:to-[rgba(2,255,251,0.227)] before:opacity-50',
    'shadow-[0px_0px_22px_0px_rgba(2,255,251,0.81)]'
  ),
  
  // Modal container with cyan border and dark background
  container: cn(
    'relative',
    'bg-[rgba(102, 174, 173, 0.15)]', // Dark teal background like sidebar button
    `border border-[${colors.border.secondary}]`, // Cyan border
    `rounded-[${borderRadius.md}]`, // 11px border radius
    'max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto',
    //'shadow-[0px_0px_22px_0px_rgba(0,229,255,0.99),0px_0px_35px_0px_rgba(0,229,255,0.25)]', // Cyan glow effect
    'transition-all duration-300'
  ),
  
  // Modal content area
  content: cn(
    'p-6',
    'bg-[#292929b3]', // Dark background for content
    `text-[${colors.text.primary}]` // Soft white text
  ),
  
  // Poster container used in modal sandbox
  poster: cn(
    'w-[188px] h-[282px]',
    'rounded-[3px] overflow-hidden',
    'bg-black/30',
    // Same subtle glow as trailer
    'shadow-[0px_0px_18px_-2px_rgba(0,229,255,0.75)]'
  ),
  
  // Trailer frame area with subtle glow
  trailerFrame: cn(
    'max-w-[500px]',
    'rounded-[11px] overflow-hidden',
    'bg-black/50',
    'border border-[rgba(244,243,241,0.05)]',
    'shadow-[0px_0px_18px_-2px_rgba(0,229,255,0.75)]'
  ),
  
  // Header row (title + badges)
  headerRow: cn(
    'flex items-center gap-4',
    `text-[${colors.text.accent}]`,
    `font-[${typography.fontWeight.bold}]`,
    `text-[${typography.fontSize.xxl}]`
  ),
  
  // Meta line under trailer
  metaLine: cn(
    'italic text-sm',
    `text-[${colors.text.secondary}]`
  ),
  
  // Right action rail - Updated to match poster hover panel styling
  actionRail: cn(
    'flex flex-col items-center justify-start',
    'py-4', // Wider width for better proportions
    'bg-[rgba(0,229,255,0.15)]', // Same glass-like background as poster panel
    'rounded-tl-[11px] rounded-bl-[11px]', // Rounded left corners only, extend to right edge
    'shadow-[0px_0px_22px_0px_rgba(0,229,255,0.19),0px_0px_35px_0px_rgba(0,229,255,0.25),0px_0px_12px_-4px_rgba(0,229,255,0.99)]' // Same cyan glow as poster panel
  ),
  actionRailSection: cn(
    'flex flex-col items-center text-center gap-1 ', // More padding for better spacing
    `text-[${colors.text.primary}]`
  ),
  actionRailSeparator: cn(
    'w-8 h-px my-2 mx-auto', // Wider separator with auto margins for centering
    'bg-[rgba(0,229,255,0.5)]' // Cyan separator
  ),
  
  // Provider card
  providerCard: cn(
    'mt-3 p-3 w-[160px] min-h-[48px]',
    'bg-[rgba(2,255,251,0.15)]', // Semi-transparent cyan like modal
    'backdrop-blur-sm', // Glass-like effect
    'rounded-[11px]', // Changed from rounded-[${borderRadius.lg}] to rounded-[11px]
    // Same subtle glow as trailer
    'shadow-[0px_0px_18px_-2px_rgba(0,229,255,0.75)]'
  ),
  
  // Close button with design system styling
  closeButton: cn(
    'absolute top-4 right-4 p-2',
    'rounded-full',
    `bg-[${colors.background.secondary}]`,
    `border border-[${colors.border.subtle}]`,
    `text-[${colors.text.primary}]`,
    'hover:bg-[rgba(2,255,251,0.15)]', // Subtle cyan hover
    'focus:outline-none focus:ring-2 focus:ring-[rgba(250,250,250,0.5)] focus:border-[#FAFAFA]',
    'transition-all duration-200'
  ),
  
  // Modal title with design system typography
  title: cn(
    `text-[${typography.fontSize.xxl}] font-[${typography.fontWeight.bold}]`,
    `text-[${colors.text.accent}]`, // Pure white for emphasis
    'mb-4'
  ),
  
  // Modal section headers
  sectionHeader: cn(
    `font-[${typography.fontWeight.medium}]`,
    `text-[${colors.text.primary}]`, // Soft white
    'mb-1'
  ),
  
  // Modal body text
  bodyText: cn(
    `text-[${colors.text.secondary}]`, // Muted text
    `text-[${typography.fontSize.md}]`
  ),
  
  // Modal link styling
  link: cn(
    'inline-flex items-center gap-2',
    `text-[${typography.fontSize.sm}]`,
    `text-[${colors.primary}]`, // Cyan color for links
    `hover:text-[${colors.glow.cyan}]`,
    'transition-colors duration-200'
  ),
  
  // Skeleton loader with design system colors
  skeleton: cn(
    'animate-pulse',
    `bg-[${colors.system.neutral[400]}]`, // Use neutral gray for skeleton
    'rounded'
  ),
  
  // Skeleton text variants
  skeletonTitle: cn(
    'h-8 w-3/4 mb-4',
    `bg-[${colors.system.neutral[400]}]`,
    'rounded'
  ),
  
  skeletonText: cn(
    'h-4 w-full mb-2',
    `bg-[${colors.system.neutral[400]}]`,
    'rounded'
  ),
  
  skeletonShort: cn(
    'h-4 w-2/3 mb-4',
    `bg-[${colors.system.neutral[400]}]`,
    'rounded'
  ),
  
  skeletonChip: cn(
    'h-6 w-24',
    `bg-[${colors.system.neutral[400]}]`,
    'rounded'
  ),
  
  skeletonChipLarge: cn(
    'h-6 w-32',
    `bg-[${colors.system.neutral[400]}]`,
    'rounded'
  ),
  
  // Divider with design system styling
  divider: cn(
    'pt-4 border-t',
    `border-[${colors.border.subtle}]` // Subtle border
  ),
  
  // Info row container
  infoRow: cn(
    'flex gap-6',
    `text-[${colors.text.secondary}]` // Muted text for info
  ),
  
  // Info label styling
  infoLabel: cn(
    `font-[${typography.fontWeight.medium}]`,
    `text-[${colors.text.primary}]` // Soft white for labels
  ),
  
  // Info value styling
  infoValue: cn(
    `text-[${colors.text.secondary}]` // Muted text for values
  ),
}; 