import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';
import { RecipePreferences } from '@/hooks/useRecipes';

interface PreferenceGridProps {
  preferences: RecipePreferences;
  onPreferenceSelect: (key: keyof Omit<RecipePreferences, 'mealType'>) => void;
}

interface PreferenceItem {
  key: keyof Omit<RecipePreferences, 'mealType'>;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  subtitle: string;
}

export default function PreferenceGrid({ preferences, onPreferenceSelect }: PreferenceGridProps) {
  const preferencesConfig: PreferenceItem[] = [
    {
      key: 'quickMeals',
      icon: 'flash-outline',
      label: 'Quick Meals',
      subtitle: 'Under 30 mins',
    },
    {
      key: 'useExpiring',
      icon: 'leaf-outline',
      label: 'Use Expiring',
      subtitle: 'Priority ingredients',
    },
    {
      key: 'proteinPlus',
      icon: 'barbell-outline',
      label: 'Protein Plus',
      subtitle: 'High protein',
    },
    {
      key: 'minimalShopping',
      icon: 'basket-outline',
      label: 'Low Shopping',
      subtitle: 'Use what you have',
    },
    {
      key: 'vegetarian',
      icon: 'leaf-outline',
      label: 'Vegetarian',
      subtitle: 'Plant-based',
    },
    {
      key: 'healthy',
      icon: 'heart-outline',
      label: 'Healthy',
      subtitle: 'Balanced meals',
    }
  ];

  return (
    <View style={styles.preferencesGrid}>
      {preferencesConfig.map((item) => (
        <PreferenceButton
          key={item.key}
          icon={item.icon}
          label={item.label}
          subtitle={item.subtitle}
          isSelected={preferences[item.key]}
          onSelect={() => onPreferenceSelect(item.key)}
        />
      ))}
    </View>
  );
}

interface PreferenceButtonProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  subtitle: string;
  isSelected: boolean;
  onSelect: () => void;
}

export const PreferenceButton = ({ 
  icon, 
  label, 
  subtitle,
  isSelected, 
  onSelect 
}: PreferenceButtonProps) => (
  <Pressable 
    style={[styles.preferenceButton, isSelected && styles.preferenceButtonSelected]}
    onPress={onSelect}
  >
    <Ionicons 
      name={icon} 
      size={24} 
      color={isSelected ? theme.colors.background.primary : theme.colors.text.primary} 
    />
    <Text style={[
      styles.preferenceButtonTitle,
      isSelected && styles.preferenceButtonTitleSelected
    ]}>
      {label}
    </Text>
    <Text style={[
      styles.preferenceButtonSubtitle,
      isSelected && styles.preferenceButtonSubtitleSelected
    ]}>
      {subtitle}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  preferencesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  preferenceButton: {
    width: '48%', // 2-column layout
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  preferenceButtonSelected: {
    backgroundColor: theme.colors.primary,
  },
  preferenceButtonTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.xs,
  },
  preferenceButtonTitleSelected: {
    color: theme.colors.background.primary,
  },
  preferenceButtonSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  preferenceButtonSubtitleSelected: {
    color: theme.colors.background.primary,
    opacity: 0.9,
  },
});
