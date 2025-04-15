// components/recipes/sort/SortButton.tsx
import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';
import { type RecipeSortType } from '@/types/types';

interface SortButtonProps {
  sortOrder: RecipeSortType;
  onPress: () => void;
}

const getSortLabel = (sortOrder: RecipeSortType): string => {
  switch (sortOrder) {
    case 'name-asc':
      return 'Name (A-Z)';
    case 'name-desc':
      return 'Name (Z-A)';
    case 'date-generated-newest':
      return 'Newest First';
    case 'date-generated-oldest':
      return 'Oldest First';
    case 'ingredients-asc':
      return 'Fewer Ingredients';
    case 'ingredients-desc':
      return 'More Ingredients';
    default:
      return 'Sort';
  }
};

const SortButton: React.FC<SortButtonProps> = ({ sortOrder, onPress }) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed
      ]}
      onPress={onPress}
    >
      <Ionicons name="funnel-outline" size={16} color={theme.colors.text.primary} />
      <Text style={styles.buttonText}>
        {getSortLabel(sortOrder)}
      </Text>
      <Ionicons name="chevron-down" size={16} color={theme.colors.text.primary} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
});

export default SortButton;