// hooks/useRecipes.ts
import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GeminiService, type Recipe } from '@/services/api/recipeGenerationService';
import { RecipeMatcherService } from '@/services/recipeMatcherService';

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

  // Create a function to refresh recipe match percentages
  const refreshRecipes = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (recipes.length > 0) {
        const updatedRecipes = await RecipeMatcherService.matchRecipes(recipes);
        setRecipes(updatedRecipes);
      }
      
      if (recentRecipes.length > 0) {
        const updatedRecentRecipes = await RecipeMatcherService.matchRecipes(recentRecipes);
        setRecentRecipes(updatedRecentRecipes);
      }
    } catch (err) {
      console.error('Error refreshing recipes:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [recipes, recentRecipes]);

  const generateRecipes = useCallback(async (preferences: RecipePreferences, options?: { accumulate?: boolean }) => {
    setIsLoading(true);
    setError(null);

    try {
      const generatedRecipes = await GeminiService.generateRecipes(preferences);
      
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