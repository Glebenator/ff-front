import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';
import { sharedStyles } from '@/styles/sharedStyles';
import { type RecipePreferences } from '@/hooks/useRecipes';

interface PreferencesSectionProps {
  preferences: RecipePreferences;
  isLoading: boolean;
  onPreferenceSelect: (key: keyof Omit<RecipePreferences, 'mealType'>) => void;
  onMealTypeChange: (type: RecipePreferences['mealType']) => void;
  onGenerateRecipes: () => void;
}

export default function PreferencesSection({
  preferences,
  isLoading,
  onPreferenceSelect,
  onMealTypeChange,
  onGenerateRecipes
}: PreferencesSectionProps) {
  return (
    <View style={styles.container}>
      <Text style={sharedStyles.subtitle as any}>Meal Type</Text>
      <View style={styles.mealTypeRow}>
        <MealTypeButton
          title="Breakfast"
          active={preferences.mealType === 'breakfast'}
          onPress={() => onMealTypeChange('breakfast')}
        />
        <MealTypeButton
          title="Lunch/Dinner"
          active={preferences.mealType === 'lunch-dinner'}
          onPress={() => onMealTypeChange('lunch-dinner')}
        />
      </View>

      <Text style={[sharedStyles.subtitle as any, styles.preferencesTitle]}>Preferences</Text>
      <View style={styles.preferencesRow}>
        <PreferenceButton 
          title="Quick Meals"
          icon="timer-outline"
          active={preferences.quickMeals}
          onPress={() => onPreferenceSelect('quickMeals')}
        />
        <PreferenceButton 
          title="Use Expiring"
          icon="alert-circle-outline"
          active={preferences.useExpiring}
          onPress={() => onPreferenceSelect('useExpiring')}
        />
        <PreferenceButton 
          title="High Protein"
          icon="fitness-outline"
          active={preferences.proteinPlus}
          onPress={() => onPreferenceSelect('proteinPlus')}
        />
      </View>
      <View style={styles.preferencesRow}>
        <PreferenceButton 
          title="Min Shopping"
          icon="cart-outline"
          active={preferences.minimalShopping}
          onPress={() => onPreferenceSelect('minimalShopping')}
        />
        <PreferenceButton 
          title="Vegetarian"
          icon="leaf-outline"
          active={preferences.vegetarian}
          onPress={() => onPreferenceSelect('vegetarian')}
        />
        <PreferenceButton 
          title="Healthy"
          icon="heart-outline"
          active={preferences.healthy}
          onPress={() => onPreferenceSelect('healthy')}
        />
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.generateButton,
          pressed && styles.generateButtonPressed,
          isLoading && styles.generateButtonDisabled
        ]}
        onPress={onGenerateRecipes}
        disabled={isLoading}
      >
        <Ionicons 
          name="restaurant-outline" 
          size={20} 
          color={theme.colors.background.primary} 
        />
        <Text style={styles.generateButtonText}>
          {isLoading ? 'Generating...' : 'Generate New Recipes'}
        </Text>
      </Pressable>
    </View>
  );
}

interface MealTypeButtonProps {
  title: string;
  active: boolean;
  onPress: () => void;
}

function MealTypeButton({ title, active, onPress }: MealTypeButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.mealTypeButton,
        active && styles.activeMealType,
        pressed && styles.pressedButton
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.mealTypeText,
        active && styles.activeMealTypeText
      ]}>
        {title}
      </Text>
    </Pressable>
  );
}

interface PreferenceButtonProps {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  active: boolean;
  onPress: () => void;
}

function PreferenceButton({ title, icon, active, onPress }: PreferenceButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.preferenceButton,
        active && styles.activePreference,
        pressed && styles.pressedButton
      ]}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={20}
        color={active ? theme.colors.background.primary : theme.colors.text.primary}
      />
      <Text style={[
        styles.preferenceText,
        active && styles.activePreferenceText
      ]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
  },
  mealTypeRow: {
    flexDirection: 'row',
    marginTop: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  mealTypeButton: {
    flex: 1,
    backgroundColor: theme.colors.background.tertiary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  activeMealType: {
    backgroundColor: theme.colors.primary,
  },
  mealTypeText: {
    fontSize: theme.fontSize.md,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  activeMealTypeText: {
    color: theme.colors.background.primary,
  },
  preferencesTitle: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  preferencesRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  preferenceButton: {
    flex: 1,
    backgroundColor: theme.colors.background.tertiary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  activePreference: {
    backgroundColor: theme.colors.primary,
  },
  pressedButton: {
    opacity: 0.8,
  },
  preferenceText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  activePreferenceText: {
    color: theme.colors.background.primary,
  },
  generateButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  generateButtonPressed: {
    opacity: 0.8,
  },
  generateButtonDisabled: {
    backgroundColor: theme.colors.text.secondary,
    opacity: 0.7,
  },
  generateButtonText: {
    color: theme.colors.background.primary,
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
});
