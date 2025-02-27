import AsyncStorage from '@react-native-async-storage/async-storage';

export class CategoryUtils {
  private static CATEGORIES_STORAGE_KEY = 'user_categories';

  private static readonly DEFAULT_CATEGORIES = [
    'Dairy', 'Meat', 'Seafood', 'Fruits', 'Vegetables', 
    'Beverages', 'Condiments', 'Leftovers', 'Deli',
    'Eggs', 'Desserts', 'Frozen'
  ];

  private static readonly CATEGORY_MAPPINGS: { [key: string]: string[] } = {
    Dairy: ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'margarine', 'sour cream'],
    Meat: ['chicken', 'beef', 'pork', 'turkey', 'ham', 'bacon', 'sausage', 'steak'],
    Seafood: ['fish', 'shrimp', 'crab', 'salmon', 'tuna', 'lobster', 'scallop'],
    Vegetables: ['carrot', 'lettuce', 'tomato', 'cucumber', 'pepper', 'onion', 'broccoli', 'spinach'],
    Fruits: ['apple', 'banana', 'orange', 'grape', 'berry', 'strawberry', 'lemon', 'peach'],
    Beverages: ['juice', 'soda', 'water', 'tea', 'coffee', 'beer', 'wine', 'milk'],
    Condiments: ['ketchup', 'mustard', 'mayo', 'sauce', 'dressing', 'jam', 'syrup', 'honey'],
    Leftovers: ['container', 'meal', 'takeout', 'leftover', 'dinner', 'lunch'],
    Deli: ['sandwich', 'salad', 'cold cut', 'sliced', 'prepared'],
    Desserts: ['pudding', 'jello', 'cake', 'pie', 'ice cream'],
    Frozen: ['pizza', 'ice cream', 'frozen', 'fries', 'vegetables', 'meal']
  };

  private static readonly CATEGORY_EXPIRATIONS: { [key: string]: number } = {
    Dairy: 7,           // 7 days for dairy products
    Meat: 3,            // 3 days for fresh meat
    Seafood: 2,         // 2 days for seafood
    Fruits: 7,          // 7 days for fruits
    Vegetables: 7,      // 7 days for vegetables
    Beverages: 14,      // 14 days for beverages
    Condiments: 90,     // 90 days for condiments
    Leftovers: 4,       // 4 days for leftovers
    Deli: 5,            // 5 days for deli items
    Eggs: 21,           // 21 days for eggs
    Desserts: 5,        // 5 days for refrigerated desserts
    Other: 7            // 7 days default for uncategorized items
  };

  private static readonly ITEM_EXPIRATIONS: { [key: string]: number } = {
    'milk': 7,
    'ground beef': 2,
    'chicken breast': 2,
    'fresh fish': 1,
    'yogurt': 14,
    'opened juice': 7,
    'cream cheese': 14,
    'hard cheese': 30,
    'bacon': 7,
    'lettuce': 5,
    'berries': 3,
    'avocado': 3
  };

  static async loadUserCategories(): Promise<string[]> {
    try {
      const storedCategories = await AsyncStorage.getItem(this.CATEGORIES_STORAGE_KEY);
      return storedCategories ? JSON.parse(storedCategories) : [];
    } catch (error) {
      console.error('Error loading categories:', error);
      return [];
    }
  }

  static async saveUserCategories(categories: string[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    } catch (error) {
      console.error('Error saving categories:', error);
    }
  }
  
  static getDefaultCategories(): string[] {
    return [...this.DEFAULT_CATEGORIES];
  }

  static inferCategory(itemName: string): string {
    const lowerName = itemName.toLowerCase();
    
    for (const [category, keywords] of Object.entries(this.CATEGORY_MAPPINGS)) {
      if (keywords.some(keyword => lowerName.includes(keyword))) {
        return category;
      }
    }

    return 'Other';
  }

  static getDefaultExpirationDays(itemName: string): number {
    const lowerName = itemName.toLowerCase();
    
    for (const [item, days] of Object.entries(this.ITEM_EXPIRATIONS)) {
      if (lowerName.includes(item)) {
        return days;
      }
    }
    
    const category = this.inferCategory(itemName);
    return this.CATEGORY_EXPIRATIONS[category] || this.CATEGORY_EXPIRATIONS.Other;
  }
}
