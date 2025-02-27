import AsyncStorage from '@react-native-async-storage/async-storage';

export class CategoryUtils {
  private static CATEGORIES_STORAGE_KEY = 'user_categories';

  private static readonly DEFAULT_CATEGORIES = [
    'Fruits', 'Vegetables', 'Dairy', 'Meat', 'Seafood', 
    'Bakery', 'Pantry', 'Frozen'
  ];

  private static readonly CATEGORY_MAPPINGS: { [key: string]: string[] } = {
    Dairy: ['milk', 'cheese', 'yogurt', 'butter', 'cream'],
    Meat: ['chicken', 'beef', 'pork', 'fish', 'salmon'],
    Vegetables: ['carrot', 'lettuce', 'tomato', 'cucumber', 'pepper'],
    Fruits: ['apple', 'banana', 'orange', 'grape', 'berry'],
    Beverages: ['juice', 'soda', 'water', 'tea', 'coffee'],
    Condiments: ['ketchup', 'mustard', 'mayo', 'sauce', 'dressing']
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
}
