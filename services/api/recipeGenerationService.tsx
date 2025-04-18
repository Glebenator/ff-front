// services/ai/mockGeminiService.ts
import { type MatchedRecipe, RecipeMatcherService } from '@/services/recipeMatcherService';
import { GoogleGenAI } from '@google/genai';
import { ingredientDb } from '@/services/database/ingredientDb';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Recipe extends MatchedRecipe {}

export interface RecipePreferences {
  useExpiring: boolean;
  quickMeals?: boolean;
  minimalShopping?: boolean;
  vegetarian?: boolean;
  healthy?: boolean;
  proteinPlus?: boolean;
}

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'lol leaked the key last time' });

const SYSTEM_PROMPT = `You are a cooking expert that generates recipes based on available ingredients. 
Generate recipes that maximize the use of available ingredients, especially those that are expiring soon.
Always return recipes in the following JSON format:
{
  "title": "Recipe name",
  "description": "Brief description",
  "matchingIngredients": [
    {"name": "ingredient1", "quantity": "200g"},
    {"name": "ingredient2", "quantity": "2 cups"}
  ],
  "missingIngredients": [
    {"name": "ingredient3", "quantity": "1 tbsp"},
    {"name": "ingredient4", "quantity": "3 pieces"}
  ],
  "instructions": ["Step 1", "Step 2", "etc"],
  "difficulty": "Easy|Medium|Hard",
  "cookingTime": "XX mins",
  "calories": "XXX kcal",
  "servings": "X",
  "nutritionalInfo": {
    "protein": "XXg",
    "carbs": "XXg",
    "fat": "XXg"
  }
}`;

const RECENT_RECIPES_KEY = '@recent_recipes';
const MAX_RECENT_RECIPES = 20;

class RecentRecipesManager {
  private static recentRecipes: Recipe[] = [];

  static async loadRecentRecipes(): Promise<Recipe[]> {
    try {
      const stored = await AsyncStorage.getItem(RECENT_RECIPES_KEY);
      if (stored) {
        this.recentRecipes = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading recent recipes:', error);
    }
    return this.recentRecipes;
  }

  static async addRecipes(recipes: Recipe[]): Promise<void> {
    // Add new recipes to the front of the list
    this.recentRecipes = [...recipes, ...this.recentRecipes].slice(0, MAX_RECENT_RECIPES);
    try {
      await AsyncStorage.setItem(RECENT_RECIPES_KEY, JSON.stringify(this.recentRecipes));
    } catch (error) {
      console.error('Error saving recent recipes:', error);
    }
  }

  static getRecentRecipes(): Recipe[] {
    return this.recentRecipes;
  }
}

export class GeminiService {
  static async generateRecipes(preferences: RecipePreferences): Promise<Recipe[]> {
    try {
      const ingredients = await ingredientDb.getAll();
      const expiringIngredients = preferences.useExpiring ? 
        await ingredientDb.getExpiringSoon(5) : [];

      const availableIngredients = ingredients.map(i => i.name);
      const expiringIngredientNames = expiringIngredients.map(i => i.name);

      const dietaryPreferences = [
        preferences.vegetarian ? 'vegetarian' : null,
        preferences.healthy ? 'healthy and balanced' : null,
        preferences.proteinPlus ? 'high protein' : null,
      ].filter(Boolean).join(', ');

      const prompt = `${SYSTEM_PROMPT}\n
        Generate exactly 3 recipes using these ingredients:
        Available: ${availableIngredients.join(', ')}
        ${expiringIngredientNames.length > 0 ? `\nExpiring soon: ${expiringIngredientNames.join(', ')}` : ''}
        
        Important Requirements:
        1. ${preferences.useExpiring ? 'Prioritize using ingredients that are expiring soon' : 'No specific ingredient priority'}
        2. ${preferences.quickMeals ? 'Recipes must take under 30 minutes to prepare' : 'No time restriction'}
        3. ${preferences.minimalShopping ? 'Minimize the use of ingredients not in the available list' : 'Can use additional ingredients as needed'}
        4. ${dietaryPreferences ? `Recipes must be ${dietaryPreferences}` : 'No dietary restrictions'}
        5. Response must be a valid JSON array
        6. Follow the exact JSON structure provided above
        7. Each recipe must include accurate cooking time and difficulty level
        8. No additional text or formatting`;

      console.log('=== Gemini Prompt ===');
      console.log(prompt);
      console.log('===================');

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-thinking-exp-01-21',
        contents: prompt
      });

      let textContent = response.text;

      console.log('=== Gemini Response ===');
      console.log(textContent);
      console.log('===================');
      
      // Clean up the response to ensure valid JSON
      textContent = textContent.trim();
      if (!textContent.startsWith('[')) {
        // Find the first [ character
        const startIndex = textContent.indexOf('[');
        if (startIndex !== -1) {
          textContent = textContent.substring(startIndex);
        }
      }
      if (!textContent.endsWith(']')) {
        // Find the last ] character
        const endIndex = textContent.lastIndexOf(']');
        if (endIndex !== -1) {
          textContent = textContent.substring(0, endIndex + 1);
        }
      }

      // Validate JSON structure
      let recipes;
      try {
        recipes = JSON.parse(textContent);
        if (!Array.isArray(recipes)) {
          throw new Error('Response is not an array');
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return MockGeminiService.generateRecipes();
      }
      
      // Add unique IDs, image URLs, and preferences to the recipes
      const processedRecipes = recipes.map((recipe: any, index: number) => ({
        ...recipe,
        id: `gemini-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}`,
        imageUrl: '/api/placeholder/400/200',
        generationPreferences: { ...preferences }
      }));

      // Save unique recent recipes
      const existingRecipes = await RecentRecipesManager.loadRecentRecipes();
      const uniqueNewRecipes = processedRecipes.filter(newRecipe => 
        !existingRecipes.some(existing => existing.title === newRecipe.title)
      );
      await RecentRecipesManager.addRecipes(uniqueNewRecipes);

      return await RecipeMatcherService.matchRecipes(processedRecipes);
      
    } catch (error) {
      console.error('Gemini API error:', error);
      return MockGeminiService.generateRecipes();
    }
  }
}

// Keep mock recipes for testing and fallback
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

export class MockGeminiService {
  static async generateRecipes(preferences?: RecipePreferences): Promise<Recipe[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Randomly fail sometimes to test error handling
    if (Math.random() < 0.1) {
      throw new Error('Failed to generate recipes');
    }
    
    // Filter mock recipes based on preferences
    let filteredRecipes = [...MOCK_RECIPES];
    
    if (preferences) {
      if (preferences.quickMeals) {
        filteredRecipes = filteredRecipes.filter(recipe => 
          parseInt(recipe.cookingTime) <= 30
        );
      }
      
      if (preferences.vegetarian) {
        // Simple check for vegetarian recipes (no meat-related words)
        const meatWords = ['chicken', 'beef', 'pork', 'fish', 'meat', 'seafood'];
        filteredRecipes = filteredRecipes.filter(recipe => 
          !meatWords.some(word => 
            recipe.title.toLowerCase().includes(word) ||
            recipe.description.toLowerCase().includes(word)
          )
        );
      }
      
      if (preferences.proteinPlus) {
        // Filter for high protein recipes (>12g)
        filteredRecipes = filteredRecipes.filter(recipe => 
          parseInt(recipe.nutritionalInfo.protein) >= 12
        );
      }
    }
    
    // Ensure we have at least one recipe
    if (filteredRecipes.length === 0) {
      filteredRecipes = [MOCK_RECIPES[0]];
    }
    
    // Match recipes against user's ingredients
    const matchedRecipes = await RecipeMatcherService.matchRecipes(filteredRecipes);
    return matchedRecipes;
  }
}