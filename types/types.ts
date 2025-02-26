// Central type definitions for the FridgeFriend app

// Ingredient related types
export interface Ingredient {
  id?: number;
  name: string;
  category?: string;
  quantity: string;
  expiryDate: string;
  dateAdded: string;
  notes?: string;
}

// Filter and sort types
export type FilterType = 'all' | 'expiring-soon' | 'expired';

export type SortType = 
  | 'expiry-asc' 
  | 'expiry-desc' 
  | 'name-asc' 
  | 'name-desc' 
  | 'date-added-newest' 
  | 'date-added-oldest';

// Category icon mapping type
export interface CategoryIconMapping {
  [key: string]: React.ComponentProps<typeof import('@expo/vector-icons').Ionicons>['name'];
}
