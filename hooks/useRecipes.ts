// hooks/useRecipes.ts
import { useState, useCallback, useEffect } from 'react';
import { RecipeGenerationService, type Recipe } from '@/services/api/recipeGenerationService';
import { RecipeStorageService } from '@/services/storage/recipeStorageService';

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
  const [error, setError] = useState<string | null>(null);

  // Load saved recipes on component mount
  useEffect(() => {
    const loadSavedRecipes = async () => {
      try {
        const saved = await RecipeStorageService.getRecentRecipes();
        setRecentRecipes(saved);
      } catch (err) {
        console.error('Error loading saved recipes:', err);
      }
    };

    loadSavedRecipes();
  }, []);

  const generateRecipes = useCallback(async (preferences: RecipePreferences) => {
    setIsLoading(true);
    setError(null);

    try {
      // Generate new recipes
      const generatedRecipes = await RecipeGenerationService.generateRecipes(preferences);
      
      // Update the current recipes state
      setRecipes(currentRecipes => {
        // Ensure we don't add duplicate recipes (by ID)
        const existingIds = new Set(currentRecipes.map(r => r.id));
        const uniqueNewRecipes = generatedRecipes.filter(r => !existingIds.has(r.id));
        
        // Generate new unique IDs for the new recipes to avoid conflicts
        const recipesWithUniqueIds = uniqueNewRecipes.map((recipe, index) => ({
          ...recipe,
          id: `generated-${Date.now()}-${index}`
        }));
        
        // Combine existing recipes with new ones
        const combinedRecipes = [...currentRecipes, ...recipesWithUniqueIds];
        
        // Save to recent recipes
        const updatedRecentRecipes = [...recipesWithUniqueIds, ...recentRecipes]
          // Limit to 20 recent recipes to prevent excessive storage
          .slice(0, 20);
        
        setRecentRecipes(updatedRecentRecipes);
        RecipeStorageService.saveRecentRecipes(updatedRecentRecipes);
        
        return combinedRecipes;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate recipes');
      console.error('Error in generateRecipes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [recentRecipes]);

  return {
    recipes,
    recentRecipes,
    isLoading,
    error,
    generateRecipes
  };
};