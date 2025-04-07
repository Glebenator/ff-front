// screens/RecipesScreen.tsx
import { useState } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { useRecipes } from '@/hooks/useRecipes';
import { Button } from '@/components/ui/Button';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { RecipePreferencesModal } from '@/components/recipes/RecipePreferencesModal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState } from '@/components/ui/EmptyState';

export function RecipesScreen() {
  const [preferencesVisible, setPreferencesVisible] = useState(false);
  const { recipes, recentRecipes, isLoading, error, generateRecipes } = useRecipes();

  const handleOpenPreferences = () => {
    setPreferencesVisible(true);
  };

  const handleClosePreferences = () => {
    setPreferencesVisible(false);
  };

  const handleGenerateRecipes = (preferences) => {
    generateRecipes(preferences);
    setPreferencesVisible(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Button 
          title="Generate Recipes" 
          onPress={handleOpenPreferences} 
          style={styles.generateButton}
        />

        {isLoading && <LoadingSpinner message="Generating recipes..." />}
        {error && <ErrorMessage message={error} />}

        {/* Current Session Recipes */}
        {recipes.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Current Suggestions" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {recipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} style={styles.recipeCard} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Recent Recipes */}
        {recentRecipes.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Recent Recipes" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {recentRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} style={styles.recipeCard} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Empty state when no recipes */}
        {recipes.length === 0 && recentRecipes.length === 0 && !isLoading && (
          <EmptyState 
            icon="food-variant" 
            title="No Recipes Yet"
            message="Generate recipe suggestions based on your preferences and available ingredients."
          />
        )}
      </ScrollView>

      <RecipePreferencesModal
        visible={preferencesVisible}
        onClose={handleClosePreferences}
        onSubmit={handleGenerateRecipes}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  generateButton: {
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  horizontalScroll: {
    flexGrow: 0,
    marginLeft: -8, // Offset the padding of the first card
  },
  recipeCard: {
    width: 280,
    marginRight: 12,
    marginLeft: 8,
  },
});