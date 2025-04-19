// hooks/useRecipes.ts
import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GeminiService, type Recipe } from '@/services/api/recipeGenerationService';
import { RecipeMatcherService } from '@/services/recipeMatcherService';
import { useFocusEffect } from '@react-navigation/native';
import { ingredientDb } from '@/services/database/ingredientDb';

const RECENT_RECIPES_STORAGE_KEY = 'fridgefriend_recent_recipes'; // Standard key
const MAX_RECENT_RECIPES = 20; // Define max size

export interface RecipePreferences {
  mealType: 'breakfast' | 'lunch-dinner';
  quickMeals: boolean;
  useExpiring: boolean;
  proteinPlus: boolean;
  minimalShopping: boolean;
  vegetarian: boolean;
  healthy: boolean;
  // Add timestamp for grouping in RecipeList
  timestamp?: number;
}

export const useRecipes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastIngredientUpdateTime, setLastIngredientUpdateTime] = useState(0);

  // Load saved recent recipes on startup
  useEffect(() => {
    const loadRecentRecipes = async () => {
      try {
        const savedRecipes = await AsyncStorage.getItem(RECENT_RECIPES_STORAGE_KEY);
        if (savedRecipes) {
          const parsedRecipes = JSON.parse(savedRecipes);
          // Ensure loaded recipes have necessary fields if needed later
          setRecentRecipes(parsedRecipes);
          console.log(`Loaded ${parsedRecipes.length} recent recipes.`);
        }
      } catch (err) {
        console.error('Failed to load recent recipes:', err);
        // Optionally clear corrupted storage
        // await AsyncStorage.removeItem(RECENT_RECIPES_STORAGE_KEY);
      }
    };

    loadRecentRecipes();
  }, []);

  // Update match percentages whenever recipes are displayed
  // Debounce or optimize this if it causes performance issues
  useEffect(() => {
    const updateMatchPercentages = async () => {
      if (recipes.length > 0) {
        // console.log('Updating match percentages for generated recipes');
        const updatedRecipes = await RecipeMatcherService.matchRecipes(recipes);
        setRecipes(updatedRecipes);
      }
    };
    updateMatchPercentages();
    // Dependency array includes recipes length to trigger on initial load/generation
  }, [recipes.length]);

  // Do the same for recent recipes
  useEffect(() => {
    const updateRecentMatchPercentages = async () => {
      if (recentRecipes.length > 0) {
        // console.log('Updating match percentages for recent recipes');
        const updatedRecentRecipes = await RecipeMatcherService.matchRecipes(recentRecipes);
        setRecentRecipes(updatedRecentRecipes);
      }
    };
    updateRecentMatchPercentages();
    // Dependency array includes recentRecipes length to trigger when recents change
  }, [recentRecipes.length]);


  // Save recent recipes whenever they change
  useEffect(() => {
    const saveRecentRecipes = async () => {
      try {
        // Only save if there are recipes to save, prevents saving empty array unnecessarily on init
        // Check if recentRecipes actually changed before saving
        const storedRecents = await AsyncStorage.getItem(RECENT_RECIPES_STORAGE_KEY);
        const currentRecentsString = JSON.stringify(recentRecipes);

        if (storedRecents !== currentRecentsString) {
           console.log('Saving recent recipes to storage:', recentRecipes.length);
           await AsyncStorage.setItem(RECENT_RECIPES_STORAGE_KEY, currentRecentsString);
        }
      } catch (err) {
        console.error('Failed to save recent recipes:', err);
      }
    };
    // Call save function, could be debounced if updates are too frequent
    saveRecentRecipes();
  }, [recentRecipes]); // Trigger save whenever recentRecipes state changes

  // Function to add a SINGLE recipe to the recent list
  const addSingleRecent = useCallback((recipe: Recipe | null) => {
    if (!recipe) return;

    setRecentRecipes(prevRecent => {
      console.log('HOOK: Adding single recipe to recents:', recipe.id);
      // Check if recipe already exists
      const existingIndex = prevRecent.findIndex(r => r.id === recipe.id);

      let newRecent = [...prevRecent];

      // Remove if exists to move it to the front
      if (existingIndex !== -1) {
        newRecent.splice(existingIndex, 1);
      }

      // Add to front
      newRecent.unshift(recipe);
      console.log('HOOK: New recents count after adding single:', newRecent.length);

      // Keep only MAX_RECENT_RECIPES most recent
      if (newRecent.length > MAX_RECENT_RECIPES) {
        newRecent = newRecent.slice(0, MAX_RECENT_RECIPES);
      }

      return newRecent; // The useEffect watching recentRecipes will save this
    });
  }, []); // No dependencies needed as it only uses setRecentRecipes

  // Function to remove a recipe from recent list
  const removeFromRecent = useCallback((recipeId: string) => {
    setRecentRecipes(prev => {
        const updatedRecents = prev.filter(recipe => recipe.id !== recipeId);
        console.log(`HOOK: Removed recipe ${recipeId} from recents. New count: ${updatedRecents.length}`);
        return updatedRecents;
    });
  }, []);

  // Monitor ingredient database for changes (Keep existing logic)
  useEffect(() => {
    const checkForIngredientChanges = async () => {
      try {
        const ingredients = await ingredientDb.getAll();
        if (ingredients.length === 0) return;

        const latestUpdate = Math.max(
          ...ingredients.map(ing => new Date(ing.dateAdded || 0).getTime())
        );

        if (latestUpdate > lastIngredientUpdateTime) {
          console.log('Ingredient changes detected!', {
            'latest': new Date(latestUpdate).toISOString(),
            'previous': lastIngredientUpdateTime ? new Date(lastIngredientUpdateTime).toISOString() : 'none'
          });
          setLastIngredientUpdateTime(latestUpdate);
          // Trigger refreshRecipes without logging it as manual
          refreshRecipes(false);
        }
      } catch (err) {
        console.error('Error checking for ingredient changes:', err);
      }
    };

    const intervalId = setInterval(checkForIngredientChanges, 15000);
    checkForIngredientChanges(); // Initial check

    return () => clearInterval(intervalId);
  }, [lastIngredientUpdateTime, refreshRecipes]); // Include refreshRecipes

  // Refresh recipe matches every time the screen is focused (Keep existing logic)
  useFocusEffect(
    useCallback(() => {
      // Trigger refreshRecipes without logging it as manual
      refreshRecipes(false);
    }, [refreshRecipes]) // Include refreshRecipes
  );

  // Create a function to refresh recipe match percentages (Keep existing logic)
  // Add optional parameter to control logging
  const refreshRecipes = useCallback(async (logAsManual = true) => {
    const isManualRefresh = logAsManual && !isRefreshing;
    if (isManualRefresh) {
      console.log('🔄 Starting recipe refresh...');
    }

    setIsRefreshing(true);
    try {
      // Refresh generated recipes
      if (recipes.length > 0) {
        if (isManualRefresh) console.log(`Refreshing ${recipes.length} primary recipes`);
        const updatedRecipes = await RecipeMatcherService.refreshRecipeMatches(recipes);
        setRecipes(prevRecipes => {
          const newRecipes = [...prevRecipes];
          updatedRecipes.forEach(updatedRecipe => {
            const index = newRecipes.findIndex(r => r.id === updatedRecipe.id);
            if (index !== -1) newRecipes[index] = updatedRecipe;
          });
          return newRecipes;
        });
      }

      // Refresh recent recipes
      if (recentRecipes.length > 0) {
        if (isManualRefresh) console.log(`Refreshing ${recentRecipes.length} recent recipes`);
        const updatedRecentRecipes = await RecipeMatcherService.refreshRecipeMatches(recentRecipes);
        setRecentRecipes(prevRecentRecipes => {
          const newRecentRecipes = [...prevRecentRecipes];
          updatedRecentRecipes.forEach(updatedRecipe => {
            const index = newRecentRecipes.findIndex(r => r.id === updatedRecipe.id);
            if (index !== -1) newRecentRecipes[index] = updatedRecipe;
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
  }, [recipes, recentRecipes, isRefreshing]); // Dependencies remain the same

  // Generate recipes and add them to recents immediately
  const generateRecipes = useCallback(async (preferences: RecipePreferences, options?: { accumulate?: boolean }) => {
    setIsLoading(true);
    setError(null);

    try {
      const prefsWithTimestamp = {
        ...preferences,
        timestamp: Date.now(),
      };

      const generatedRecipes = await GeminiService.generateRecipes(prefsWithTimestamp);

      // Update the main recipes list
      if (options?.accumulate) {
        setRecipes(prevRecipes => [...generatedRecipes, ...prevRecipes]);
      } else {
        setRecipes(generatedRecipes);
      }

      // --- Add generated recipes to recents ---
      if (generatedRecipes.length > 0) {
        setRecentRecipes(prevRecent => {
          const recentIds = new Set(prevRecent.map(r => r.id));
          // Filter out any generated recipes that might already be in recents (unlikely but safe)
          const newRecipesToAdd = generatedRecipes.filter(recipe => !recentIds.has(recipe.id));

          if (newRecipesToAdd.length === 0) {
            console.log('HOOK: Generated recipes already in recents.');
            return prevRecent; // No changes needed
          }

          console.log(`HOOK: Adding ${newRecipesToAdd.length} newly generated recipes to recents.`);
          // Add new recipes to the beginning, then the existing ones
          let combinedRecent = [...newRecipesToAdd, ...prevRecent];

          // Keep the recent list to a reasonable size
          const trimmedRecent = combinedRecent.slice(0, MAX_RECENT_RECIPES);
          console.log('HOOK: New recent recipe count after adding generated:', trimmedRecent.length);

          return trimmedRecent; // This triggers the useEffect to save
        });
      }
      // --- End adding to recents ---

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate recipes');
      console.error('Error in generateRecipes:', err);
    } finally {
      setIsLoading(false);
    }
  }, []); // Dependencies: MAX_RECENT_RECIPES is constant, so no dependency needed

  // REMOVE: saveToRecent function is now integrated into generateRecipes
  // const saveToRecent = useCallback(() => { ... }, [recipes]);

  return {
    recipes,
    recentRecipes,
    isLoading,
    isRefreshing,
    error,
    generateRecipes,
    // saveToRecent, // Removed
    addSingleRecent, // Saves a single viewed recipe
    refreshRecipes,
    removeFromRecent
  };
};
