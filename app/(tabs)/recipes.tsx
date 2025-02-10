// app/(tabs)/recipes.tsx
import React, { useState, useCallback } from 'react';
import { View, ScrollView, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';
import { sharedStyles } from '@/styles/sharedStyles';
import { useRecipes } from '@/hooks/useRecipes';
import { useFavorites } from '@/hooks/useFavorites';
import RecipeList from '@/components/RecipeList';
import { type RecipePreferences } from '@/hooks/useRecipes';

export default function RecipeScreen() {
  // Tab state
  const [activeTab, setActiveTab] = useState<'suggested' | 'favorites' | 'recent'>('suggested');
  
  // Preferences state
  const [showPreferences, setShowPreferences] = useState(true);
  const [preferences, setPreferences] = useState<RecipePreferences>({
    mealType: 'lunch-dinner',
    quickMeals: false,
    useExpiring: false,
    proteinPlus: false,
    minimalShopping: false,
    vegetarian: false,
    healthy: false
  });

  // Hooks
  const { recipes, isLoading, error, generateRecipes } = useRecipes();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  // Handlers
  const handlePreferenceSelect = useCallback((key: keyof Omit<RecipePreferences, 'mealType'>) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);

  const handleMealTypeChange = useCallback((type: RecipePreferences['mealType']) => {
    setPreferences(prev => ({
      ...prev,
      mealType: type
    }));
  }, []);

  const handleGenerate = useCallback(async () => {
    try {
      await generateRecipes(preferences);
    } catch (err) {
      console.error('Failed to generate recipes:', err);
    }
  }, [generateRecipes, preferences]);

  // Get recipes based on active tab
  const getDisplayRecipes = () => {
    switch (activeTab) {
      case 'favorites':
        return favorites || [];
      case 'suggested':
        return recipes || [];
      case 'recent':
        return [];
      default:
        return [];
    }
  };

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TabButton 
          label="Suggested" 
          icon="bulb-outline"
          isActive={activeTab === 'suggested'}
          onPress={() => setActiveTab('suggested')}
        />
        <TabButton 
          label="Favorites" 
          icon="heart-outline"
          isActive={activeTab === 'favorites'}
          onPress={() => setActiveTab('favorites')}
        />
        <TabButton 
          label="Recent" 
          icon="time-outline"
          isActive={activeTab === 'recent'}
          onPress={() => setActiveTab('recent')}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'suggested' && (
          <>
            {/* Preferences Section */}
            <View style={styles.preferencesSection}>
              <View style={[sharedStyles.card, styles.preferencesCard]}>
                {/* Meal Type Selection */}
                <View style={styles.mealTypeContainer}>
                  <Text style={styles.sectionLabel}>Meal Type</Text>
                  <View style={styles.mealTypeButtons}>
                    <MealTypeButton 
                      icon="sunny-outline" 
                      label="Breakfast"
                      isSelected={preferences.mealType === 'breakfast'}
                      onPress={() => handleMealTypeChange('breakfast')}
                    />
                    <MealTypeButton 
                      icon="restaurant-outline" 
                      label="Lunch/Dinner"
                      isSelected={preferences.mealType === 'lunch-dinner'}
                      onPress={() => handleMealTypeChange('lunch-dinner')}
                    />
                  </View>
                </View>

                {/* Preferences Toggle */}
                <Pressable 
                  onPress={() => setShowPreferences(!showPreferences)}
                  style={styles.preferencesHeader}
                >
                  <Text style={styles.sectionLabel}>
                    Preferences {Object.values(preferences).filter(Boolean).length - 1 > 0 && 
                      `(${Object.values(preferences).filter(Boolean).length - 1} selected)`}
                  </Text>
                  <Ionicons 
                    name={showPreferences ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={theme.colors.text.secondary} 
                  />
                </Pressable>
                
                {/* Preferences Grid */}
                {showPreferences && (
                  <View style={styles.preferencesGrid}>
                    <PreferenceButton 
                      icon="flash-outline" 
                      label="Quick Meals"
                      subtitle="Under 30 mins" 
                      isSelected={preferences.quickMeals}
                      onSelect={() => handlePreferenceSelect('quickMeals')}
                    />
                    <PreferenceButton 
                      icon="leaf-outline" 
                      label="Use Expiring"
                      subtitle="Priority ingredients" 
                      isSelected={preferences.useExpiring}
                      onSelect={() => handlePreferenceSelect('useExpiring')}
                    />
                    <PreferenceButton 
                      icon="barbell-outline" 
                      label="Protein Plus"
                      subtitle="High protein meals" 
                      isSelected={preferences.proteinPlus}
                      onSelect={() => handlePreferenceSelect('proteinPlus')}
                    />
                    <PreferenceButton 
                      icon="basket-outline" 
                      label="Minimal Shopping"
                      subtitle="Use what you have" 
                      isSelected={preferences.minimalShopping}
                      onSelect={() => handlePreferenceSelect('minimalShopping')}
                    />
                    <PreferenceButton 
                      icon="leaf-outline" 
                      label="Vegetarian"
                      subtitle="Plant-based meals" 
                      isSelected={preferences.vegetarian}
                      onSelect={() => handlePreferenceSelect('vegetarian')}
                    />
                    <PreferenceButton 
                      icon="heart-outline" 
                      label="Healthy"
                      subtitle="Balanced meals" 
                      isSelected={preferences.healthy}
                      onSelect={() => handlePreferenceSelect('healthy')}
                    />
                  </View>
                )}

                {/* Generate Button */}
                <Pressable
                  style={[styles.generateButton, isLoading && styles.generateButtonDisabled]}
                  onPress={handleGenerate}
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

            {/* Recipe List */}
            <View style={styles.recipeListSection}>
              <Text style={[sharedStyles.subtitle, styles.recipeListHeader]}>
                {getDisplayRecipes().length > 0 ? 'Available Recipes' : 'No Recipes Generated Yet'}
              </Text>
              <RecipeList
                recipes={getDisplayRecipes()}
                isLoading={isLoading}
                error={error}
                onRetry={handleGenerate}
                onFavoriteToggle={toggleFavorite}
                isFavorite={isFavorite}
              />
            </View>
          </>
        )}

        {activeTab === 'favorites' && (
          <View style={styles.recipeListSection}>
            <RecipeList
              recipes={getDisplayRecipes()}
              isLoading={false}
              error={null}
              onRetry={() => {}}
              onFavoriteToggle={toggleFavorite}
              isFavorite={isFavorite}
            />
          </View>
        )}

        {activeTab === 'recent' && (
          <View style={styles.recipeListSection}>
            <RecipeList
              recipes={[]}
              isLoading={false}
              error={null}
              onRetry={() => {}}
              onFavoriteToggle={toggleFavorite}
              isFavorite={isFavorite}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// Helper Components
const TabButton = ({ 
  label, 
  icon, 
  isActive, 
  onPress 
}: { 
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  isActive: boolean;
  onPress: () => void;
}) => (
  <Pressable 
    style={[styles.tabButton, isActive && styles.tabButtonActive]}
    onPress={onPress}
  >
    <Ionicons 
      name={icon} 
      size={18} 
      color={isActive ? theme.colors.primary : theme.colors.text.secondary} 
    />
    <Text style={[
      styles.tabButtonText,
      isActive && styles.tabButtonTextActive
    ]}>
      {label}
    </Text>
  </Pressable>
);

const MealTypeButton = ({ 
  icon, 
  label, 
  isSelected, 
  onPress 
}: { 
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  isSelected: boolean;
  onPress: () => void;
}) => (
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

const PreferenceButton = ({ 
  icon, 
  label, 
  subtitle,
  isSelected, 
  onSelect 
}: { 
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  subtitle: string;
  isSelected: boolean;
  onSelect: () => void;
}) => (
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
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: theme.colors.border.primary,
    height: 45,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  tabButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  tabButtonTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  preferencesSection: {
    padding: theme.spacing.md,
  },
  preferencesCard: {
    gap: theme.spacing.lg,
  },
  sectionLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  mealTypeContainer: {
    gap: theme.spacing.sm,
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
    padding: theme.spacing.md,
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
  preferencesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preferencesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  preferenceButton: {
    width: '48%',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'flex-start',
  },
  preferenceButtonSelected: {
    backgroundColor: theme.colors.primary,
  },
  preferenceButtonTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.xs,
  },
  preferenceButtonTitleSelected: {
    color: theme.colors.background.primary,
  },
  preferenceButtonSubtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  preferenceButtonSubtitleSelected: {
    color: theme.colors.background.primary,
  },
  generateButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  generateButtonDisabled: {
    backgroundColor: theme.colors.background.secondary,
  },
  generateButtonText: {
    color: theme.colors.background.primary,
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
  recipeListSection: {
    flex: 1,
    padding: theme.spacing.md,
  },
  recipeListHeader: {
    marginBottom: theme.spacing.md,
  },
});