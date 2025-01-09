// styles/theme.ts

export const theme = {
    colors: {
      // Primary colors
      primary: 'rgb(99, 207, 139)',  // The green color used throughout the app
      
      // Background colors
      background: {
        primary: 'rgb(36, 32, 28)',   // Main dark background
        secondary: 'rgb(48, 44, 40)',  // Slightly lighter background for cards
        tertiary: 'rgb(42, 38, 36)',   // Used in ingredient cards
      },
      
      // Text colors
      text: {
        primary: 'rgb(247, 233, 233)',   // Main text color
        secondary: 'rgb(180, 180, 180)',  // Secondary text color
        tertiary: 'rgb(140, 140, 140)',   // Less prominent text
      },
      
      // Status colors
      status: {
        error: 'rgb(180, 32, 32)',    // Red for delete buttons
        warning: '#ffaa33',           // Orange for warnings
        success: 'rgb(99, 207, 139)', // Green for success
        danger: '#ff4444',            // Red for urgent/expired
      },
      
      // Border colors
      border: {
        primary: 'rgb(60, 56, 52)',   // Border color used in the app
      }
    },
    
    // You can add other theme properties here
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    
    borderRadius: {
      sm: 8,
      md: 16,
      lg: 20,
    },
    
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 32,
      hero: 40,
    }
  } as const;
  
  // Type helpers
  export type ThemeColors = typeof theme.colors;
  export type ThemeSpacing = typeof theme.spacing;
  export type ThemeBorderRadius = typeof theme.borderRadius;
  export type ThemeFontSize = typeof theme.fontSize;
  
  // Export a helper to use the theme
  export const useTheme = () => theme;