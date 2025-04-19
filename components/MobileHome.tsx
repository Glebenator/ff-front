// components/MobileHome.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Image, ScrollView, Dimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
// REMOVE: import AsyncStorage from '@react-native-async-storage/async-storage'; // No longer needed here
import { useFavorites } from '@/hooks/useFavorites';
import { useRecipes } from '@/hooks/useRecipes'; // Correct hook import
import { ingredientDb } from '@/services/database/ingredientDb';
import { GeminiService, type Recipe } from '@/services/api/recipeGenerationService';
import RecipeDetailModal from '@/components/recipes/RecipeDetailModal';
import { theme } from '@/styles/theme';
import { sharedStyles } from '@/styles/sharedStyles';
import {
  ExpiryStatus,
  StatusInfoType,
  StatusCardProps,
  QuickActionButtonProps
} from '@/types/types';

// --- MobileHome, StatusCard, WellMaintainedCard components remain the same ---
export const MobileHome: React.FC = () => {
  // ... (existing MobileHome logic)
  const [status, setStatus] = useState<ExpiryStatus>({
    expiringSoon: 0,
    expired: 0,
    total: 0
  });

  const loadExpiryStatus = useCallback((): void => {
    try {
      const expiringItems = ingredientDb.getExpiringSoon(3);
      const allItems = ingredientDb.getAll();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const expiredItems = allItems.filter(item => {
        const expiryDate = new Date(item.expiryDate);
        expiryDate.setHours(0, 0, 0, 0);
        return expiryDate < today;
      });

      setStatus({
        expiringSoon: expiringItems.length,
        expired: expiredItems.length,
        total: allItems.length
      });
    } catch (error) {
      console.error('Error loading expiry status:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadExpiryStatus();
    }, [loadExpiryStatus])
  );

  // Navigate to debug screen
  const goToDebugScreen = () => {
    router.push('/debug');
  };

  return (
    <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={[sharedStyles.container, styles.mobileContainer]}>
        {status.expiringSoon + status.expired > 0 ? (
          <StatusCard status={status} />
        ) : (
          <WellMaintainedCard />
        )}
        <RecipeIdeas />
        <QuickActions />
      </View>
    </ScrollView>
  );
};

const StatusCard: React.FC<StatusCardProps> = ({ status }) => {
  const getStatusInfo = (): StatusInfoType => {
    if (status.expired > 0) {
      return {
        color: theme.colors.status.error,
        count: status.expired,
        message: `${status.expired} expired item${status.expired > 1 ? 's' : ''} need attention`
      };
    }
    if (status.expiringSoon > 0) {
      return {
        color: theme.colors.status.warning,
        count: status.expiringSoon,
        message: `${status.expiringSoon} item${status.expiringSoon > 1 ? 's' : ''} expiring soon`
      };
    }
    return {
      color: theme.colors.primary,
      count: 0,
      message: "No items need attention"
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <Pressable
      style={[styles.card, { borderLeftWidth: 4, borderLeftColor: statusInfo.color }]}
      onPress={() => router.push('/fridge?initialFilter=all')}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Items Needing Attention</Text>
        <Text style={[styles.statusCount, { color: statusInfo.color }]}>{statusInfo.count}</Text>
      </View>
      <Text style={styles.cardText}>{statusInfo.message}</Text>
      <Text style={styles.viewAllLink}>View all {status.total} items →</Text>
    </Pressable>
  );
};

const WellMaintainedCard: React.FC = () => (
  <View style={[styles.card, styles.smallCard]}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardTitle}>Great job!</Text>
      <Ionicons name="checkmark-circle" size={28} color={theme.colors.primary} />
    </View>
    <Text style={styles.cardText}>All your items are tracked and up to date</Text>
  </View>
);


const RecipeIdeas: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [currentRecipeIndex, setCurrentRecipeIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRecipeDetail, setShowRecipeDetail] = useState(false);

  // Use hooks for state management and persistence
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addSingleRecent, generateRecipes: generateRecipesFromHook } = useRecipes(); // Use the hook's generate and addSingleRecent

  const currentRecipe = recipes[currentRecipeIndex] || null;

  // Navigate to debug screen
  const goToDebugScreen = () => {
    router.push('/debug');
  };

  // Get meal type based on current time of day
  const getMealTypeForCurrentTime = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 14) return 'lunch';
    if (hour >= 17 && hour < 21) return 'dinner';
    return 'snack'; // Default to snack
  };

  // Generate recipes using the hook's function
  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const mealType = getMealTypeForCurrentTime();
      console.log(`Generating ${mealType} recipes for RecipeIdeas`);

      const fetchedRecipes = await GeminiService.generateRecipes({
        quickMeals: true,
        mealType: mealType === 'breakfast' ? 'breakfast' : 'lunch-dinner'
      });

      if (fetchedRecipes && fetchedRecipes.length > 0) {
        setRecipes(fetchedRecipes);
        setCurrentRecipeIndex(0);
      } else {
        setRecipes([]);
      }
    } catch (err) {
      setError('Could not load recipes');
      console.error("Error fetching recipes in RecipeIdeas:", err);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch recipes when the component is first mounted
  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  // Add currently displayed recipe to recents whenever it changes using the hook
  useEffect(() => {
    if (currentRecipe) {
      console.log('HOOK: Adding current recipe to recents via useEffect:', currentRecipe.id);
      addSingleRecent(currentRecipe); // Use the hook function
    }
  }, [currentRecipeIndex, currentRecipe, addSingleRecent]);

  // Navigation functions remain the same
  const nextRecipe = () => {
    if (recipes.length === 0) return;
    setCurrentRecipeIndex((prevIndex) => (prevIndex + 1) % recipes.length);
  };

  const previousRecipe = () => {
     if (recipes.length === 0) return;
     setCurrentRecipeIndex((prevIndex) => (prevIndex - 1 + recipes.length) % recipes.length);
  };

  // Handle favorite toggle with current recipe
  const handleFavoriteToggle = useCallback(() => {
    if (currentRecipe) {
      console.log('MobileHome: Toggling favorite for recipe:', currentRecipe.id);
      toggleFavorite(currentRecipe);
    }
  }, [currentRecipe, toggleFavorite]);

  // Loading/Error/Empty states remain the same
  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.cardText}>Loading recipe ideas...</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardText}>{error}</Text>
        <Pressable onPress={fetchRecipes} style={styles.retryButton}>
           <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }
  if (!recipes.length || !currentRecipe) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardText}>No recipe ideas found.</Text>
         <Pressable onPress={fetchRecipes} style={styles.retryButton}>
           <Text style={styles.retryButtonText}>Generate Recipes</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <View style={styles.card}>
        <View style={styles.debugRow}>
          <Text style={styles.debugText} onPress={goToDebugScreen}>Debug</Text>
        </View>
        <View style={styles.recipeHeader}>
          <View style={styles.recipeTitleContainer}>
            <Ionicons name="restaurant" size={24} color={theme.colors.primary} />
            <Text style={styles.cardTitle}>Recipe Ideas</Text>
          </View>
          <Text style={styles.viewAllText} onPress={() => router.push('/recipes')}>View All</Text>
        </View>

        {currentRecipe && (
          <Pressable
            style={({ pressed }) => [
              styles.recipeCard,
              pressed && styles.cardPressed
            ]}
            onPress={() => {
                setShowRecipeDetail(true);
            }}
          >
            <Text style={styles.recipeSubtitle}>{currentRecipe.title}</Text>
            <Text style={styles.cardText} numberOfLines={2}>{currentRecipe.description}</Text>
            {currentRecipe.imageUrl && (
              <Image source={{ uri: currentRecipe.imageUrl }} style={styles.recipeImage} resizeMode="cover" />
            )}
            <Text style={styles.recipeTime}>
              <Ionicons name="time-outline" size={16} color={theme.colors.text.secondary} />
              {' '}{currentRecipe.cookingTime} • {currentRecipe.difficulty}
            </Text>

            {currentRecipe.ingredientMatches && (
              <View style={styles.expiringIngredients}>
                <Text style={styles.ingredientSectionTitle}>Ingredients to use:</Text>
                <View style={styles.ingredientBoxes}>
                  {currentRecipe.ingredientMatches
                    .filter(ing => ing.match && ing.daysUntilExpiry !== undefined && ing.daysUntilExpiry <= 5)
                    .slice(0, 4)
                    .map((ing, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.ingredientBox,
                          ing.daysUntilExpiry <= 0 ? styles.expiredBox :
                          ing.daysUntilExpiry <= 3 ? styles.expiringSoonBox : styles.normalBox
                        ]}
                      >
                        <Text style={[
                          styles.ingredientText,
                          ing.daysUntilExpiry <= 0 ? styles.expiredText :
                          ing.daysUntilExpiry <= 3 ? styles.expiringSoonText : null
                        ]}>
                          {ing.name}
                        </Text>
                      </View>
                    ))}
                  {currentRecipe.ingredientMatches.filter(ing => ing.match && ing.daysUntilExpiry !== undefined && ing.daysUntilExpiry <= 5).length > 4 && (
                    <View style={styles.ingredientBox}>
                      <Text style={styles.ingredientText}>...</Text>
                    </View>
                  )}
                </View>
                {currentRecipe.ingredientMatches.filter(ing => ing.match && ing.daysUntilExpiry !== undefined && ing.daysUntilExpiry <= 5).length === 0 && (
                  <Text style={styles.noIngredientsText}>No expiring ingredients used</Text>
                )}
              </View>
            )}

            <View style={styles.viewDetailsButton}>
              <Text style={styles.viewDetailsText}>View Recipe Details</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
            </View>
          </Pressable>
        )}

        <View style={styles.recipeNavigation}>
          <Pressable
            style={styles.navButton}
            onPress={previousRecipe}
            disabled={recipes.length <= 1}
          >
            <Ionicons name="chevron-back" size={24} color={recipes.length <= 1 ? theme.colors.border.primary : theme.colors.primary} />
          </Pressable>

          <View style={styles.recipeIndicators}>
            {recipes.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === currentRecipeIndex && styles.activeIndicator
                ]}
              />
            ))}
          </View>

          <Pressable
            style={styles.navButton}
            onPress={nextRecipe}
            disabled={recipes.length <= 1}
          >
            <Ionicons name="chevron-forward" size={24} color={recipes.length <= 1 ? theme.colors.border.primary : theme.colors.primary} />
          </Pressable>

          <Pressable
            style={styles.favoriteButton}
            onPress={handleFavoriteToggle}
            disabled={!currentRecipe}
          >
            <Ionicons
              name={currentRecipe && isFavorite(currentRecipe.id) ? "heart" : "heart-outline"}
              size={24}
              color={currentRecipe && isFavorite(currentRecipe.id) ? theme.colors.status.error : theme.colors.text.secondary}
            />
          </Pressable>
        </View>
      </View>

      {currentRecipe && (
        <RecipeDetailModal
          recipe={currentRecipe}
          visible={showRecipeDetail}
          onClose={() => {
            setShowRecipeDetail(false);
            console.log('HOOK: Adding recipe to recents on modal close:', currentRecipe.id);
            addSingleRecent(currentRecipe);
          }}
          onFavoriteToggle={handleFavoriteToggle}
          isFavorite={isFavorite(currentRecipe.id)}
        />
      )}
    </>
  );
};

// --- QuickActions, QuickActionButton components remain the same ---
const QuickActions: React.FC = () => (
  <View style={styles.quickActionsSection}>
    <Text style={styles.sectionTitle}>Quick Actions</Text>
    <View style={styles.quickActionsGrid}>
      <QuickActionButton
        icon="time-outline"
        text="Expiring Soon"
        color={theme.colors.primary}
        onPress={() => router.push('/fridge?initialFilter=expiring-soon')}
      />
      <QuickActionButton
        icon="alert-outline"
        text="Expired Items"
        color={theme.colors.status.error}
        onPress={() => router.push('/fridge?initialFilter=expired')}
      />
    </View>
    <Pressable
      style={styles.addNewButton}
      onPress={() => router.push('/ingredient')}
    >
      <Ionicons name="add-circle" size={24} color={theme.colors.primary} />
      <Text style={styles.addNewButtonText}>Add New Item</Text>
    </Pressable>
  </View>
);

const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  icon,
  text,
  color,
  onPress
}) => (
  <Pressable
    style={styles.quickActionButton}
    onPress={onPress}
  >
    <Ionicons name={icon} size={24} color={color} />
    <Text style={styles.quickActionText}>{text}</Text>
  </Pressable>
);


// --- Styles remain largely the same, adding retry button style ---
const styles = StyleSheet.create({
  // ... (Existing styles)
  recipeImage: { // Added style for image within recipe card
     width: '100%',
     height: 120,
     borderRadius: theme.borderRadius.md, // Match card radius
     marginVertical: theme.spacing.sm,
  },
  retryButton: { // Style for retry/generate buttons in error/empty states
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    color: theme.colors.background.primary,
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    textAlign: 'center',
  },
  debugRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  debugText: {
    fontSize: 12,
    color: 'gray',
    textDecorationLine: 'underline',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  viewDetailsButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: 'rgba(83, 209, 129, 0.1)',
    gap: 6,
    marginTop: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  viewDetailsText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  recipeCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    // Add some shadow/elevation if desired
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  expiringIngredients: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  ingredientSectionTitle: {
    fontSize: theme.fontSize.sm, // Slightly smaller title
    fontWeight: '600',
    color: theme.colors.text.secondary, // Muted color
    marginBottom: theme.spacing.xs,
  },
  ingredientBoxes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  ingredientBox: {
    paddingVertical: theme.spacing.xs / 2, // Smaller padding
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.xs,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  expiredBox: {
    borderColor: theme.colors.status.error,
    backgroundColor: 'rgba(255, 89, 89, 0.1)',
  },
  expiringSoonBox: {
    borderColor: theme.colors.status.warning,
    backgroundColor: 'rgba(255, 170, 51, 0.1)',
  },
  normalBox: {
    borderColor: theme.colors.status.success, // Use success color for normal
    backgroundColor: 'rgba(83, 209, 129, 0.1)',
  },
  ingredientText: {
    fontSize: theme.fontSize.xs, // Smaller text
    color: theme.colors.text.primary,
  },
  expiredText: {
    color: theme.colors.status.error,
    fontWeight: '500',
  },
  expiringSoonText: {
    color: theme.colors.status.warning,
    fontWeight: '500',
  },
  noIngredientsText: {
    fontSize: theme.fontSize.xs, // Smaller text
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  recipeNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center items horizontally
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth, // Add separator line
    borderTopColor: theme.colors.border.primary,
  },
  navButton: {
    padding: theme.spacing.sm,
  },
  recipeIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center', // Align indicators vertically
    gap: 6,
    flex: 1, // Take remaining space
    marginHorizontal: theme.spacing.md, // Add some margin around indicators
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border.primary,
  },
  activeIndicator: {
    backgroundColor: theme.colors.primary,
    width: 10, // Make active indicator slightly larger
    height: 10,
    borderRadius: 5,
  },
  favoriteButton: {
    padding: theme.spacing.sm,
    // No extra margin needed if centered
  },
  mobileContainer: {
    padding: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  smallCard: {
    paddingVertical: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  cardTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  cardText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    lineHeight: theme.fontSize.md * 1.4, // Improve readability
  },
  statusCount: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
  },
  viewAllLink: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    marginTop: theme.spacing.sm,
    fontWeight: '500', // Make link slightly bolder
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  recipeTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  viewAllText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.md,
    fontWeight: '500',
  },
  recipeSubtitle: {
    fontSize: theme.fontSize.lg, // Slightly larger title
    fontWeight: '600', // Bolder title
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  recipeTime: {
    fontSize: theme.fontSize.sm, // Smaller time/difficulty text
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs, // Add space above time
  },
  quickActionsSection: {
    gap: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  quickActionText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  addNewButton: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  addNewButtonText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text.primary,
  },
});

