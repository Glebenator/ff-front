import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, Alert, RefreshControl, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';
import { sharedStyles } from '@/styles/sharedStyles';
import { useRecipes } from '@/hooks/useRecipes';
import { useFavorites } from '@/hooks/useFavorites';
import RecipeList from '@/components/recipes/RecipeList';
import { type RecipePreferences } from '@/hooks/useRecipes';
import TabNavigation from '@/components/recipes/TabNavigation';
import PreferencesSection from '@/components/recipes/PreferencesSection';
import RecipeSortModal from '@/components/recipes/RecipeSortModal';

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

  // Sort modal state
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);

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
    removeFromRecent,
    // Sorting
    sortPreferences,
    updateSortOption,
    toggleSortDirection,
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
              <View style={styles.recipesHeader}>
                <Text style={[sharedStyles.subtitle as any, styles.recipeListHeader]}>
                  {getDisplayRecipes().length > 0 ? 'Available Recipes' : 'No Recipes Generated Yet'}
                </Text>
                
                {getDisplayRecipes().length > 0 && (
                  <Pressable 
                    style={styles.sortButton}
                    onPress={() => setIsSortModalVisible(true)}
                  >
                    <Ionicons name="funnel-outline" size={18} color={theme.colors.primary} />
                    <Text style={styles.sortButtonText}>Sort</Text>
                  </Pressable>
                )}
              </View>
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
              <>
                <View style={styles.recipesHeader}>
                  <Text style={styles.sectionTitle}>Favorites</Text>
                  <Pressable 
                    style={styles.sortButton}
                    onPress={() => setIsSortModalVisible(true)}
                  >
                    <Ionicons name="funnel-outline" size={18} color={theme.colors.primary} />
                    <Text style={styles.sortButtonText}>Sort</Text>
                  </Pressable>
                </View>
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
              </>
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
              <>
                <View style={styles.recipesHeader}>
                  <Text style={styles.sectionTitle}>Recent Recipes</Text>
                  <Pressable 
                    style={styles.sortButton}
                    onPress={() => setIsSortModalVisible(true)}
                  >
                    <Ionicons name="funnel-outline" size={18} color={theme.colors.primary} />
                    <Text style={styles.sortButtonText}>Sort</Text>
                  </Pressable>
                </View>
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
              </>
            )}
          </View>
        )}
      </ScrollView>
      
      <RecipeSortModal
        visible={isSortModalVisible}
        sortOption={sortPreferences.option}
        ascending={sortPreferences.ascending}
        onSortChange={updateSortOption}
        onDirectionChange={toggleSortDirection}
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
  recipesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(83, 209, 129, 0.15)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  sortButtonText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
});