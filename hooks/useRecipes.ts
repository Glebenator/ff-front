// hooks/useRecipes.ts
import { useState, useCallback } from 'react';
import { MockGeminiService, type Recipe } from '@/services/api/recipeGenerationService';

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateRecipes = useCallback(async (preferences: RecipePreferences) => {
    setIsLoading(true);
    setError(null);

    try {
      const generatedRecipes = await MockGeminiService.generateRecipes();
      setRecipes(generatedRecipes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate recipes');
      console.error('Error in generateRecipes:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    recipes,
    isLoading,
    error,
    generateRecipes
  };
};