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
      <Ionicons name="funnel-outline" size={14} color={theme.colors.primary} />
      <Text style={styles.buttonText} numberOfLines={1} ellipsizeMode="tail">
        {getSortLabel(sortOrder)}
      </Text>
      <Ionicons name="chevron-down" size={12} color={theme.colors.primary} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(83, 209, 129, 0.1)',
    borderRadius: 16,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(83, 209, 129, 0.2)',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    fontSize: theme.fontSize.xs,
    fontWeight: '500',
    color: theme.colors.primary,
    maxWidth: 100,
  },
});

export default SortButton;