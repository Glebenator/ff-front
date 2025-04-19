// /home/coolcake/myworkspace/fridgefriend/ff/app/(tabs)/recipes.tsx
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, ScrollView, Text, StyleSheet, RefreshControl, Pressable, Alert } from 'react-native'; // Added Alert
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';
import { sharedStyles } from '@/styles/sharedStyles';
import { useRecipes } from '@/hooks/useRecipes';
import { useFavorites } from '@/hooks/useFavorites';
import RecipeList from '@/components/recipes/RecipeList';
import { type RecipePreferences, type Recipe } from '@/hooks/useRecipes'; // Import Recipe type
import PreferencesSection from '@/components/recipes/PreferencesSection';
import { RecipeSortModal, SortButton } from '@/components/recipes/sort';
import { type RecipeSortType } from '@/types/types';
import AnimatedTabNavigation from '@/components/recipes/AnimatedTabNavigation';

export default function RecipeScreen() {
  // Tab state
  const [activeTab, setActiveTab] = useState<'suggested' | 'favorites' | 'recent'>('suggested');
  const [previousTab, setPreviousTab] = useState<'suggested' | 'favorites' | 'recent'>('suggested');

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
    refreshRecipes,
    removeFromRecent,
    addSingleRecent
  } = useRecipes();

  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  // Track tab changes to trigger refreshes
  useEffect(() => {
    if (activeTab !== previousTab) {
      // Tab has changed, refresh data for the new active tab
      console.log(`Tab changed from ${previousTab} to ${activeTab} - refreshing data`);

      if (activeTab === 'favorites' || activeTab === 'recent') {
        // Refresh the data for favorites or recent tabs
        refreshRecipes(false); // Pass false to not log as manual refresh
      }

      setPreviousTab(activeTab);
    }
  }, [activeTab, previousTab, refreshRecipes]);

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

  // Handle deleting a recipe (from favorites or recent)
  const handleDeleteRecipe = useCallback((recipe: Recipe) => {
    if (!recipe) return;

    const listName = activeTab === 'favorites' ? 'favorites' : 'recent recipes';
    const deleteAction = activeTab === 'favorites' ? toggleFavorite : removeFromRecent;
    const recipeId = recipe.id;

    Alert.alert(
      `Remove Recipe`,
      `Are you sure you want to remove "${recipe.title}" from your ${listName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          onPress: () => {
            if (activeTab === 'favorites') {
              deleteAction(recipe); // toggleFavorite needs the full recipe object
            } else {
              deleteAction(recipeId); // removeFromRecent needs the ID
            }
            console.log(`Removed ${recipeId} from ${listName}`);
          },
          style: 'destructive'
        },
      ]
    );
  }, [activeTab, toggleFavorite, removeFromRecent]);


  // Sort recipes based on selected sort order
  const sortRecipes = useCallback((recipesToSort: Recipe[]): Recipe[] => {
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
        // Sort by timestamp, handling potentially missing timestamps
        sortedRecipes.sort((a, b) => {
          const timeA = a.generationPreferences?.timestamp ?? 0;
          const timeB = b.generationPreferences?.timestamp ?? 0;
          return timeB - timeA;
        });
        break;
      case 'date-generated-oldest':
        sortedRecipes.sort((a, b) => {
          const timeA = a.generationPreferences?.timestamp ?? 0;
          const timeB = b.generationPreferences?.timestamp ?? 0;
          return timeA - timeB;
        });
        break;
      case 'ingredients-asc':
        // Sort by total ingredients (matching + missing)
        sortedRecipes.sort((a, b) =>
          (a.matchingIngredients.length + a.missingIngredients.length) -
          (b.matchingIngredients.length + b.missingIngredients.length)
        );
        break;
      case 'ingredients-desc':
        sortedRecipes.sort((a, b) =>
          (b.matchingIngredients.length + b.missingIngredients.length) -
          (a.matchingIngredients.length + a.missingIngredients.length)
        );
        break;
    }

    return sortedRecipes;
  }, [sortOrder]);

  // Get recipes based on active tab and apply sorting
  const displayRecipes = useMemo(() => {
    let recipesToDisplay: Recipe[] = [];
    switch (activeTab) {
      case 'favorites':
        recipesToDisplay = favorites || [];
        break;
      case 'suggested':
        recipesToDisplay = recipes || [];
        break;
      case 'recent':
        recipesToDisplay = recentRecipes || [];
        break;
    }
    return sortRecipes(recipesToDisplay);
  }, [activeTab, favorites, recipes, recentRecipes, sortRecipes]);


  return (
    <View style={styles.container}>
      <AnimatedTabNavigation activeTab={activeTab} onChangeTab={setActiveTab} />

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
              <View style={styles.recipeListHeader}>
              <Text style={sharedStyles.subtitle as any}>
                {displayRecipes.length > 0 ? 'Available Recipes' : 'No Recipes Generated Yet'}
              </Text>
              <SortButton
                sortOrder={sortOrder}
                onPress={() => setIsSortModalVisible(true)}
              />
            </View>
              <RecipeList
                recipes={displayRecipes}
                isLoading={isLoading && displayRecipes.length === 0} // Show loading only if list is empty
                error={error}
                onRetry={handleGenerate}
                onFavoriteToggle={toggleFavorite}
                isFavorite={isFavorite}
                onAddToRecent={addSingleRecent} // Pass the hook function
              />
            </View>
          </>
        )}

        {activeTab === 'favorites' && (
          <View style={styles.recipeListSection}>
            {displayRecipes.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="heart" size={48} color={theme.colors.text.secondary} />
                <Text style={styles.emptyText}>No favorite recipes yet</Text>
                <Text style={styles.emptySubText}>Heart the recipes you love to save them here</Text>
                {/* <Text style={styles.debugText}>Favorites count: {favorites?.length || 0}</Text> */}
              </View>
            ) : (
              <>
                <View style={styles.recipeListHeader}>
                  <Text style={sharedStyles.subtitle as any}>Favorites ({displayRecipes.length})</Text>
                  <SortButton
                    sortOrder={sortOrder}
                    onPress={() => setIsSortModalVisible(true)}
                  />
                </View>
                <RecipeList
                  mode="favorites"
                  recipes={displayRecipes}
                  isLoading={false} // Favorites loading is handled by useFavorites hook
                  error={null}
                  onRetry={() => {}} // No retry needed here
                  onFavoriteToggle={toggleFavorite}
                  isFavorite={isFavorite}
                  onDeleteRecipe={handleDeleteRecipe} // Use centralized delete handler
                  onAddToRecent={addSingleRecent} // Pass the hook function
                />
              </>
            )}
          </View>
        )}

        {activeTab === 'recent' && (
          <View style={styles.recipeListSection}>
            {displayRecipes.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="time" size={48} color={theme.colors.text.secondary} />
                <Text style={styles.emptyText}>No recent recipes</Text>
                <Text style={styles.emptySubText}>Generate or view recipes to see them here</Text>
                {/* <Text style={styles.debugText}>Recent count: {recentRecipes?.length || 0}</Text> */}
              </View>
            ) : (
              <>
                <View style={styles.recipeListHeader}>
                  <Text style={sharedStyles.subtitle as any}>Recent Recipes ({displayRecipes.length})</Text>
                  <SortButton
                    sortOrder={sortOrder}
                    onPress={() => setIsSortModalVisible(true)}
                  />
                </View>
                <RecipeList
                  mode="recent"
                  recipes={displayRecipes}
                  isLoading={false} // Recent loading is handled by useRecipes hook
                  error={null}
                  onRetry={() => {}} // No retry needed here
                  onFavoriteToggle={toggleFavorite}
                  isFavorite={isFavorite}
                  onDeleteRecipe={handleDeleteRecipe} // Use centralized delete handler
                  onAddToRecent={addSingleRecent} // Pass the hook function
                />
              </>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    minHeight: 300, // Ensure empty state takes up space
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
  debugText: {
    marginTop: theme.spacing.sm,
    fontSize: theme.fontSize.sm,
    color: 'gray',
    fontFamily: 'monospace',
  },
});
