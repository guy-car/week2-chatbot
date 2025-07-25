// Design tokens extracted from Figma design
// These represent the centralized design system values

export const colors = {
  // Primary brand colors
  primary: '#00E5FF',      // Cyan - main accent color
  secondary: '#FD8E2C',    // Orange - secondary accent
  
  // Background colors
  background: {
    main: '#0A0A0B',       // Main dark background for the whole website, must use this unless otherwise specified
    secondary: 'rgb(35, 35, 35)',   // for chat window and input fields (rgb(35, 35, 35) in hex)
    secondaryRgb: '74, 16, 16', // RGB values for transparency variations
    chip: 'rgba(2,255,251,0.07)',    // Chip background
  },
  
  // Text colors
  text: {
    primary: '#FAFAFA',    // Primary text (soft white)
    secondary: '#E5E5E5',  // Secondary text (muted)
    accent: '#FFFFFF',     // Pure white for emphasis
    muted: '#A1A1A1',     // Subtle text
  },
  
  // Border colors
  border: {
    primary: '#FD8E2C',    // Orange border
    secondary: 'rgba(0,229,255,0.99)', // Cyan border
    subtle: 'rgba(244,243,241,0.05)',  // Subtle border
  },
  
  // Glow colors
  glow: {
    cyan: 'rgba(0,229,255,0.99)',     // Cyan glow
    orange: '#FD8E2C',                 // Orange glow
    gold: '#FD8E2C',                   // Changed from gold to orange for consistency
  },

  // Focus colors
  focus: {
    primary: '#FAFAFA',               // Primary focus color (soft white)
    ring: 'rgba(250, 250, 250, 0.5)', // Focus ring with opacity
    orange: '#FD8E2C',                // Orange focus for inputs
    orangeRing: 'rgba(253, 142, 44, 0.3)', // Orange focus ring
  },

  // Hover colors
  hover: {
    primary: 'rgba(253, 142, 44, 0.1)',    // Orange hover background
    chip: 'rgba(2,255,251,0.15)',          // Chip hover background
    button: 'rgba(74, 16, 16, 0.8)',       // Button hover (secondary with transparency)
    genie: 'rgba(253, 142, 44, 0.5)',      // More visible orange hover for Ask the Genie button
  },

  // System colors for UI states and utilities
  system: {
    // Error states - used in chat error messages, form validation
    error: '#ef4444',           // red-500 - error buttons, destructive actions
    errorLight: '#fef2f2',      // red-50 - error message backgrounds  
    errorBorder: '#fecaca',     // red-200 - error message borders
    errorText: '#b91c1c',       // red-700 - error message text
    errorHover: '#dc2626',      // red-600 - error button hover

    // Neutral grays - used for loading states, placeholders, disabled states
    neutral: {
      50: '#f9fafb',            // gray-50 - lightest backgrounds
      100: '#f3f4f6',           // gray-100 - light backgrounds, button hover
      200: '#e5e7eb',           // gray-200 - skeleton loading, disabled backgrounds
      300: '#d1d5db',           // gray-300 - borders, dividers
      400: '#9ca3af',           // gray-400 - disabled buttons, placeholder text
      500: '#6b7280',           // gray-500 - muted text, disabled buttons
      600: '#4b5563',           // gray-600 - secondary text
      700: '#374151',           // gray-700 - form labels, darker text
    },

    // Pure colors - used for overlays, icons, contrast
    pure: {
      white: '#ffffff',         // white - icons, modal backgrounds, button text
      black: '#000000',         // black - overlays, high contrast text
      blackAlpha: 'rgba(0, 0, 0, 0.5)', // black/50 - modal overlays, semi-transparent backgrounds
    }
  }
};

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
};

export const borderRadius = {
  sm: '3px',
  md: '11px',
  lg: '20px',
  full: '50%',
};

export const shadows = {
  // Glow effects
  glowCyan: '0px 0px 22px 0px rgba(0,229,255,0.99), 0px 0px 35px 0px rgba(0,229,255,0.25), 0px 0px 12px -4px rgba(0,229,255,0.99)',
  glowOrange: '0px 0px 18px -2px #fd8e2c, 0px 0px 22px -4px #fd8e2c',
  glowGold: '0px 0px 22px 0px rgba(2,255,251,0.99)',
  
  // Standard shadows
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
};

export const typography = {
  fontFamily: {
    primary: 'Noto Sans, sans-serif',
    display: 'Noto Sans Display, sans-serif',
  },
  
  fontSize: {
    xs: '14px',
    sm: '15px',
    md: '16px',
    lg: '18px',
    xl: '21px',
    xxl: '24px',
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    bold: '700',
  },
  
  lineHeight: {
    tight: '1.2',
    normal: '1.5',
    relaxed: '1.8',
  },
};

export const layout = {
  // Component dimensions
  sidebar: {
    width: '293px',
    height: '817px',
  },
  
  header: {
    height: '123px',
  },
  
  chat: {
    height: '358px',
    width: '831px',
  },
  
  movieCard: {
    width: '141px',
    height: '212px',
  },
  
  button: {
    height: '40px',
    heightLarge: '51px',
  },
  
  chip: {
    height: '40px',
  },
};

 