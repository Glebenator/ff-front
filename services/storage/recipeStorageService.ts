// services/storage/recipeStorageService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe } from '@/services/api/recipeGenerationService';

const RECENT_RECIPES_KEY = 'fridgefriend:recentRecipes';

export class RecipeStorageService {
  /**
   * Save recent recipes to persistent storage
   */
  static async saveRecentRecipes(recipes: Recipe[]): Promise<void> {
    try {
      await AsyncStorage.setItem(RECENT_RECIPES_KEY, JSON.stringify(recipes));
    } catch (error) {
      console.error('Error saving recent recipes:', error);
    }
  }

  /**
   * Get recent recipes from persistent storage
   */
  static async getRecentRecipes(): Promise<Recipe[]> {
    try {
      const recipesJson = await AsyncStorage.getItem(RECENT_RECIPES_KEY);
      
      if (!recipesJson) {
        return [];
      }
      
      return JSON.parse(recipesJson);
    } catch (error) {
      console.error('Error retrieving recent recipes:', error);
      return [];
    }
  }

  /**
   * Clear all recent recipes from storage
   */
  static async clearRecentRecipes(): Promise<void> {
    try {
      await AsyncStorage.removeItem(RECENT_RECIPES_KEY);
    } catch (error) {
      console.error('Error clearing recent recipes:', error);
    }
  }
}