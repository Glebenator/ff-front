// hooks/useRecipes.ts
import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GeminiService, type Recipe } from '@/services/api/recipeGenerationService';
import { RecipeMatcherService } from '@/services/recipeMatcherService';
import { useFocusEffect } from '@react-navigation/native';
import { ingredientDb } from '@/services/database/ingredientDb';

const RECENT_RECIPES_STORAGE_KEY = 'fridgefriend_recent_recipes';

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

  // Monitor ingredient database for changes
  useEffect(() => {
    const checkForIngredientChanges = async () => {
      try {
        // Get the latest update timestamp from ingredients
        const ingredients = await ingredientDb.getAll();
        if (ingredients.length === 0) return;
        
        // Find the most recent update time using dateAdded field since there's no updatedAt
        const latestUpdate = Math.max(
          ...ingredients.map(ing => new Date(ing.dateAdded || 0).getTime())
        );
        
        console.log('Latest ingredient update:', new Date(latestUpdate).toISOString());
        console.log('Last recorded update:', lastIngredientUpdateTime ? 
                   new Date(lastIngredientUpdateTime).toISOString() : 'none');
        
        // If we have a new update time, refresh recipes
        if (latestUpdate > lastIngredientUpdateTime) {
          console.log('Ingredient changes detected, refreshing recipes...');
          setLastIngredientUpdateTime(latestUpdate);
          refreshRecipes();
        }
      } catch (err) {
        console.error('Error checking for ingredient changes:', err);
      }
    };

    // Set up polling interval to check for ingredient changes (every 5 seconds for faster detection)
    const intervalId = setInterval(checkForIngredientChanges, 5000);
    
    // Initial check
    checkForIngredientChanges();
    
    return () => clearInterval(intervalId);
  }, [lastIngredientUpdateTime, refreshRecipes]);

  // Refresh recipe matches every time the screen is focused
  useFocusEffect(
    useCallback(() => {
      console.log('🔎 Recipe screen focused, refreshing matches...');
      refreshRecipes();
    }, [refreshRecipes])
  );

  // Create a function to refresh recipe match percentages
  const refreshRecipes = useCallback(async () => {
    console.log('🔄 Starting recipe refresh...');
    setIsRefreshing(true);
    try {
      if (recipes.length > 0) {
        console.log(`Refreshing ${recipes.length} primary recipes`);
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
        console.log(`Refreshing ${recentRecipes.length} recent recipes`);
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
      console.log('✅ Recipe refresh completed successfully');
    } catch (err) {
      console.error('❌ Error refreshing recipes:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [recipes, recentRecipes]);

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
    recipes,
    recentRecipes,
    isLoading,
    isRefreshing,
    error,
    generateRecipes,
    saveToRecent,
    refreshRecipes
  };
};