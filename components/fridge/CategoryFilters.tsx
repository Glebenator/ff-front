import { View, Pressable, Text, StyleSheet } from 'react-native';
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
    'Vegetables': 'leaf-outline',
    'Fruits': 'nutrition-outline',
    'Beverages': 'cafe-outline',
    'Condiments': 'flask-outline',
    'Other': 'ellipsis-horizontal-outline'
  };

  // Ensure "Other" is included in the displayed categories
  const displayCategories = categories.includes('Other') ? 
    categories : 
    [...categories, 'Other'];

  return (
    <View style={styles.categoryFilterContainer}>
      <View style={styles.categoryGrid}>
        {displayCategories.map(category => (
          <Pressable
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Ionicons 
              name={categoryIcons[category] || 'help-outline'} 
              size={22} 
              color={selectedCategory === category ? 
                theme.colors.background.primary : 
                theme.colors.text.primary} 
            />
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategory === category && styles.categoryButtonTextActive,
              ]}
            >
              {category === 'all' ? 'All' : category}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  categoryFilterContainer: {
    paddingVertical: theme.spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: theme.spacing.xs,
  },
  categoryButton: {
    width: '31%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
  },
  categoryButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  categoryButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
  },
  categoryButtonTextActive: {
    color: theme.colors.background.primary,
    fontWeight: '600',
  },
});
