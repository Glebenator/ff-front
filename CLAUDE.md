# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `npm start` - Start Expo development server with tunneling
- `npm run ios` - Run on iOS simulator  
- `npm run android` - Run on Android emulator
- `npm run web` - Run in web browser (limited functionality)
- `npm run lint` - Run linting
- `npm test` - Run tests with Jest in watch mode

### Platform Testing
Test on multiple platforms since the app uses platform-specific features:
- Mobile: Full SQLite database functionality
- Web: Mock database (throws errors for DB operations)

## Architecture Overview

### App Structure
- **Expo Router**: File-based routing with `app/` directory
- **Tab Navigation**: Main tabs in `app/(tabs)/` - Home, Fridge, Sessions, Recipes, MQTT
- **Root Layout**: `app/_layout.tsx` handles global providers and notifications
- **Platform Support**: iOS, Android, and limited web functionality

### Data Layer
- **SQLite Database**: Primary storage on mobile (`services/database/ingredientDb.ts`)
- **AsyncStorage**: User preferences and session data
- **Platform Branching**: Different implementations for web vs native platforms

### Service Architecture
- **SessionManager**: Central singleton managing MQTT sessions and ingredient workflows
- **MqttService**: Real-time communication with Raspberry Pi for ingredient scanning
- **NotificationService**: Expiry alerts and system notifications
- **Database Services**: Ingredient and recipe data management

### State Management Pattern
Uses custom hooks that wrap singleton services:
- `useIngredientManagement()` - Ingredient CRUD with notifications
- `useSessions()` - MQTT session management  
- `useRecipes()` - Recipe generation and favorites
- `useFavorites()` - Recipe favoriting system

### Key Workflows
1. **Ingredient Scanning**: MQTT → SessionManager → Database → Notifications
2. **Session Approval**: User edits detected items → Batch database operations
3. **Recipe Generation**: Ingredients → AI service → Recipe suggestions
4. **Expiry Management**: Database queries → Notifications → UI alerts

### Theme System
Centralized theme in `styles/theme.ts` with:
- Dark mode design with green accent (`rgb(83, 209, 129)`)
- Consistent spacing, colors, and typography
- Platform-specific adaptations

### Component Organization
- `components/` - Organized by feature (fridge, recipes, sessions, etc.)
- Shared components in `components/shared/`
- Platform-specific rendering where needed

### Type Safety
- Central types in `types/types.ts` and `types/session.ts`
- Strict TypeScript configuration
- Interface-driven development

## Platform Considerations

### Mobile vs Web
- Database operations only work on mobile platforms
- MQTT connectivity requires native platform
- Notifications are mobile-only
- Web platform provides limited preview functionality

### File Paths
Always use absolute imports with `@/` alias pointing to project root.

## Testing Strategy

Check existing test patterns in the codebase before adding new tests. The project uses Jest with Expo preset.