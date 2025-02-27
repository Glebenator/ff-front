import { View, Pressable, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';
import { type CategoryIconMapping } from '@/types/types';

interface CategoryFiltersProps {
  categories: string[];
  selectedCategory: string | null;
  setSelectedCategory: (category: string) => void;
}

export default function CategoryFilters({ 
  categories, 
  selectedCategory, 
  setSelectedCategory 
}: CategoryFiltersProps) {
  // Map of category names to icons
  const categoryIcons: CategoryIconMapping = {
    'all': 'apps-outline',
    'Dairy': 'water-outline',
    'Meat': 'restaurant-outline',
    'Seafood': 'fish-outline',
    'Vegetables': 'leaf-outline',
    'Fruits': 'nutrition-outline',
    'Beverages': 'cafe-outline',
    'Condiments': 'flask-outline',
    'Leftovers': 'fast-food-outline',
    'Deli': 'pizza-outline',
    'Desserts': 'ice-cream-outline',
    'Other': 'ellipsis-horizontal-outline'
  };

  // Ensure "All" is at the beginning and "Other" is at the end, but avoid duplicates
  let displayCategories: string[] = [];
  
  // First add "all" if it's not already in the categories
  if (!categories.includes('all')) {
    displayCategories.push('all');
  }
  
  // Then add all the categories without duplicates
  categories.forEach(category => {
    if (!displayCategories.includes(category)) {
      displayCategories.push(category);
    }
  });
  
  // Finally add "Other" if it's not already in the list
  if (!displayCategories.includes('Other')) {
    displayCategories.push('Other');
  }

  return (
    <View style={styles.categoryFilterContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scrollViewContent}
      >
        {displayCategories.map((category, index) => (
          <Pressable
            key={`category-${category}-${index}`}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Ionicons 
              name={categoryIcons[category] || 'help-outline'} 
              size={18} 
              color={selectedCategory === category ? 
                theme.colors.background.primary : 
                theme.colors.text.primary} 
            />
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategory === category && styles.categoryButtonTextActive,
              ]}
              numberOfLines={1}
            >
              {category === 'all' ? 'All' : category}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  categoryFilterContainer: {
    paddingVertical: theme.spacing.xs,
  },
  scrollViewContent: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.xs,
  },
  categoryButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xxs,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.xs,
    minWidth: 70,
    maxWidth: 90,
  },
  categoryButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  categoryButtonText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  categoryButtonTextActive: {
    color: theme.colors.background.primary,
    fontWeight: '600',
  },
});
