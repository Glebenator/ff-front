// services/ai/recipeMatcherService.ts
import { ingredientDb } from '@/services/database/ingredientDb';

interface IngredientMatch {
  name: string;
  match: boolean;
  expiringDate?: string;
  daysUntilExpiry?: number;
}

export interface MatchedRecipe {
  id: string;
  title: string;
  description: string;
  ingredientMatches: IngredientMatch[];
  matchingIngredients: string[];
  missingIngredients: string[];
  instructions: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  cookingTime: string;
  calories: string;
  servings: string;
  nutritionalInfo: {
    protein: string;
    carbs: string;
    fat: string;
  };
  imageUrl: string;
  matchPercentage: number;
}

export class RecipeMatcherService {
  // Normalize ingredient names for comparison
  private static normalizeIngredient(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // Normalize spaces
      .replace(/s$/, ''); // Remove trailing 's' for plurals
  }

  // Check if two ingredients match
  private static ingredientsMatch(recipeIngredient: string, userIngredient: string): boolean {
    const normalizedRecipe = this.normalizeIngredient(recipeIngredient);
    const normalizedUser = this.normalizeIngredient(userIngredient);
    
    // Direct match
    if (normalizedRecipe === normalizedUser) return true;
    
    // Check if one contains the other
    if (normalizedRecipe.includes(normalizedUser) || normalizedUser.includes(normalizedRecipe)) {
      return true;
    }

    // TODO: Add more sophisticated matching logic here
    // - Handle common abbreviations (e.g., "tbsp" vs "tablespoon")
    // - Handle ingredient variations (e.g., "chicken breast" vs "chicken")
    // - Handle ingredient categories (e.g., "any vegetables")

    return false;
  }

  static async matchRecipeIngredients(recipeIngredients: string[]): Promise<IngredientMatch[]> {
    const userIngredients = await ingredientDb.getAll();
    
    return recipeIngredients.map(recipeIngredient => {
      const matchingUserIngredient = userIngredients.find(userIngredient => 
        this.ingredientsMatch(recipeIngredient, userIngredient.name)
      );

      if (matchingUserIngredient) {
        const expiryDate = new Date(matchingUserIngredient.expiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        return {
          name: recipeIngredient,
          match: true,
          expiringDate: matchingUserIngredient.expiryDate,
          daysUntilExpiry
        };
      }

      return {
        name: recipeIngredient,
        match: false
      };
    });
  }

  static async enhanceRecipeWithMatches(recipe: any): Promise<MatchedRecipe> {
    // Combine all ingredients into a single array for matching
    const allIngredients = [...recipe.matchingIngredients, ...recipe.missingIngredients];
    
    // Match ingredients against user's inventory
    const ingredientMatches = await this.matchRecipeIngredients(allIngredients);
    
    // Split ingredients based on actual matches
    const matchingIngredients = ingredientMatches
      .filter(match => match.match)
      .map(match => match.name);

    const missingIngredients = ingredientMatches
      .filter(match => !match.match)
      .map(match => match.name);

    // Calculate match percentage
    const matchPercentage = (matchingIngredients.length / allIngredients.length) * 100;

    return {
      ...recipe,
      ingredientMatches,
      matchingIngredients,
      missingIngredients,
      matchPercentage
    };
  }

  static async matchRecipes(recipes: any[]): Promise<MatchedRecipe[]> {
    const matchedRecipes = await Promise.all(
      recipes.map(recipe => this.enhanceRecipeWithMatches(recipe))
    );

    // Sort recipes by match percentage (highest first)
    return matchedRecipes.sort((a, b) => b.matchPercentage - a.matchPercentage);
  }
}