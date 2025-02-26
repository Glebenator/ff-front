import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';
import { sharedStyles } from '@/styles/sharedStyles';
import { RecipePreferences } from '@/hooks/useRecipes';
import MealTypeSelector from './MealTypeSelector';
import PreferenceGrid from './PreferenceGrid';

interface PreferencesSectionProps {
  preferences: RecipePreferences;
  isLoading: boolean;
  onMealTypeChange: (type: RecipePreferences['mealType']) => void;
  onPreferenceSelect: (key: keyof Omit<RecipePreferences, 'mealType'>) => void;
  onGenerateRecipes: () => void;
}

export default function PreferencesSection({
  preferences,
  isLoading,
  onMealTypeChange,
  onPreferenceSelect,
  onGenerateRecipes
}: PreferencesSectionProps) {
  // Preferences state - dropdown is collapsed by default
  const [showPreferences, setShowPreferences] = useState(false);
  
  // Animation
  const animation = useRef(new Animated.Value(0)).current;

  // Toggle preferences dropdown with animation
  const togglePreferences = useCallback(() => {
    setShowPreferences(!showPreferences);
    Animated.timing(animation, {
      toValue: !showPreferences ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showPreferences, animation]);

  // Animation interpolation for dropdown height
  const heightInterpolate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 540], // Adjust this height as needed
  });

  const selectedFiltersCount = Object.values(preferences).filter(Boolean).length - 1;

  return (
    <View style={styles.preferencesSection}>
      <View style={[sharedStyles.card, styles.preferencesCard]}>
        {/* Preferences Toggle Header */}
        <Pressable 
          onPress={togglePreferences}
          style={styles.preferencesHeader}
        >
          <View style={styles.preferencesHeaderContent}>
            <Ionicons
              name="options-outline"
              size={20}
              color={theme.colors.text.primary}
            />
            <Text style={styles.preferencesHeaderText}>
              Recipe Preferences {selectedFiltersCount > 0 && `(${selectedFiltersCount} selected)`}
            </Text>
          </View>
          <Ionicons 
            name={showPreferences ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={theme.colors.text.secondary} 
          />
        </Pressable>
        
        {/* Animated Dropdown Content */}
        <Animated.View style={{ height: heightInterpolate, overflow: 'hidden' }}>
          {/* Meal Type Selection */}
          <MealTypeSelector 
            selectedMealType={preferences.mealType}
            onMealTypeChange={onMealTypeChange}
          />

          <View style={styles.filterSeparator} />

          {/* Preferences Grid */}
          <Text style={styles.sectionLabel}>Dietary Preferences</Text>
          <PreferenceGrid 
            preferences={preferences}
            onPreferenceSelect={onPreferenceSelect}
          />
        </Animated.View>

        {/* Generate Button - Always Visible */}
        <Pressable
          style={[styles.generateButton, isLoading && styles.generateButtonDisabled]}
          onPress={onGenerateRecipes}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <ActivityIndicator color={theme.colors.text.primary} />
              <Text style={styles.generateButtonText}>
                Generating recipes...
              </Text>
            </>
          ) : (
            <>
              <Ionicons 
                name="sparkles" 
                size={20} 
                color={theme.colors.background.primary} 
              />
              <Text style={styles.generateButtonText}>
                Generate New Recipes
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  preferencesSection: {
    padding: theme.spacing.md,
  },
  preferencesCard: {
    gap: theme.spacing.md,
  },
  preferencesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
  },
  preferencesHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  preferencesHeaderText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  sectionLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  filterSeparator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border.primary,
    marginVertical: theme.spacing.md,
  },
  generateButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  generateButtonDisabled: {
    backgroundColor: theme.colors.background.secondary,
  },
  generateButtonText: {
    color: theme.colors.background.primary,
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
});
