import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Image, ScrollView, Dimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFavorites } from '@/hooks/useFavorites';
import { useRecipes } from '@/hooks/useRecipes';
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

export const MobileHome: React.FC = () => {
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
  const { toggleFavorite, isFavorite } = useFavorites();
  const { saveToRecent } = useRecipes();
  
  const currentRecipe = recipes[currentRecipeIndex] || null;

  // Navigate to debug screen
  const goToDebugScreen = () => {
    router.push('/debug');
  };

  // Verify storage keys at startup
  useEffect(() => {
    const checkStorageKeys = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        console.log('Available storage keys:', keys);
        
        // Check existing recents
        const recents = await AsyncStorage.getItem('fridgefriend_recent_recipes');
        if (recents) {
          try {
            const parsedRecents = JSON.parse(recents);
            console.log('Found existing recent recipes:', parsedRecents.length);
            console.log('First recent recipe:', parsedRecents[0]?.title);
          } catch (e) {
            console.error('Failed to parse recent recipes:', e);
          }
        } else {
          console.log('No existing recent recipes found');
        }
        
        // Check existing favorites
        const favorites = await AsyncStorage.getItem('fridgefriend_favorites');
        if (favorites) {
          try {
            const parsedFavorites = JSON.parse(favorites);
            console.log('Found existing favorites:', parsedFavorites.length);
            console.log('First favorite recipe:', parsedFavorites[0]?.title);
          } catch (e) {
            console.error('Failed to parse favorites:', e);
          }
        } else {
          console.log('No existing favorites found');
        }
      } catch (e) {
        console.error('Error checking storage keys:', e);
      }
    };
    
    checkStorageKeys();
  }, []);

  // Get meal type based on current time of day
  const getMealTypeForCurrentTime = () => {
    const hour = new Date().getHours();
    
    // Define time ranges for each meal type
    if (hour >= 5 && hour < 11) {
      return 'breakfast';
    } else if (hour >= 11 && hour < 14) {
      return 'lunch';
    } else if (hour >= 17 && hour < 21) {
      return 'dinner';
    } else {
      return 'snack';
    }
  };

  // Generate recipes based on time of day
  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get appropriate meal type for current time
      const mealType = getMealTypeForCurrentTime();
      console.log(`Generating ${mealType} recipes based on current time`);
      
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
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch recipes when the component is first mounted
  useEffect(() => {
    fetchRecipes();
    
    // Store the last time recipes were generated
    const lastGeneratedTime = new Date().getTime();
    AsyncStorage.setItem('last_recipe_generated_time', lastGeneratedTime.toString());
  }, [fetchRecipes]);

  // Add to recents directly with AsyncStorage for reliability
  const addToRecent = useCallback((recipe: Recipe) => {
    if (!recipe) return;
    
    console.log('DIRECT: Adding to recents:', recipe.id);
    
    // IMPORTANT: Use exact same key
    const RECENT_KEY = 'fridgefriend_recent_recipes';
    
    // Get current recents from storage
    AsyncStorage.getItem(RECENT_KEY)
      .then(storedRecents => {
        let recents: Recipe[] = [];
        
        if (storedRecents) {
          try {
            recents = JSON.parse(storedRecents);
            console.log('Found existing recents:', recents.length);
          } catch (e) {
            console.error('Failed to parse recents:', e);
          }
        }
        
        // Check if recipe already exists
        const existingIndex = recents.findIndex(r => r.id === recipe.id);
        
        // Remove if exists
        if (existingIndex !== -1) {
          recents.splice(existingIndex, 1);
        }
        
        // Add to front
        recents.unshift(recipe);
        console.log('New recents count:', recents.length);
        
        // Keep only 20 most recent
        if (recents.length > 20) {
          recents = recents.slice(0, 20);
        }
        
        // Save back to storage
        return AsyncStorage.setItem(RECENT_KEY, JSON.stringify(recents));
      })
      .then(() => {
        console.log('Successfully saved recipe to recents');
      })
      .catch(err => {
        console.error('Error saving to recents:', err);
      });
  }, []);
  
  // Similarly for favorites
  const addToFavorites = useCallback((recipe: Recipe) => {
    if (!recipe) return;
    
    console.log('DIRECT: Toggling favorite:', recipe.id);
    
    // IMPORTANT: Use exact same key
    const FAVORITES_KEY = 'fridgefriend_favorites';
    
    // Get current favorites from storage
    AsyncStorage.getItem(FAVORITES_KEY)
      .then(storedFavorites => {
        let favorites: Recipe[] = [];
        
        if (storedFavorites) {
          try {
            favorites = JSON.parse(storedFavorites);
            console.log('Found existing favorites:', favorites.length);
          } catch (e) {
            console.error('Failed to parse favorites:', e);
          }
        }
        
        // Check if recipe already exists
        const existingIndex = favorites.findIndex(r => r.id === recipe.id);
        
        if (existingIndex === -1) {
          // Not in favorites - add it
          favorites.push(recipe);
          console.log('Adding to favorites');
        } else {
          // Already in favorites - remove it
          favorites.splice(existingIndex, 1);
          console.log('Removing from favorites');
        }
        
        console.log('New favorites count:', favorites.length);
        
        // Save back to storage
        return AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      })
      .then(() => {
        console.log('Successfully saved favorites');
      })
      .catch(err => {
        console.error('Error saving favorites:', err);
      });
  }, []);

  // Add currently displayed recipe to recents whenever it changes
  useEffect(() => {
    if (currentRecipe) {
      console.log('Adding current recipe to recents:', currentRecipe.id);
      addToRecent(currentRecipe);
    }
  }, [currentRecipeIndex, currentRecipe, addToRecent]);

  // Use manual navigation only
  const nextRecipe = () => {
    if (currentRecipeIndex < recipes.length - 1) {
      setCurrentRecipeIndex(currentRecipeIndex + 1);
    } else {
      setCurrentRecipeIndex(0); // Loop back to the first recipe
    }
  };

  const previousRecipe = () => {
    if (currentRecipeIndex > 0) {
      setCurrentRecipeIndex(currentRecipeIndex - 1);
    } else {
      setCurrentRecipeIndex(recipes.length - 1); // Loop to the last recipe
    }
  };

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
      </View>
    );
  }
  if (!recipes.length || !currentRecipe) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardText}>No recipe ideas found.</Text>
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
            onPress={() => setShowRecipeDetail(true)}
          >
            <Text style={styles.recipeSubtitle}>{currentRecipe.title}</Text>
            <Text style={styles.cardText}>{currentRecipe.description}</Text>
            {currentRecipe.imageUrl && (
              <Image source={{ uri: currentRecipe.imageUrl }} style={{ width: '100%', height: 120, borderRadius: 12, marginVertical: 8 }} resizeMode="cover" />
            )}
            <Text style={styles.recipeTime}>
              <Ionicons name="time-outline" size={16} color={theme.colors.text.secondary} />
              {' '}{currentRecipe.cookingTime} • {currentRecipe.difficulty}
            </Text>
            
            {/* Display only expired/expiring ingredients */}
            {currentRecipe.ingredientMatches && (
              <View style={styles.expiringIngredients}>
                <Text style={styles.ingredientSectionTitle}>Ingredients to use:</Text>
                <View style={styles.ingredientBoxes}>
                  {currentRecipe.ingredientMatches
                    .filter(ing => ing.match && ing.daysUntilExpiry !== undefined && ing.daysUntilExpiry <= 5)
                    .slice(0, 4) // Limit to 4 ingredients (approximately 2 rows)
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
                  <Text style={styles.noIngredientsText}>No expiring ingredients used in this recipe</Text>
                )}
              </View>
            )}
            
            <View style={styles.viewDetailsButton}>
              <Text style={styles.viewDetailsText}>View Recipe Details</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
            </View>
          </Pressable>
        )}
        
        {/* Recipe navigation controls */}
        <View style={styles.recipeNavigation}>
          <Pressable 
            style={styles.navButton} 
            onPress={previousRecipe}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
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
          >
            <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
          </Pressable>

          {/* Favorite button */}
          <Pressable 
            style={styles.favoriteButton}
            onPress={() => {
              toggleFavorite(currentRecipe);
              addToFavorites(currentRecipe);
            }}
          >
            <Ionicons 
              name={isFavorite(currentRecipe.id) ? "heart" : "heart-outline"} 
              size={24} 
              color={isFavorite(currentRecipe.id) ? theme.colors.status.error : theme.colors.text.secondary} 
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
            // When closing detail view, add to recents
            addToRecent(currentRecipe);
          }}
          onFavoriteToggle={() => {
            // Toggle favorite and update directly
            toggleFavorite(currentRecipe);
            addToFavorites(currentRecipe);
          }}
          isFavorite={isFavorite(currentRecipe.id)}
        />
      )}
    </>
  );
};

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

const styles = StyleSheet.create({
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
  },
  expiringIngredients: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  ingredientSectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  ingredientBoxes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  ingredientBox: {
    paddingVertical: theme.spacing.xs,
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
    borderColor: theme.colors.status.success,
    backgroundColor: 'rgba(83, 209, 129, 0.1)',
  },
  ingredientText: {
    fontSize: theme.fontSize.md,
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
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  recipeNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
  },
  navButton: {
    padding: theme.spacing.sm,
  },
  recipeIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    flex: 1,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border.primary,
  },
  activeIndicator: {
    backgroundColor: theme.colors.primary,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  favoriteButton: {
    padding: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
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
  },
  statusCount: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
  },
  viewAllLink: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    marginTop: theme.spacing.sm,
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
    fontSize: theme.fontSize.lg,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  recipeCount: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  recipeTime: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  recipeTags: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  recipeTag: {
    backgroundColor: theme.colors.background.secondary,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    color: theme.colors.text.primary,
    fontSize: theme.fontSize.md,
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