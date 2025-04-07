// components/RecipeList.tsx
import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Recipe } from '@/services/api/recipeGenerationService';
import RecipeCard from './RecipeCard';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import LoadingIndicator from '@/components/common/LoadingIndicator';
import EmptyState from '@/components/common/EmptyState';

interface RecipeListProps {
  recipes: Recipe[];
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  onFavoriteToggle?: (recipe: Recipe) => void;
  isFavorite?: (recipe: Recipe) => boolean;
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
    return <LoadingIndicator message="Finding recipes..." />;
  }

  if (error) {
    return (
      <ErrorDisplay
        title="Failed to load recipes"
        message={error.message}
        onRetry={onRetry}
      />
    );
  }

  if (recipes.length === 0) {
    return (
      <EmptyState
        icon="restaurant-outline"
        title="No Recipes Found"
        message="There are no recipes in this category yet. Generate some recipes or try different ingredients."
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RecipeCard
            recipe={item}
            onFavoriteToggle={onFavoriteToggle}
            isFavorite={isFavorite ? isFavorite(item) : false}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});