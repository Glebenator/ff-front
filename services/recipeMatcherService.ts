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
  matchingIngredients: Array<{ name: string; quantity: string; }>;
  missingIngredients: Array<{ name: string; quantity: string; }>;
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
    // Extract ingredients with their quantities
    const allIngredients = [
      ...(recipe.matchingIngredients || []).map((i: any) => ({
        name: typeof i === 'string' ? i : i.name,
        quantity: typeof i === 'string' ? null : i.quantity
      })),
      ...(recipe.missingIngredients || []).map((i: any) => ({
        name: typeof i === 'string' ? i : i.name,
        quantity: typeof i === 'string' ? null : i.quantity
      }))
    ];
    
    // Match ingredients against user's inventory
    const ingredientMatches = await this.matchRecipeIngredients(allIngredients.map(i => i.name));
    
    // Combine matches with quantities
    const enhancedMatches = ingredientMatches.map((match, index) => ({
      ...match,
      quantity: allIngredients[index].quantity
    }));
    
    // Split ingredients based on matches
    const matchingIngredients = enhancedMatches
      .filter(match => match.match)
      .map(match => ({
        name: match.name,
        quantity: match.quantity || '(amount not specified)'
      }));

    const missingIngredients = enhancedMatches
      .filter(match => !match.match)
      .map(match => ({
        name: match.name,
        quantity: match.quantity || '(amount not specified)'
      }));

    const matchPercentage = (matchingIngredients.length / allIngredients.length) * 100;

    return {
      ...recipe,
      ingredientMatches: enhancedMatches,
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

  /**
   * Recalculates match percentages for recipes based on current ingredient inventory
   * Call this function whenever the user's ingredients change or when viewing recipes
   */
  static async refreshRecipeMatches(recipes: MatchedRecipe[]): Promise<MatchedRecipe[]> {
    return this.matchRecipes(recipes);
  }
}