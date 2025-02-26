import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';
import { RecipePreferences } from '@/hooks/useRecipes';

interface MealTypeSelectorProps {
  selectedMealType: RecipePreferences['mealType'];
  onMealTypeChange: (type: RecipePreferences['mealType']) => void;
}

export default function MealTypeSelector({ selectedMealType, onMealTypeChange }: MealTypeSelectorProps) {
  return (
    <View style={styles.mealTypeContainer}>
      <Text style={styles.sectionLabel}>Meal Type</Text>
      <View style={styles.mealTypeButtons}>
        <MealTypeButton 
          icon="sunny-outline" 
          label="Breakfast"
          isSelected={selectedMealType === 'breakfast'}
          onPress={() => onMealTypeChange('breakfast')}
        />
        <MealTypeButton 
          icon="restaurant-outline" 
          label="Lunch/Dinner"
          isSelected={selectedMealType === 'lunch-dinner'}
          onPress={() => onMealTypeChange('lunch-dinner')}
        />
      </View>
    </View>
  );
}

interface MealTypeButtonProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

export const MealTypeButton = ({ 
  icon, 
  label, 
  isSelected, 
  onPress 
}: MealTypeButtonProps) => (
  <Pressable 
    style={[styles.mealTypeButton, isSelected && styles.mealTypeButtonSelected]}
    onPress={onPress}
  >
    <Ionicons 
      name={icon} 
      size={20} 
      color={isSelected ? theme.colors.background.primary : theme.colors.text.primary} 
    />
    <Text style={[
      styles.mealTypeButtonText,
      isSelected && styles.mealTypeButtonTextSelected
    ]}>
      {label}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  mealTypeContainer: {
    marginTop: theme.spacing.sm,
  },
  sectionLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  mealTypeButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  mealTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
  },
  mealTypeButtonSelected: {
    backgroundColor: theme.colors.primary,
  },
  mealTypeButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
  },
  mealTypeButtonTextSelected: {
    color: theme.colors.background.primary,
    fontWeight: '600',
  },
});
