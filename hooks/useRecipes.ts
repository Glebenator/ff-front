// hooks/useRecipes.ts
import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GeminiService, type Recipe } from '@/services/api/recipeGenerationService';
import { RecipeMatcherService } from '@/services/recipeMatcherService';
import { useFocusEffect } from '@react-navigation/native';
import { ingredientDb } from '@/services/database/ingredientDb';

const RECENT_RECIPES_STORAGE_KEY = 'fridgefriend_recent_recipes';
const SORT_PREFERENCES_KEY = 'fridgefriend_sort_preferences';

// Define sort options directly in this file
export type SortOption = 'match' | 'alphabetical' | 'date' | 'time' | 'missing';

export interface SortPreferences {
  option: SortOption;
  ascending: boolean;
}

export interface RecipePreferences {
  mealType: 'breakfast' | 'lunch-dinner';
  quickMeals: boolean;
  useExpiring: boolean;
  proteinPlus: boolean;
  minimalShopping: boolean;
  vegetarian: boolean;
  healthy: boolean;
}

export const useRecipes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastIngredientUpdateTime, setLastIngredientUpdateTime] = useState(0);
  
  // Sorting state
  const [sortPreferences, setSortPreferences] = useState<SortPreferences>({
    option: 'match',
    ascending: false
  });

  // Load saved recent recipes on startup
  useEffect(() => {
    const loadRecentRecipes = async () => {
      try {
        const savedRecipes = await AsyncStorage.getItem(RECENT_RECIPES_STORAGE_KEY);
        if (savedRecipes) {
          setRecentRecipes(JSON.parse(savedRecipes));
        }
      } catch (err) {
        console.error('Failed to load recent recipes:', err);
      }
    };

    loadRecentRecipes();
  }, []);

  // Update match percentages whenever recipes are displayed
  useEffect(() => {
    const updateMatchPercentages = async () => {
      if (recipes.length > 0) {
        const updatedRecipes = await RecipeMatcherService.matchRecipes(recipes);
        setRecipes(updatedRecipes);
      }
    };

    updateMatchPercentages();
  }, [recipes.length]);

  // Do the same for recent recipes
  useEffect(() => {
    const updateRecentMatchPercentages = async () => {
      if (recentRecipes.length > 0) {
        const updatedRecentRecipes = await RecipeMatcherService.matchRecipes(recentRecipes);
        setRecentRecipes(updatedRecentRecipes);
      }
    };

    updateRecentMatchPercentages();
  }, [recentRecipes.length]);

  // Save recent recipes whenever they change
  useEffect(() => {
    const saveRecentRecipes = async () => {
      try {
        await AsyncStorage.setItem(RECENT_RECIPES_STORAGE_KEY, JSON.stringify(recentRecipes));
      } catch (err) {
        console.error('Failed to save recent recipes:', err);
      }
    };

    if (recentRecipes.length > 0) {
      saveRecentRecipes();
    }
  }, [recentRecipes]);
  
  // Function to remove a recipe from recent list
  const removeFromRecent = useCallback((recipeId: string) => {
    setRecentRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
  }, []);

  // Load saved sort preferences
  useEffect(() => {
    const loadSortPreferences = async () => {
      try {
        const storedPrefs = await AsyncStorage.getItem(SORT_PREFERENCES_KEY);
        if (storedPrefs) {
          setSortPreferences(JSON.parse(storedPrefs));
        }
      } catch (err) {
        console.error('Failed to load sort preferences:', err);
      }
    };

    loadSortPreferences();
  }, []);

  // Save sort preferences when changed
  useEffect(() => {
    const saveSortPreferences = async () => {
      try {
        await AsyncStorage.setItem(SORT_PREFERENCES_KEY, JSON.stringify(sortPreferences));
      } catch (err) {
        console.error('Failed to save sort preferences:', err);
      }
    };

    saveSortPreferences();
  }, [sortPreferences]);

  // Monitor ingredient database for changes
  useEffect(() => {
    const checkForIngredientChanges = async () => {
      try {
        // Get the latest update timestamp from ingredients
        const ingredients = await ingredientDb.getAll();
        if (ingredients.length === 0) return;
        
        // Find the most recent update time using dateAdded field
        const latestUpdate = Math.max(
          ...ingredients.map(ing => new Date(ing.dateAdded || 0).getTime())
        );
        
        // Only log and refresh if there's an actual change
        if (latestUpdate > lastIngredientUpdateTime) {
          console.log('Ingredient changes detected!', {
            'latest': new Date(latestUpdate).toISOString(),
            'previous': lastIngredientUpdateTime ? new Date(lastIngredientUpdateTime).toISOString() : 'none'
          });
          setLastIngredientUpdateTime(latestUpdate);
          refreshRecipes();
        }
      } catch (err) {
        console.error('Error checking for ingredient changes:', err);
      }
    };

    // Set up polling interval (every 15 seconds is frequent enough)
    const intervalId = setInterval(checkForIngredientChanges, 15000);
    
    // Initial check
    checkForIngredientChanges();
    
    return () => clearInterval(intervalId);
  }, [lastIngredientUpdateTime, refreshRecipes]);

  // Refresh recipe matches every time the screen is focused
  useFocusEffect(
    useCallback(() => {
      // Don't log this, it happens frequently
      refreshRecipes();
    }, [refreshRecipes])
  );

  // Update sort preferences
  const updateSortOption = useCallback((option: SortOption) => {
    setSortPreferences(prev => ({
      ...prev,
      option
    }));
  }, []);

  const toggleSortDirection = useCallback(() => {
    setSortPreferences(prev => ({
      ...prev,
      ascending: !prev.ascending
    }));
  }, []);

  // Apply sorting to recipes
  const sortRecipes = useCallback(
    (recipeList: Recipe[]): Recipe[] => {
      if (!recipeList.length) return recipeList;

      const { option, ascending } = sortPreferences;
      const sorted = [...recipeList];

      const sortFn = (a: Recipe, b: Recipe): number => {
        let comparison = 0;

        switch (option) {
          case 'match':
            comparison = (b.matchPercentage || 0) - (a.matchPercentage || 0);
            break;
          case 'alphabetical':
            comparison = a.title.localeCompare(b.title);
            break;
          case 'date':
            const dateA = a.generationPreferences?.timestamp || 0;
            const dateB = b.generationPreferences?.timestamp || 0;
            comparison = dateB - dateA; // Default newest first
            break;
          case 'time':
            // Extract minutes from "XX mins" format
            const minutesA = parseInt(a.cookingTime.split(' ')[0]) || 0;
            const minutesB = parseInt(b.cookingTime.split(' ')[0]) || 0;
            comparison = minutesA - minutesB; // Default shortest first
            break;
          case 'missing':
            comparison = a.missingIngredients.length - b.missingIngredients.length;
            break;
          default:
            comparison = 0;
        }

        // If ascending is true, flip the comparison
        return ascending ? comparison : -comparison;
      };

      return sorted.sort(sortFn);
    },
    [sortPreferences]
  );

  // Get sorted recipes
  const getSortedRecipes = useCallback(() => {
    return sortRecipes(recipes);
  }, [recipes, sortRecipes]);

  // Get sorted recent recipes
  const getSortedRecentRecipes = useCallback(() => {
    return sortRecipes(recentRecipes);
  }, [recentRecipes, sortRecipes]);

  // Create a function to refresh recipe match percentages
  const refreshRecipes = useCallback(async () => {
    // Only log when manually triggered (not during auto-updates)
    const isManualRefresh = !isRefreshing;
    if (isManualRefresh) {
      console.log('🔄 Starting recipe refresh...');
    }
    
    setIsRefreshing(true);
    try {
      if (recipes.length > 0) {
        if (isManualRefresh) console.log(`Refreshing ${recipes.length} primary recipes`);
        const updatedRecipes = await RecipeMatcherService.refreshRecipeMatches(recipes);
        
        // Create a new array to ensure state update triggers a re-render
        setRecipes(prevRecipes => {
          // For each updated recipe, find and replace the corresponding recipe in the previous state
          const newRecipes = [...prevRecipes];
          updatedRecipes.forEach(updatedRecipe => {
            const index = newRecipes.findIndex(r => r.id === updatedRecipe.id);
            if (index !== -1) {
              newRecipes[index] = updatedRecipe;
            }
          });
          return newRecipes;
        });
      }
      
      if (recentRecipes.length > 0) {
        if (isManualRefresh) console.log(`Refreshing ${recentRecipes.length} recent recipes`);
        const updatedRecentRecipes = await RecipeMatcherService.refreshRecipeMatches(recentRecipes);
        
        // Create a new array to ensure state update triggers a re-render
        setRecentRecipes(prevRecentRecipes => {
          // For each updated recipe, find and replace the corresponding recipe in the previous state
          const newRecentRecipes = [...prevRecentRecipes];
          updatedRecentRecipes.forEach(updatedRecipe => {
            const index = newRecentRecipes.findIndex(r => r.id === updatedRecipe.id);
            if (index !== -1) {
              newRecentRecipes[index] = updatedRecipe;
            }
          });
          return newRecentRecipes;
        });
      }
      if (isManualRefresh) console.log('✅ Recipe refresh completed');
    } catch (err) {
      console.error('❌ Error refreshing recipes:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [recipes, recentRecipes, isRefreshing]);

  const generateRecipes = useCallback(async (preferences: RecipePreferences, options?: { accumulate?: boolean }) => {
    setIsLoading(true);
    setError(null);

    try {
      // Add timestamp to preferences for better organization in RecipeList
      const prefsWithTimestamp = {
        ...preferences,
        timestamp: Date.now(),
      };
      
      const generatedRecipes = await GeminiService.generateRecipes(prefsWithTimestamp);
      
      if (options?.accumulate) {
        // Add new recipes to the existing ones
        setRecipes(prevRecipes => [...generatedRecipes, ...prevRecipes]);
      } else {
        setRecipes(generatedRecipes);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate recipes');
      console.error('Error in generateRecipes:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveToRecent = useCallback(() => {
    setRecentRecipes(prevRecent => {
      // Combine current recipes with recent ones, avoiding duplicates by ID
      const recipeIds = new Set(prevRecent.map(r => r.id));
      const newRecent = [...prevRecent];
      
      recipes.forEach(recipe => {
        if (!recipeIds.has(recipe.id)) {
          newRecent.unshift(recipe);
          recipeIds.add(recipe.id);
        }
      });
      
      return newRecent;
    });
  }, [recipes]);

  return {
    recipes: getSortedRecipes(),
    recentRecipes: getSortedRecentRecipes(),
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
    sortRecipes
  };
};