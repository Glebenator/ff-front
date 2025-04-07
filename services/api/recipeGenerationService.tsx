// services/api/recipeGenerationService.tsx
import { type MatchedRecipe, RecipeMatcherService } from '@/services/recipeMatcherService';
import { apiConfig } from '@/config/api';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface Recipe extends MatchedRecipe {}

// Keep MOCK_RECIPES as fallback for development and testing
const MOCK_RECIPES = [
  {
    id: '1',
    title: 'Quick Vegetable Stir Fry',
    description: 'A healthy and quick vegetable stir fry perfect for using up fresh vegetables.',
    matchingIngredients: ['Bell Peppers', 'Carrots', 'Broccoli', 'Garlic', 'Ginger'],
    missingIngredients: ['Soy Sauce', 'Sesame Oil'],
    instructions: [
      'Prep all vegetables by cutting into similar-sized pieces',
      'Heat oil in a large wok or frying pan over high heat',
      'Add garlic and ginger, stir-fry for 30 seconds',
      'Add harder vegetables (carrots) first, cook for 2 minutes',
      'Add remaining vegetables, stir-fry for 3-4 minutes',
      'Season with soy sauce and sesame oil'
    ],
    difficulty: 'Easy',
    cookingTime: '15 mins',
    calories: '220 kcal',
    servings: '4',
    nutritionalInfo: {
      protein: '6g',
      carbs: '24g',
      fat: '12g'
    },
    imageUrl: '/api/placeholder/400/200'
  },
  {
    id: '2',
    title: 'Protein-Packed Quinoa Bowl',
    description: 'A nutritious bowl featuring quinoa, roasted vegetables, and chickpeas.',
    matchingIngredients: ['Quinoa', 'Sweet Potato', 'Chickpeas', 'Spinach'],
    missingIngredients: ['Tahini', 'Lemon'],
    instructions: [
      'Cook quinoa according to package instructions',
      'Roast sweet potato cubes with olive oil and seasonings',
      'Season and roast chickpeas until crispy',
      'Combine all ingredients in a bowl',
      'Top with tahini dressing'
    ],
    difficulty: 'Medium',
    cookingTime: '30 mins',
    calories: '380 kcal',
    servings: '3',
    nutritionalInfo: {
      protein: '15g',
      carbs: '52g',
      fat: '14g'
    },
    imageUrl: '/api/placeholder/400/200'
  },
  {
    id: '3',
    title: 'Mediterranean Pasta Salad',
    description: 'A refreshing pasta salad with vegetables and feta cheese.',
    matchingIngredients: ['Pasta', 'Cherry Tomatoes', 'Cucumber', 'Red Onion', 'Feta'],
    missingIngredients: ['Olives', 'Fresh Basil'],
    instructions: [
      'Cook pasta al dente, then cool under running water',
      'Chop all vegetables into bite-sized pieces',
      'Combine pasta with vegetables and crumbled feta',
      'Dress with olive oil and seasonings',
      'Chill for at least 30 minutes before serving'
    ],
    difficulty: 'Easy',
    cookingTime: '20 mins',
    calories: '320 kcal',
    servings: '6',
    nutritionalInfo: {
      protein: '12g',
      carbs: '48g',
      fat: '10g'
    },
    imageUrl: '/api/placeholder/400/200'
  }
];

// This will be used to structure our prompt to the Gemini API
const RECIPE_GENERATION_PROMPT = `
Generate {recipeCount} recipes based on the following criteria:
- Meal type: {mealType}
- Available ingredients: {availableIngredients}
- Ingredients about to expire or recently expired: {expiringIngredients}
- Preferences: {preferences}

The recipes should be concise, realistic, and formatted exactly as follows:

{
  "recipes": [
    {
      "id": "1",
      "title": "Recipe Title", 
      "description": "Brief description of the recipe in one sentence.",
      "matchingIngredients": [
        {"name": "Ingredient1", "quantity": "2 cups", "macros": {"protein": "5g", "carbs": "10g", "fat": "2g"}},
        {"name": "Ingredient2", "quantity": "100g", "macros": {"protein": "2g", "carbs": "8g", "fat": "0g"}}
      ], 
      "missingIngredients": [
        {"name": "Ingredient3", "quantity": "3 tbsp", "macros": {"protein": "0g", "carbs": "2g", "fat": "5g"}},
        {"name": "Ingredient4", "quantity": "1 tsp", "macros": {"protein": "0g", "carbs": "1g", "fat": "0g"}}
      ],
      "instructions": [
        "Step 1 instruction",
        "Step 2 instruction",
        "Step 3 instruction"
      ],
      "difficulty": "Easy", // Easy, Medium, or Hard
      "cookingTime": "30 mins",
      "calories": "300 kcal",
      "servings": "4",
      "nutritionalInfo": {
        "protein": "15g",
        "carbs": "40g", 
        "fat": "10g"
      }
    }
  ]
}

Provide a variety of dishes that match the following requirements:
- If "quickMeals" is true, all recipes should be prepared in under 30 minutes
- If "useExpiring" is true, prioritize using the ingredients that are about to expire
- If "proteinPlus" is true, ensure recipes have higher protein content (>20g)
- If "minimalShopping" is true, minimize the number of missing ingredients
- If "vegetarian" is true, provide only vegetarian recipes
- If "healthy" is true, ensure recipes are balanced with reasonable calorie counts

For each ingredient, provide:
1. The exact quantity needed (e.g., "2 cups", "100g", "3 tablespoons")
2. The macronutrient breakdown for that specific ingredient in the recipe

Ensure that the JSON is valid and can be parsed properly.
`;

export class GeminiService {
  // Use the API configuration 
  private static API_KEY = apiConfig.gemini.apiKey;
  
  static async generateRecipes(preferences: {
    mealType: string;
    quickMeals: boolean;
    useExpiring: boolean;
    proteinPlus: boolean;
    minimalShopping: boolean;
    vegetarian: boolean;
    healthy: boolean;
  }): Promise<Recipe[]> {
    try {
      // Initialize the Google Generative AI with API key
      const genAI = new GoogleGenerativeAI(this.API_KEY);
      
      // Get the generative model (using Gemini Pro)
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-thinking-exp-01-21",
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192,
        }
      });
      
      // Get user's ingredients from the database
      const userIngredients = await RecipeMatcherService.getUserIngredients();
      
      // Separate ingredients into regular and expiring/expired
      const regularIngredients = userIngredients
        .filter(ing => !ing.isExpired && ing.daysUntilExpiry > 3)
        .map(ing => ing.name);
      
      const expiringIngredients = userIngredients
        .filter(ing => ing.isExpired || ing.daysUntilExpiry <= 3)
        .map(ing => {
          if (ing.isExpired) {
            return `${ing.name} (expired)`;
          } else {
            return `${ing.name} (expires in ${ing.daysUntilExpiry} day${ing.daysUntilExpiry !== 1 ? 's' : ''})`;
          }
        });
      
      // Create preference string
      const preferenceList = Object.entries(preferences)
        .filter(([key, value]) => value === true && key !== 'mealType')
        .map(([key]) => key)
        .join(', ');
      
      // Create prompt based on user preferences
      const prompt = RECIPE_GENERATION_PROMPT
        .replace('{recipeCount}', '3')
        .replace('{mealType}', preferences.mealType)
        .replace('{availableIngredients}', regularIngredients.join(', '))
        .replace('{expiringIngredients}', expiringIngredients.join(', '))
        .replace('{preferences}', preferenceList);
      
      // DEBUG: Output the final prompt for debugging
      console.log('=== RECIPE GENERATION PROMPT ===');
      console.log(prompt);
      console.log('===============================');
      
      // Call the Gemini API using the SDK
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const textContent = response.text();
      
      // DEBUG: Output the raw API response for debugging
      console.log('=== GEMINI API RESPONSE ===');
      console.log(textContent);
      console.log('==========================');
      
      // Extract JSON from the text response
      const jsonMatch = textContent.match(/```json\n([\s\S]*?)\n```/) || 
                        textContent.match(/{[\s\S]*}/);
      
      if (!jsonMatch) {
        throw new Error('Failed to extract JSON from the API response');
      }
      
      const jsonContent = jsonMatch[1] || jsonMatch[0];
      
      // DEBUG: Output the extracted JSON
      console.log('=== EXTRACTED JSON ===');
      console.log(jsonContent);
      console.log('=====================');
      
      const parsedContent = JSON.parse(jsonContent);
      
      // Ensure we have the expected structure
      if (!parsedContent.recipes || !Array.isArray(parsedContent.recipes)) {
        throw new Error('Invalid recipe format returned from API');
      }
      
      const generatedRecipes = parsedContent.recipes.map((recipe: any, index: number) => ({
        ...recipe,
        id: String(index + 1), // Ensure IDs are unique
        imageUrl: '/api/placeholder/400/200' // Placeholder image
      }));
      
      // Match recipes against user's ingredients
      return await RecipeMatcherService.matchRecipes(generatedRecipes);
    } catch (error) {
      console.error('Error generating recipes with Gemini:', error);
      
      // Fallback to mock recipes in case of failure
      return await RecipeMatcherService.matchRecipes(MOCK_RECIPES);
    }
  }
}

// The service that will be exported
export class RecipeGenerationService {
  static async generateRecipes(preferences: any): Promise<Recipe[]> {
    // Use Gemini if API key is configured, otherwise use mock data
    if (GeminiService.API_KEY) {
      return await GeminiService.generateRecipes(preferences);
    } else {
      console.log('No Gemini API key found, using mock recipes');
      return await MockGeminiService.generateRecipes();
    }
  }
}

// Keep MockGeminiService for fallback and testing
export class MockGeminiService {
  static async generateRecipes(): Promise<Recipe[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Randomly fail sometimes to test error handling
    if (Math.random() < 0.1) {
      throw new Error('Failed to generate recipes');
    }
    
    // Match recipes against user's ingredients
    const matchedRecipes = await RecipeMatcherService.matchRecipes(MOCK_RECIPES);
    return matchedRecipes;
  }
}