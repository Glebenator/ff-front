// Tab style configuration
// This file contains the centralized configuration for tab styles
// Change the default variant here to experiment with different tab styles globally

export type TabVariant = 'pillow' | 'compact' | 'full-width';

// Change this value to experiment with different tab styles across the app
export const DEFAULT_TAB_VARIANT: TabVariant = 'pillow';

// You can also create screen-specific overrides if needed
export const TAB_VARIANTS: Record<string, TabVariant> = {
  recipes: DEFAULT_TAB_VARIANT,
  sessions: DEFAULT_TAB_VARIANT,
  fridge: 'compact', // Fridge uses compact for the expiry filters
};

// Add icons to tabs (optional)
export const TAB_ICONS = {
  // Recipes tabs
  suggested: 'restaurant-outline',
  favorites: 'heart-outline',
  recent: 'time-outline',
  
  // Sessions tabs
  pending: 'hourglass-outline',
  approved: 'checkmark-circle-outline',
  rejected: 'close-circle-outline',
  
  // Fridge tabs
  all: 'grid-outline',
  'expiring-soon': 'warning-outline',
  expired: 'alert-circle-outline',
};
