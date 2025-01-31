// components/RecipeList.tsx
import React from 'react';
import { View, Text, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';
import { sharedStyles } from '@/styles/sharedStyles';
import { type Recipe } from '@/services/api/recipeGenerationService';
import RecipeCard from './RecipeCard';

interface RecipeListProps {
  recipes: Recipe[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onFavoriteToggle: (recipe: Recipe) => void;
  isFavorite: (recipeId: string) => boolean;
}

export default function RecipeList({
  recipes,
  isLoading,
  error,
  onRetry,
  onFavoriteToggle,
  isFavorite
}: RecipeListProps) {
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>
          Generating recipes...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons 
          name="alert-circle" 
          size={48} 
          color={theme.colors.status.error} 
        />
        <Text style={styles.errorText}>{error}</Text>
        <Pressable 
          style={styles.retryButton}
          onPress={onRetry}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  if (recipes.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons 
          name="restaurant" 
          size={48} 
          color={theme.colors.text.secondary} 
        />
        <Text style={styles.emptyText}>
          Generate your first recipes by selecting your preferences above
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {recipes.map(recipe => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          onFavoriteToggle={onFavoriteToggle}
          isFavorite={isFavorite(recipe.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: theme.spacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
  },
  errorText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    color: theme.colors.background.primary,
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
});