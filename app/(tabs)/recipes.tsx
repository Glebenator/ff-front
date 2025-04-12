import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, RefreshControl } from 'react-native';
import { theme } from '@/styles/theme';
import { sharedStyles } from '@/styles/sharedStyles';
import { useRecipes } from '@/hooks/useRecipes';
import { useFavorites } from '@/hooks/useFavorites';
import RecipeList from '@/components/recipes/RecipeList';
import { type RecipePreferences } from '@/hooks/useRecipes';
import TabNavigation from '@/components/recipes/TabNavigation';
import PreferencesSection from '@/components/recipes/PreferencesSection';

export default function RecipeScreen() {
  // Tab state
  const [activeTab, setActiveTab] = useState<'suggested' | 'favorites' | 'recent'>('suggested');
  
  // Preferences state
  const [preferences, setPreferences] = useState<RecipePreferences>({
    mealType: 'lunch-dinner',
    quickMeals: false,
    useExpiring: false,
    proteinPlus: false,
    minimalShopping: false,
    vegetarian: false,
    healthy: false
  });

  // Hooks
  const { 
    recipes, 
    recentRecipes, 
    isLoading, 
    isRefreshing,
    error, 
    generateRecipes, 
    saveToRecent,
    refreshRecipes 
  } = useRecipes();
  
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  // Track tab changes to save recipes to recent
  useEffect(() => {
    const prevTab = activeTab;
    return () => {
      if (prevTab === 'suggested' && recipes.length > 0) {
        saveToRecent();
      }
    };
  }, [activeTab, recipes, saveToRecent]);

  // Handlers
  const handlePreferenceSelect = useCallback((key: keyof Omit<RecipePreferences, 'mealType'>) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);

  const handleMealTypeChange = useCallback((type: RecipePreferences['mealType']) => {
    setPreferences(prev => ({
      ...prev,
      mealType: type
    }));
  }, []);

  const handleGenerate = useCallback(async () => {
    try {
      await generateRecipes(preferences, { accumulate: true });
    } catch (err) {
      console.error('Failed to generate recipes:', err);
    }
  }, [generateRecipes, preferences]);
  
  // Handle pull-to-refresh
  const handleRefresh = useCallback(() => {
    refreshRecipes();
  }, [refreshRecipes]);

  // Get recipes based on active tab
  const getDisplayRecipes = () => {
    switch (activeTab) {
      case 'favorites':
        return favorites || [];
      case 'suggested':
        return recipes || [];
      case 'recent':
        return recentRecipes || [];
      default:
        return [];
    }
  };

  return (
    <View style={styles.container}>
      <TabNavigation 
        activeTab={activeTab} 
        onChangeTab={setActiveTab} 
      />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {activeTab === 'suggested' && (
          <>
            <PreferencesSection 
              preferences={preferences}
              isLoading={isLoading}
              onMealTypeChange={handleMealTypeChange}
              onPreferenceSelect={handlePreferenceSelect}
              onGenerateRecipes={handleGenerate}
            />

            <View style={styles.recipeListSection}>
              <Text style={[sharedStyles.subtitle as any, styles.recipeListHeader]}>
                {getDisplayRecipes().length > 0 ? 'Available Recipes' : 'No Recipes Generated Yet'}
              </Text>
              <RecipeList
                recipes={getDisplayRecipes()}
                isLoading={isLoading}
                error={error}
                onRetry={handleGenerate}
                onFavoriteToggle={toggleFavorite}
                isFavorite={isFavorite}
              />
            </View>
          </>
        )}

        {activeTab === 'favorites' && (
          <View style={styles.recipeListSection}>
            <RecipeList
              recipes={getDisplayRecipes()}
              isLoading={false}
              error={null}
              onRetry={() => {}}
              onFavoriteToggle={toggleFavorite}
              isFavorite={isFavorite}
            />
          </View>
        )}

        {activeTab === 'recent' && (
          <View style={styles.recipeListSection}>
            <RecipeList
              recipes={getDisplayRecipes()}
              isLoading={false}
              error={null}
              onRetry={() => {}}
              onFavoriteToggle={toggleFavorite}
              isFavorite={isFavorite}
              mode="recent"
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
  },
  recipeListSection: {
    flex: 1,
    padding: theme.spacing.md,
  },
  recipeListHeader: {
    marginBottom: theme.spacing.md,
  },
});