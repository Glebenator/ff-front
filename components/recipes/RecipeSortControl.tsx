// components/recipes/RecipeSortControl.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';

export type SortOption = 
  | 'match' 
  | 'alphabetical' 
  | 'date' 
  | 'time' 
  | 'missing';

interface SortOptionDefinition {
  id: SortOption;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  description: string;
}

export const SORT_OPTIONS: SortOptionDefinition[] = [
  { 
    id: 'match', 
    label: 'Match %', 
    icon: 'checkmark-circle-outline',
    description: 'Sort by ingredient match percentage'
  },
  { 
    id: 'alphabetical', 
    label: 'A-Z', 
    icon: 'text-outline',
    description: 'Sort alphabetically by title'
  },
  { 
    id: 'date', 
    label: 'Date', 
    icon: 'calendar-outline',
    description: 'Sort by date added'
  },
  { 
    id: 'time', 
    label: 'Time', 
    icon: 'time-outline',
    description: 'Sort by cooking time'
  },
  { 
    id: 'missing', 
    label: 'Needed', 
    icon: 'alert-circle-outline',
    description: 'Sort by fewest missing ingredients'
  }
];

interface RecipeSortControlProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  ascending: boolean;
  onDirectionChange: () => void;
}

export default function RecipeSortControl({
  currentSort,
  onSortChange,
  ascending,
  onDirectionChange
}: RecipeSortControlProps) {
  const currentOption = SORT_OPTIONS.find(opt => opt.id === currentSort) || SORT_OPTIONS[0];

  return (
    <View style={styles.container}>
      <View style={styles.sortLabel}>
        <Text style={styles.labelText}>Sort by:</Text>
      </View>

      <Pressable 
        style={styles.selector}
        onPress={() => {
          // Cycle through sort options
          const currentIndex = SORT_OPTIONS.findIndex(opt => opt.id === currentSort);
          const nextIndex = (currentIndex + 1) % SORT_OPTIONS.length;
          onSortChange(SORT_OPTIONS[nextIndex].id);
        }}
      >
        <Ionicons name={currentOption.icon} size={18} color={theme.colors.primary} />
        <Text style={styles.selectorText}>{currentOption.label}</Text>
        <Ionicons name="chevron-down" size={16} color={theme.colors.text.secondary} />
      </Pressable>

      <Pressable 
        style={styles.directionButton} 
        onPress={onDirectionChange}
      >
        <Ionicons 
          name={ascending ? "arrow-up" : "arrow-down"} 
          size={18} 
          color={theme.colors.primary} 
        />
      </Pressable>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>{currentOption.description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  sortLabel: {
    marginRight: theme.spacing.sm,
  },
  labelText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  selectorText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
    marginRight: theme.spacing.xs,
  },
  directionButton: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
  },
  infoContainer: {
    width: '100%',
    marginTop: 4,
  },
  infoText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
  }
});