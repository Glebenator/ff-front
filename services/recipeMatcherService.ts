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
    // Handles empty strings or null values
    if (!recipeIngredient || !userIngredient) return false;
    
    const normalizedRecipe = this.normalizeIngredient(recipeIngredient);
    const normalizedUser = this.normalizeIngredient(userIngredient);
    
    // Direct match after normalization
    if (normalizedRecipe === normalizedUser) return true;
    
    // Split into words for more granular matching
    const recipeWords = normalizedRecipe.split(' ');
    const userWords = normalizedUser.split(' ');
    
    // Check if all recipe words are in the user ingredient
    // This handles cases like "feta" matching "feta cheese"
    const allRecipeWordsInUser = recipeWords.every(word => 
      userWords.includes(word)
    );
    
    // Check if all user words are in the recipe ingredient
    // This handles cases like "feta cheese" matching "feta"
    const allUserWordsInRecipe = userWords.every(word => 
      recipeWords.includes(word)
    );
    
    // If either direction matches completely, consider it a match
    if (allRecipeWordsInUser || allUserWordsInRecipe) return true;
    
    // Check if the primary word matches (e.g., "feta" is the primary word in "feta cheese")
    // This typically works for ingredients where the first word is the main ingredient
    if (recipeWords[0] === userWords[0]) return true;
    
    // Check if one contains the other as a substring
    if (normalizedRecipe.includes(normalizedUser) || normalizedUser.includes(normalizedRecipe)) {
      return true;
    }

    // Additional common substitutions and variants
    const commonSubstitutions = {
      'onion': ['yellow onion', 'red onion', 'white onion', 'green onion', 'shallot'],
      'pepper': ['bell pepper', 'red pepper', 'green pepper', 'yellow pepper', 'chili pepper'],
      'cheese': ['cheddar', 'mozzarella', 'parmesan', 'swiss', 'feta', 'gouda', 'brie'],
      'vinegar': ['white vinegar', 'balsamic vinegar', 'rice vinegar', 'apple cider vinegar'],
      'oil': ['olive oil', 'vegetable oil', 'canola oil', 'sunflower oil', 'coconut oil'],
      'milk': ['whole milk', 'skim milk', 'almond milk', 'soy milk', 'oat milk'],
      'flour': ['all-purpose flour', 'whole wheat flour', 'bread flour', 'cake flour'],
    };
    
    // Check for common substitutions
    for (const [base, variants] of Object.entries(commonSubstitutions)) {
      // If recipe ingredient is the base and user has a variant
      if (normalizedRecipe === base && variants.some(v => normalizedUser.includes(v))) {
        return true;
      }
      // If user ingredient is the base and recipe needs a variant
      if (normalizedUser === base && variants.some(v => normalizedRecipe.includes(v))) {
        return true;
      }
      // If both are variants of the same base
      if (variants.some(v => normalizedRecipe.includes(v)) && 
          variants.some(v => normalizedUser.includes(v))) {
        return true;
      }
    }

    // No match found after all checks
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
    console.log(`RecipeMatcherService: Refreshing matches for ${recipes.length} recipes`);
    
    // For debugging: show initial match percentages
    if (recipes.length > 0) {
      console.log('Before refresh - match percentages:', 
        recipes.map(r => ({ title: r.title, match: Math.round(r.matchPercentage) + '%' }))
      );
    }
    
    const refreshedRecipes = await this.matchRecipes(recipes);
    
    // For debugging: show updated match percentages
    if (refreshedRecipes.length > 0) {
      console.log('After refresh - match percentages:', 
        refreshedRecipes.map(r => ({ title: r.title, match: Math.round(r.matchPercentage) + '%' }))
      );
    }
    
    return refreshedRecipes;
  }
}