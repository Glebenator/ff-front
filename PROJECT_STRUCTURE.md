# Project Structure Overview

## Core Application Structure
- `/app`: Main application routes following Expo Router file-based routing
  - `/(tabs)`: Tab-based navigation screens
    - `index.tsx`: Home screen (shows WebLanding or MobileHome based on platform)
    - `fridge.tsx`: Fridge screen for managing ingredients
    - `recipes.tsx`: Recipe discovery and management
    - `sessions.tsx`: Session management for scanning operations
    - `_layout.tsx`: Tab navigation configuration and layout
  - `ingredient.tsx`: Form for adding/editing ingredients
  - `_layout.tsx`: Root layout with shared UI elements and initialization

## Components
- `/components`: Reusable UI components organized by feature
  - `/fridge`: Fridge-related components (CategoryFilters, WebFridge, EmptyStates, FiltersSection)
  - `/ingredient`: Ingredient management components (IngredientCard)
  - `/recipes`: Recipe-related components (RecipeList, RecipeDetailModal, PreferenceGrid)
  - `/sessions`: Session-related components (SessionCard, SessionNotification, SessionItemEditor)
  - `MobileHome.tsx`, `WebLanding.tsx`: Platform-specific home screens
  - `Toast.tsx`: Toast notification component

## Hooks and Services
- `/hooks`: Custom React hooks
  - `useIngredientManagement.ts`: Logic for managing ingredients
  - `useRecipes.ts`: Recipe management and filtering
  - `useSessions.ts`: Session state and management
  - `useFavorites.ts`: Favorite recipe management
- `/services`: Core services and data management
  - `/database`: Database-related services (ingredientDb)
  - `/notifications`: Notification handling (NotificationService)
  - `/mqtt`: Real-time communication (mockMqttService)
  - `sessionManager.ts`: Session management business logic
  - `toastStore.ts`: Toast notification state management

## API and Backend
- `/app/api`: API routes for server-side functionality
  - `route+api.tsx`: Handles POST/GET requests for ingredient operations

## Styling and Types
- `/styles`: Application styling
  - `theme.ts`: Theme definition (colors, spacing, typography)
  - `sharedStyles.ts`: Shared style components
- `/types`: Type definitions
  - `types.ts`: Core type definitions (Ingredient, Filter, Sort)

## Configuration
- `app.json`: Expo configuration
- `eas.json`: EAS Build configuration
- `tsconfig.json`: TypeScript configuration
- `package.json`: Project dependencies and scripts