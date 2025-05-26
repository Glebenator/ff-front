# Tab Navigation Styles

This document explains how to customize the tab navigation styles across the FridgeFinder app.

## Overview

We've implemented a shared `TabNavigation` component that provides consistent tab navigation across all screens. The component supports three different style variants:

1. **Pillow** - Tabs with a rounded background container, active tab has a filled background
2. **Compact** - Individual pill-shaped tabs with spacing between them
3. **Full-width** - Tabs that stretch to fill the container width equally

## Configuration

All tab style configuration is centralized in `/config/tabStyles.ts`.

### Changing Tab Styles Globally

To experiment with different tab styles across the entire app, modify the `DEFAULT_TAB_VARIANT` in `/config/tabStyles.ts`:

```typescript
// Change this to 'compact' or 'full-width' to experiment
export const DEFAULT_TAB_VARIANT: TabVariant = 'pillow';
```

### Changing Tab Styles Per Screen

You can override the default style for specific screens by modifying the `TAB_VARIANTS` object:

```typescript
export const TAB_VARIANTS: Record<string, TabVariant> = {
  recipes: 'pillow',      // Recipes screen uses pillow style
  sessions: 'compact',    // Sessions screen uses compact style
  fridge: 'full-width',   // Fridge filters use full-width style
};
```

### Adding/Removing Icons

Tab icons are configured in the `TAB_ICONS` object. You can add, remove, or change icons by updating this configuration:

```typescript
export const TAB_ICONS = {
  // Recipe tabs
  suggested: 'restaurant-outline',  // Change to any Ionicons icon name
  favorites: 'heart-outline',
  recent: 'time-outline',
  // ... more icons
};
```

To remove icons entirely, simply remove the `icon` property when defining tabs in the component.

## Component Usage

The shared `TabNavigation` component is used in:

- **Recipes Screen** (`/app/(tabs)/recipes.tsx`) - For switching between Suggested, Favorites, and Recent recipes
- **Sessions Screen** (`/app/(tabs)/sessions.tsx`) - For filtering between Pending, Approved, and Rejected sessions
- **Fridge Screen** (`/components/fridge/FiltersSection.tsx`) - For filtering between All Items, Expiring Soon, and Expired items

## Customization Examples

### Example 1: Use Compact Style Everywhere

```typescript
export const DEFAULT_TAB_VARIANT: TabVariant = 'compact';
```

### Example 2: Mix Different Styles

```typescript
export const TAB_VARIANTS: Record<string, TabVariant> = {
  recipes: 'full-width',
  sessions: 'pillow',
  fridge: 'compact',
};
```

### Example 3: Remove Icons from Specific Tabs

In the component file, remove the `icon` property:

```typescript
<SharedTabNavigation 
  tabs={[
    { id: 'suggested', label: 'Suggested' },  // No icon property
    { id: 'favorites', label: 'Favorites', icon: TAB_ICONS.favorites as any },  // Has icon
    { id: 'recent', label: 'Recent', icon: TAB_ICONS.recent as any }
  ]}
  // ... other props
/>
```

## Visual Differences

- **Pillow Style**: Best for primary navigation, provides clear visual grouping
- **Compact Style**: Good for filters or secondary navigation, saves space
- **Full-width Style**: Ideal when you want tabs to be more prominent and evenly distributed

## Advanced Customization

To add new variants or modify existing ones, edit the `SharedTabNavigation` component in `/components/shared/TabNavigation.tsx`. Look for the `getContainerStyle` and `getTabStyle` functions to add new variants.
