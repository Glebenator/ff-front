// services/ai/mockGeminiService.ts
import { type MatchedRecipe, RecipeMatcherService } from '@/services/recipeMatcherService';

export interface Recipe extends MatchedRecipe {}

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