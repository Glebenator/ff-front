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
    // Only log when there are recipes to refresh
    if (recipes.length > 0) {
      console.log(`Refreshing matches for ${recipes.length} recipes`);
    }
    
    // For debugging: uncomment to see detailed match percentages
    /*
    if (recipes.length > 0) {
      console.log('Before refresh - match percentages:', 
        recipes.map(r => ({ title: r.title, match: Math.round(r.matchPercentage) + '%' }))
      );
    }
    */
    
    const refreshedRecipes = await this.matchRecipes(recipes);
    
    /*
    if (refreshedRecipes.length > 0) {
      console.log('After refresh - match percentages:', 
        refreshedRecipes.map(r => ({ title: r.title, match: Math.round(r.matchPercentage) + '%' }))
      );
    }
    */
    
    return refreshedRecipes;
  }
  
  /**
   * Diagnose ingredient matching issues by comparing recipe ingredients against user's inventory
   * @param recipeTitle The title of the recipe to diagnose
   * @param recipeIngredients List of ingredients required by the recipe
   * @returns An object with matches and non-matches including detailed reasons
   */
  static async diagnoseIngredientMatches(recipeTitle: string, recipeIngredients: string[]): Promise<any> {
    console.log(`\n📋 Diagnosing ingredient matches for recipe: ${recipeTitle}`);
    const userIngredients = await ingredientDb.getAll();
    
    const result = {
      recipeTitle,
      matches: [],
      nonMatches: [],
      userInventory: userIngredients.map(i => i.name),
    };
    
    for (const recipeIngredient of recipeIngredients) {
      console.log(`\nChecking recipe ingredient: "${recipeIngredient}"`);
      
      let found = false;
      const matchDetails = { ingredient: recipeIngredient, matchedWith: null, reason: null };
      
      for (const userIngredient of userIngredients) {
        const normalizedRecipe = this.normalizeIngredient(recipeIngredient);
        const normalizedUser = this.normalizeIngredient(userIngredient.name);
        
        console.log(`  Comparing with "${userIngredient.name}":`);
        console.log(`    Normalized recipe: "${normalizedRecipe}"`);
        console.log(`    Normalized user:   "${normalizedUser}"`);
        
        // Try all the matching methods and report which one worked
        if (normalizedRecipe === normalizedUser) {
          matchDetails.matchedWith = userIngredient.name;
          matchDetails.reason = 'Exact match after normalization';
          found = true;
          console.log(`    ✅ MATCH! - Exact match after normalization`);
          break;
        }
        
        // Word matching
        const recipeWords = normalizedRecipe.split(' ');
        const userWords = normalizedUser.split(' ');
        
        if (recipeWords.every(word => userWords.includes(word))) {
          matchDetails.matchedWith = userIngredient.name;
          matchDetails.reason = 'All recipe words found in user ingredient';
          found = true;
          console.log(`    ✅ MATCH! - All recipe words found in user ingredient`);
          break;
        }
        
        if (userWords.every(word => recipeWords.includes(word))) {
          matchDetails.matchedWith = userIngredient.name;
          matchDetails.reason = 'All user words found in recipe ingredient';
          found = true;
          console.log(`    ✅ MATCH! - All user words found in recipe ingredient`);
          break;
        }
        
        if (recipeWords[0] === userWords[0]) {
          matchDetails.matchedWith = userIngredient.name;
          matchDetails.reason = 'Primary words match';
          found = true;
          console.log(`    ✅ MATCH! - Primary words match (${recipeWords[0]})`);
          break;
        }
        
        if (normalizedRecipe.includes(normalizedUser) || normalizedUser.includes(normalizedRecipe)) {
          matchDetails.matchedWith = userIngredient.name;
          matchDetails.reason = 'One contains the other as substring';
          found = true;
          console.log(`    ✅ MATCH! - One contains the other as substring`);
          break;
        }
        
        // Common substitutions check
        let substMatch = false;
        const commonSubstitutions = {
          'onion': ['yellow onion', 'red onion', 'white onion', 'green onion', 'shallot'],
          'pepper': ['bell pepper', 'red pepper', 'green pepper', 'yellow pepper', 'chili pepper'],
          'cheese': ['cheddar', 'mozzarella', 'parmesan', 'swiss', 'feta', 'gouda', 'brie'],
          'vinegar': ['white vinegar', 'balsamic vinegar', 'rice vinegar', 'apple cider vinegar'],
          'oil': ['olive oil', 'vegetable oil', 'canola oil', 'sunflower oil', 'coconut oil'],
          'milk': ['whole milk', 'skim milk', 'almond milk', 'soy milk', 'oat milk'],
          'flour': ['all-purpose flour', 'whole wheat flour', 'bread flour', 'cake flour'],
        };
        
        for (const [base, variants] of Object.entries(commonSubstitutions)) {
          if (normalizedRecipe === base && variants.some(v => normalizedUser.includes(v))) {
            matchDetails.matchedWith = userIngredient.name;
            matchDetails.reason = `Recipe base "${base}" matches user variant`;
            found = true;
            substMatch = true;
            console.log(`    ✅ MATCH! - Recipe base "${base}" matches user variant`);
            break;
          }
          if (normalizedUser === base && variants.some(v => normalizedRecipe.includes(v))) {
            matchDetails.matchedWith = userIngredient.name;
            matchDetails.reason = `User base "${base}" matches recipe variant`;
            found = true;
            substMatch = true;
            console.log(`    ✅ MATCH! - User base "${base}" matches recipe variant`);
            break;
          }
          if (variants.some(v => normalizedRecipe.includes(v)) && 
              variants.some(v => normalizedUser.includes(v))) {
            matchDetails.matchedWith = userIngredient.name;
            matchDetails.reason = `Both are variants of "${base}"`;
            found = true;
            substMatch = true;
            console.log(`    ✅ MATCH! - Both are variants of "${base}"`);
            break;
          }
        }
        
        if (substMatch) break;
        
        console.log(`    ❌ No match`);
      }
      
      if (found) {
        result.matches.push(matchDetails);
      } else {
        result.nonMatches.push({
          ingredient: recipeIngredient,
          reason: 'No matching ingredient found in inventory'
        });
        console.log(`  ❌ NO MATCH FOUND in inventory for "${recipeIngredient}"`);
      }
    }
    
    console.log('\n📊 Match Summary:');
    console.log(`  ✅ Matched ingredients: ${result.matches.length}`);
    console.log(`  ❌ Missing ingredients: ${result.nonMatches.length}`);
    console.log(`  📈 Match percentage: ${Math.round((result.matches.length / recipeIngredients.length) * 100)}%\n`);
    
    return result;
  }
}