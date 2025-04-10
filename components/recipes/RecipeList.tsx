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
  // Group recipes by their generation batch (using preferences as key)
  const groupedRecipes = recipes.reduce((groups, recipe) => {
    const prefsKey = recipe.generationPreferences ? 
      JSON.stringify(recipe.generationPreferences) : 'unknown';
    if (!groups[prefsKey]) {
      groups[prefsKey] = [];
    }
    groups[prefsKey].push(recipe);
    return groups;
  }, {});

  const renderPreferences = (preferences) => {
    if (!preferences) return null;
    const items = [];
    if (preferences.mealType) items.push(preferences.mealType.replace('-', '/'));
    if (preferences.quickMeals) items.push('Quick Meals');
    if (preferences.useExpiring) items.push('Using Expiring');
    if (preferences.proteinPlus) items.push('High Protein');
    if (preferences.minimalShopping) items.push('Minimal Shopping');
    if (preferences.vegetarian) items.push('Vegetarian');
    if (preferences.healthy) items.push('Healthy');
    return items.join(' • ');
  };

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
    <View>
      {Object.entries(groupedRecipes).map(([prefsKey, groupRecipes]) => (
        <View key={prefsKey} style={styles.recipeGroup}>
          {prefsKey !== 'unknown' && (
            <Text style={styles.preferencesText}>
              {renderPreferences(JSON.parse(prefsKey))}
            </Text>
          )}
          {groupRecipes.map((recipe: Recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onFavoriteToggle={() => onFavoriteToggle(recipe)}
              isFavorite={isFavorite(recipe.id)}
            />
          ))}
        </View>
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
  recipeGroup: {
    marginBottom: theme.spacing.lg,
  },
  preferencesText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    fontStyle: 'italic',
  },
});