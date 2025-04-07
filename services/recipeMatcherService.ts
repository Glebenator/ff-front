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
  matchingIngredients: Array<{name: string; quantity: string; macros: {protein: string; carbs: string; fat: string}}>;
  missingIngredients: Array<{name: string; quantity: string; macros: {protein: string; carbs: string; fat: string}}>;
  instructions: string[];
  difficulty: string;
  cookingTime: string;
  calories: string;
  servings: string;
  nutritionalInfo: {
    protein: string;
    carbs: string;
    fat: string;
  };
  matchPercentage?: number;
  imageUrl?: string;
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

  // Get all user ingredients for recipe generation
  static async getUserIngredients() {
    try {
      const userIngredients = await ingredientDb.getAll();
      
      // Include all ingredients but add an expired flag
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return userIngredients.map(ingredient => {
        const expiryDate = new Date(ingredient.expiryDate);
        const isExpired = expiryDate < today;
        const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          ...ingredient,
          isExpired,
          daysUntilExpiry
        };
      });
    } catch (error) {
      console.error('Error getting user ingredients:', error);
      return [];
    }
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
    // Extract names from ingredients for matching
    const allIngredientNames = [
      ...(Array.isArray(recipe.matchingIngredients) 
        ? recipe.matchingIngredients.map((ing: any) => typeof ing === 'string' ? ing : ing.name)
        : []),
      ...(Array.isArray(recipe.missingIngredients)
        ? recipe.missingIngredients.map((ing: any) => typeof ing === 'string' ? ing : ing.name)
        : [])
    ];
    
    // Match ingredients against user's inventory
    const ingredientMatches = await this.matchRecipeIngredients(allIngredientNames);
    
    // Create the proper formatted ingredients based on matches
    const newMatchingIngredients = [];
    const newMissingIngredients = [];
    
    // Process matchingIngredients from the recipe
    if (Array.isArray(recipe.matchingIngredients)) {
      for (const ing of recipe.matchingIngredients) {
        const ingName = typeof ing === 'string' ? ing : ing.name;
        const match = ingredientMatches.find(m => this.ingredientsMatch(m.name, ingName));
        
        if (match && match.match) {
          // Add to matching ingredients
          if (typeof ing === 'string') {
            newMatchingIngredients.push({
              name: ing,
              quantity: 'To taste', // Default for old format
              macros: { protein: '0g', carbs: '0g', fat: '0g' }
            });
          } else {
            newMatchingIngredients.push(ing);
          }
        } else {
          // Add to missing ingredients
          if (typeof ing === 'string') {
            newMissingIngredients.push({
              name: ing,
              quantity: 'To taste', // Default for old format
              macros: { protein: '0g', carbs: '0g', fat: '0g' }
            });
          } else {
            newMissingIngredients.push(ing);
          }
        }
      }
    }
    
    // Process missingIngredients from the recipe
    if (Array.isArray(recipe.missingIngredients)) {
      for (const ing of recipe.missingIngredients) {
        const ingName = typeof ing === 'string' ? ing : ing.name;
        const match = ingredientMatches.find(m => this.ingredientsMatch(m.name, ingName));
        
        if (match && match.match) {
          // Add to matching ingredients
          if (typeof ing === 'string') {
            newMatchingIngredients.push({
              name: ing,
              quantity: 'To taste', // Default for old format
              macros: { protein: '0g', carbs: '0g', fat: '0g' }
            });
          } else {
            newMatchingIngredients.push(ing);
          }
        } else {
          // Add to missing ingredients
          if (typeof ing === 'string') {
            newMissingIngredients.push({
              name: ing,
              quantity: 'To taste', // Default for old format
              macros: { protein: '0g', carbs: '0g', fat: '0g' }
            });
          } else {
            newMissingIngredients.push(ing);
          }
        }
      }
    }
    
    // Calculate match percentage
    const matchPercentage = (newMatchingIngredients.length / (newMatchingIngredients.length + newMissingIngredients.length)) * 100;

    return {
      ...recipe,
      matchingIngredients: newMatchingIngredients,
      missingIngredients: newMissingIngredients,
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