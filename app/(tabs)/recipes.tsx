import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, ScrollView, Text, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';
import { sharedStyles } from '@/styles/sharedStyles';
import { useRecipes } from '@/hooks/useRecipes';
import { useFavorites } from '@/hooks/useFavorites';
import RecipeList from '@/components/recipes/RecipeList';
import { type RecipePreferences } from '@/hooks/useRecipes';
import PreferencesSection from '@/components/recipes/PreferencesSection';
import { RecipeSortModal, SortButton } from '@/components/recipes/sort';
import { type RecipeSortType } from '@/types/types';
import AnimatedTabNavigation from '@/components/recipes/AnimatedTabNavigation';

export default function RecipeScreen() {
  // Tab state
  const [activeTab, setActiveTab] = useState<'suggested' | 'favorites' | 'recent'>('suggested');
  
  // Sorting state
  const [sortOrder, setSortOrder] = useState<RecipeSortType>('name-asc');
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);
  
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
    refreshRecipes,
    removeFromRecent 
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
    let displayRecipes = [];
    
    switch (activeTab) {
      case 'favorites':
        displayRecipes = favorites || [];
        break;
      case 'suggested':
        displayRecipes = recipes || [];
        break;
      case 'recent':
        displayRecipes = recentRecipes || [];
        break;
      default:
        displayRecipes = [];
    }
    
    // Apply sorting
    return sortRecipes(displayRecipes);
  };
  
  // Sort recipes based on selected sort order
  const sortRecipes = useCallback((recipesToSort) => {
    if (!recipesToSort || recipesToSort.length === 0) return [];
    
    const sortedRecipes = [...recipesToSort];
    
    switch (sortOrder) {
      case 'name-asc':
        sortedRecipes.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'name-desc':
        sortedRecipes.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'date-generated-newest':
        sortedRecipes.sort((a, b) => {
          const dateA = a.generationPreferences?.timestamp ? new Date(a.generationPreferences.timestamp) : new Date(0);
          const dateB = b.generationPreferences?.timestamp ? new Date(b.generationPreferences.timestamp) : new Date(0);
          return dateB.getTime() - dateA.getTime();
        });
        break;
      case 'date-generated-oldest':
        sortedRecipes.sort((a, b) => {
          const dateA = a.generationPreferences?.timestamp ? new Date(a.generationPreferences.timestamp) : new Date(0);
          const dateB = b.generationPreferences?.timestamp ? new Date(b.generationPreferences.timestamp) : new Date(0);
          return dateA.getTime() - dateB.getTime();
        });
        break;
      case 'ingredients-asc':
        sortedRecipes.sort((a, b) => (a.ingredients?.length || 0) - (b.ingredients?.length || 0));
        break;
      case 'ingredients-desc':
        sortedRecipes.sort((a, b) => (b.ingredients?.length || 0) - (a.ingredients?.length || 0));
        break;
    }
    
    return sortedRecipes;
  }, [sortOrder]);

  return (
    <View style={styles.container}>
      <AnimatedTabNavigation activeTab={activeTab} onChangeTab={setActiveTab} />
      
      {getDisplayRecipes().length > 0 && (
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort</Text>
          <View style={styles.sortButtonContainer}>
            <SortButton
              sortOrder={sortOrder}
              onPress={() => setIsSortModalVisible(true)}
            />
          </View>
        </View>
      )}
      
      {isRefreshing && (
        <View style={styles.refreshIndicator}>
          <Text style={styles.refreshText}>Updating recipes with latest ingredients...</Text>
        </View>
      )}

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
            {getDisplayRecipes().length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="heart" size={48} color={theme.colors.text.secondary} />
                <Text style={styles.emptyText}>No favorite recipes yet</Text>
                <Text style={styles.emptySubText}>Heart the recipes you love to save them here</Text>
              </View>
            ) : (
              <RecipeList
                mode="favorites"
                recipes={getDisplayRecipes()}
                isLoading={false}
                error={null}
                onRetry={() => {}}
                onFavoriteToggle={toggleFavorite}
                isFavorite={isFavorite}
                onDeleteRecipe={(recipeId) => toggleFavorite(getDisplayRecipes().find(r => r.id === recipeId))}
              />
            )}
          </View>
        )}

        {activeTab === 'recent' && (
          <View style={styles.recipeListSection}>
            {getDisplayRecipes().length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="time" size={48} color={theme.colors.text.secondary} />
                <Text style={styles.emptyText}>No recent recipes</Text>
                <Text style={styles.emptySubText}>Generate some recipes to see them here</Text>
              </View>
            ) : (
              <RecipeList
                mode="recent"
                recipes={getDisplayRecipes()}
                isLoading={false}
                error={null}
                onRetry={() => {}}
                onFavoriteToggle={toggleFavorite}
                isFavorite={isFavorite}
                onDeleteRecipe={removeFromRecent}
              />
            )}
          </View>
        )}
      </ScrollView>
      
      <RecipeSortModal
        visible={isSortModalVisible}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        onClose={() => setIsSortModalVisible(false)}
      />
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
  refreshIndicator: {
    backgroundColor: 'rgba(83, 209, 129, 0.15)',
    padding: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary,
  },
  refreshText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    minHeight: 300,
  },
  emptyText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  emptySubText: {
    marginTop: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
  },
  sortLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  sortButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },

});