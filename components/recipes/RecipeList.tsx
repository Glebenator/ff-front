// components/RecipeList.tsx
import React from 'react';
import { View, Text, ActivityIndicator, Pressable, StyleSheet, Alert } from 'react-native';
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
  mode?: 'default' | 'recent' | 'favorites';
  onDeleteRecipe?: (recipeId: string) => void;
}

export default function RecipeList({
  recipes,
  isLoading,
  error,
  onRetry,
  onFavoriteToggle,
  isFavorite,
  mode = 'default',
  onDeleteRecipe
}: RecipeListProps) {
  const groupRecipes = () => {
    if (mode === 'recent') {
      // Group by date added
      const groups = {};
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);

      recipes.forEach(recipe => {
        const recipeDate = new Date(recipe.generationPreferences?.timestamp || Date.now());
        let groupKey;

        if (recipeDate >= today) {
          groupKey = 'Today';
        } else if (recipeDate >= yesterday) {
          groupKey = 'Yesterday';
        } else if (recipeDate >= lastWeek) {
          groupKey = 'Last 7 Days';
        } else {
          groupKey = 'Older';
        }

        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(recipe);
      });

      return groups;
    } else {
      // Group by preferences, safely handle JSON parsing
      return recipes.reduce((groups, recipe) => {
        let prefsKey;
        try {
          prefsKey = recipe.generationPreferences ? 
            JSON.stringify(recipe.generationPreferences) : 'unknown';
        } catch (error) {
          prefsKey = 'unknown';
          console.warn('Failed to stringify preferences:', error);
        }
        
        if (!groups[prefsKey]) {
          groups[prefsKey] = [];
        }
        groups[prefsKey].push(recipe);
        return groups;
      }, {});
    }
  };

  const renderPreferences = (prefsString) => {
    if (!prefsString || prefsString === 'unknown') return 'No preferences';
    
    let preferences;
    try {
      preferences = JSON.parse(prefsString);
    } catch (error) {
      console.warn('Failed to parse preferences:', error);
      return 'Invalid preferences';
    }

    if (!preferences) return null;
    const items = [];
    if (preferences.mealType) items.push(preferences.mealType.replace('-', '/'));
    if (preferences.quickMeals) items.push('Quick Meals');
    if (preferences.useExpiring) items.push('Using Expiring');
    if (preferences.proteinPlus) items.push('High Protein');
    if (preferences.minimalShopping) items.push('Minimal Shopping');
    if (preferences.vegetarian) items.push('Vegetarian');
    if (preferences.healthy) items.push('Healthy');
    return items.join(' • ') || 'No preferences';
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

  const groupedRecipes = groupRecipes();

  return (
    <View>
      {Object.entries(groupedRecipes).map(([groupKey, groupRecipes]) => (
        <View key={groupKey} style={styles.recipeGroup}>
          <Text style={[
            styles.groupHeader,
            mode === 'recent' && styles.dateHeader
          ]}>
            {mode === 'recent' ? groupKey : renderPreferences(groupKey)}
          </Text>
          {(groupRecipes as Recipe[]).map((recipe: Recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onFavoriteToggle={onFavoriteToggle}
              isFavorite={isFavorite(recipe.id)}
              compact={mode === 'recent'}
              allowDelete={mode === 'recent' || mode === 'favorites'}
              onDelete={onDeleteRecipe ? 
                () => {
                  Alert.alert(
                    'Remove Recipe',
                    `Are you sure you want to remove "${recipe.title}" from your ${mode === 'recent' ? 'recent recipes' : 'favorites'}?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Remove', 
                        onPress: () => onDeleteRecipe(recipe.id),
                        style: 'destructive' 
                      },
                    ]
                  );
                } : undefined
              }
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
  groupHeader: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    fontStyle: 'italic',
  },
  dateHeader: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontStyle: 'normal',
  },
});