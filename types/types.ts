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

// Recipe sorting types
export type RecipeSortType = 
  | 'name-asc' 
  | 'name-desc' 
  | 'date-generated-newest' 
  | 'date-generated-oldest' 
  | 'ingredients-asc' 
  | 'ingredients-desc';

// Category icon mapping type
export interface CategoryIconMapping {
  [key: string]: React.ComponentProps<typeof import('@expo/vector-icons').Ionicons>['name'];
}

// Home screen types
export type ExpiryStatus = {
  expiringSoon: number;
  expired: number;
  total: number;
};

export type StatusInfoType = {
  color: string;
  count: number;
  message: string;
};

export interface StatusCardProps {
  status: ExpiryStatus;
}

export interface QuickActionButtonProps {
  icon: React.ComponentProps<typeof import('@expo/vector-icons').Ionicons>['name'];
  text: string;
  color: string;
  onPress: () => void;
}

// Form validation types
export interface ValidationError {
  [key: string]: string;
}

// Ingredient form data type
export interface IngredientFormData {
  name: string;
  quantity: string;
  category: string;
  notes: string;
  expiryDate: Date;
  debugDate?: string;
}
