import { View, Pressable, Text, StyleSheet, Animated } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';
import SearchBar from '@/components/SearchBar';
import ExpiryFilters from './ExpiryFilters';
import CategoryFilters from './CategoryFilters';
import { type FilterType, type SortType } from '@/types/types';

interface FiltersSectionProps {
  filter: FilterType;
  setFilter: (filter: FilterType) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string) => void;
  categories: string[];
  sortOrder: SortType;
  onSortPress: () => void;
}

export default function FiltersSection({
  filter,
  setFilter,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
  sortOrder,
  onSortPress
}: FiltersSectionProps) {
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animation, {
      toValue: isFiltersExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isFiltersExpanded, animation]);

  const heightInterpolate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 280],
  });

  const getSortIndicatorText = () => {
    switch (sortOrder) {
      case 'expiry-asc':
        return 'Expiry (Asc)';
      case 'expiry-desc':
        return 'Expiry (Desc)';
      case 'name-asc':
        return 'Name (A-Z)';
      case 'name-desc':
        return 'Name (Z-A)';
      case 'date-added-newest':
        return 'Date (Newest)';
      case 'date-added-oldest':
        return 'Date (Oldest)';
      default:
        return 'Unknown Sort Order';
    }
  };

  return (
    <View style={styles.filtersContainer}>
      <Pressable
        style={styles.filtersButton}
        onPress={() => setIsFiltersExpanded(!isFiltersExpanded)}
      >
        <View style={styles.filtersButtonContent}>
          <Ionicons
            name="options-outline"
            size={20}
            color={theme.colors.text.primary}
          />
          <Text style={styles.filtersButtonText}>Filters & Categories</Text>
        </View>
        <Ionicons
          name={isFiltersExpanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={theme.colors.text.primary}
        />
      </Pressable>

      <Animated.View style={{ height: heightInterpolate, overflow: 'hidden' }}>
        <>
          {/* Expiry Date Filters */}
          <ExpiryFilters filter={filter} setFilter={setFilter} />

          <View style={styles.filterSeparator} />

          {/* Category Filters */}
          <CategoryFilters
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />

          <View style={styles.filterSeparator} />

          {/* Search Bar */}
          <SearchBar
            value={searchTerm}
            onChangeText={setSearchTerm}
            onClear={() => setSearchTerm('')}
            sortIndicatorText={getSortIndicatorText()}
            onSortPress={onSortPress}
          />
        </>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  filtersContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.background.secondary,
    borderBottomLeftRadius: theme.borderRadius.md,
    borderBottomRightRadius: theme.borderRadius.md,
  },
  filtersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.background.secondary,
  },
  filtersButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  filtersButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  filterSeparator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border.primary,
    marginVertical: theme.spacing.xs,
  },
});
