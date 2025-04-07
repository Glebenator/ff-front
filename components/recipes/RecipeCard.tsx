// components/RecipeCard.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Recipe } from '@/services/api/recipeGenerationService';
import { theme } from '@/styles/theme';

interface RecipeCardProps {
  recipe: Recipe;
  style?: object;
  onFavoriteToggle?: (recipe: Recipe) => void;
  isFavorite?: boolean;
  onPress?: () => void;
}

export default function RecipeCard({
  recipe,
  style,
  onFavoriteToggle,
  isFavorite = false,
  onPress
}: RecipeCardProps) {
  const handleFavoriteToggle = () => {
    if (onFavoriteToggle) {
      onFavoriteToggle(recipe);
    }
  };

  // Calculate matching percentage
  const matchPercentage = recipe.matchPercentage 
    ? Math.round(recipe.matchPercentage) 
    : recipe.matchingIngredients.length / (recipe.matchingIngredients.length + recipe.missingIngredients.length) * 100;

  // Helper function to extract ingredient names from either format
  const getIngredientName = (ingredient: any): string => {
    if (typeof ingredient === 'string') return ingredient;
    if (typeof ingredient === 'object' && ingredient !== null) return ingredient.name || 'Unknown';
    return 'Unknown';
  };

  return (
    <Pressable onPress={onPress} style={[styles.card, style]}>
      {/* Image and match badge */}
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: recipe.imageUrl || 'https://via.placeholder.com/400x200' }}
          style={styles.image}
        />
        <View style={styles.matchBadge}>
          <Text style={styles.matchText}>{matchPercentage}% match</Text>
        </View>

        {/* Favorite button */}
        {onFavoriteToggle && (
          <Pressable 
            style={styles.favoriteButton}
            onPress={handleFavoriteToggle}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={24} 
              color={isFavorite ? theme.colors.status.error : theme.colors.text.primary} 
            />
          </Pressable>
        )}
      </View>

      {/* Recipe content */}
      <View style={styles.content}>
        <Text style={styles.title}>{recipe.title}</Text>
        <Text style={styles.description}>{recipe.description}</Text>
        
        {/* Recipe details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color={theme.colors.text.secondary} />
            <Text style={styles.detailText}>{recipe.cookingTime}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="barbell-outline" size={16} color={theme.colors.text.secondary} />
            <Text style={styles.detailText}>{recipe.difficulty}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="flame-outline" size={16} color={theme.colors.text.secondary} />
            <Text style={styles.detailText}>{recipe.calories}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="people-outline" size={16} color={theme.colors.text.secondary} />
            <Text style={styles.detailText}>{recipe.servings} servings</Text>
          </View>
        </View>

        {/* Ingredients sections */}
        <View style={styles.ingredientsContainer}>
          <Text style={styles.sectionTitle}>You have:</Text>
          <View style={styles.ingredientsList}>
            {recipe.matchingIngredients.map((ingredient, index) => (
              <Text key={`matching-${index}`} style={styles.ingredientText}>
                • {getIngredientName(ingredient)}
              </Text>
            ))}
          </View>

          {recipe.missingIngredients.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>You need:</Text>
              <View style={styles.ingredientsList}>
                {recipe.missingIngredients.map((ingredient, index) => (
                  <Text key={`missing-${index}`} style={styles.ingredientText}>
                    • {getIngredientName(ingredient)}
                  </Text>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Nutritional info */}
        <View style={styles.nutritionContainer}>
          <Text style={styles.sectionTitle}>Nutrition (per serving):</Text>
          <View style={styles.macrosContainer}>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{recipe.nutritionalInfo.protein}</Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{recipe.nutritionalInfo.carbs}</Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{recipe.nutritionalInfo.fat}</Text>
              <Text style={styles.macroLabel}>Fat</Text>
            </View>
          </View>
        </View>
        
        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.sectionTitle}>Instructions:</Text>
          {recipe.instructions.map((step, index) => (
            <View key={`instruction-${index}`} style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>{index + 1}</Text>
              <Text style={styles.instructionText}>{step}</Text>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    position: 'relative',
    height: 160,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  matchBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.full,
  },
  matchText: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: 'bold',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: theme.borderRadius.full,
    padding: 6,
  },
  content: {
    padding: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    marginBottom: 4,
    color: theme.colors.text.primary,
  },
  description: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    marginBottom: 4,
  },
  detailText: {
    marginLeft: 4,
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  ingredientsContainer: {
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: 'bold',
    marginBottom: 4,
    color: theme.colors.text.primary,
  },
  ingredientsList: {
    marginBottom: theme.spacing.sm,
  },
  ingredientText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  nutritionContainer: {
    marginBottom: theme.spacing.sm,
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xs,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  macroLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  instructionsContainer: {
    marginTop: theme.spacing.md,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    color: theme.colors.text.primary,
    textAlign: 'center',
    lineHeight: 24,
    marginRight: theme.spacing.sm,
    fontWeight: 'bold',
  },
  instructionText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
  },
  viewMoreText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
    fontStyle: 'italic',
  }
});