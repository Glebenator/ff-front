// components/RecipeCard.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';
import { sharedStyles } from '@/styles/sharedStyles';
import { type Recipe } from '@/services/api/recipeGenerationService';
import RecipeDetailModal from './RecipeDetailModal';

interface RecipeCardProps {
  recipe: Recipe;
  onFavoriteToggle: (recipe: Recipe) => void;
  isFavorite: boolean;
  compact?: boolean;
}

export default function RecipeCard({ 
  recipe, 
  onFavoriteToggle,
  isFavorite,
  compact = false
}: RecipeCardProps) {
  const [showDetail, setShowDetail] = useState(false);

  // Helper function to get the color based on match percentage
  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return theme.colors.status.success;
    if (percentage >= 50) return theme.colors.primary;
    return theme.colors.status.warning;
  };
  
  // Calculate actual match percentage dynamically (in case it's not already calculated)
  const matchPercentage = recipe.matchPercentage ?? 
    (recipe.matchingIngredients.length / 
      (recipe.matchingIngredients.length + recipe.missingIngredients.length) * 100);
  
  // New ingredient badge component
  const IngredientBadge = ({ count, type }: { count: number, type: 'matching' | 'missing' }) => {
    const isMatching = type === 'matching';
    return (
      <View style={[
        styles.badge,
        { backgroundColor: isMatching ? 'rgba(99, 207, 139, 0.2)' : 'rgba(255, 170, 51, 0.2)' }
      ]}>
        <Ionicons 
          name={isMatching ? "checkmark-circle" : "alert-circle"} 
          size={16} 
          color={isMatching ? theme.colors.status.success : theme.colors.status.warning} 
        />
        <Text style={[
          styles.badgeText,
          { color: isMatching ? theme.colors.status.success : theme.colors.status.warning }
        ]}>
          {count} {isMatching ? 'available' : 'needed'}
        </Text>
      </View>
    );
  };

  return (
    <>
      <Pressable 
        style={({ pressed }) => [
          styles.card,
          compact && styles.cardCompact,
          pressed && styles.cardPressed
        ]}
        onPress={() => setShowDetail(true)}
      >
        {/* Card Header with Image and Match Percentage */}
        <View style={styles.cardHeader}>
          <Image 
            source={{ uri: recipe.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
          
          {!compact && (
            <View style={styles.matchBadge}>
              <Text style={[styles.matchText, { color: getMatchColor(matchPercentage) }]}>
                {Math.round(matchPercentage)}%
              </Text>
            </View>
          )}
          
          {/* Favorite Button */}
          <Pressable 
            style={styles.favoriteButton}
            onPress={(e) => {
              e.stopPropagation();
              onFavoriteToggle(recipe);
            }}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={24} 
              color={isFavorite ? theme.colors.status.error : theme.colors.text.secondary} 
            />
          </Pressable>
        </View>
        
        {/* Card Content */}
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={compact ? 1 : 2}>
            {recipe.title}
          </Text>

          {/* Recipe Metrics */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.metricText}>{recipe.cookingTime}</Text>
            </View>
            
            <View style={styles.metricSeparator} />
            
            <View style={styles.metricItem}>
              <Ionicons name="restaurant-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.metricText}>{recipe.difficulty}</Text>
            </View>
            
            <View style={styles.metricSeparator} />
            
            <View style={styles.metricItem}>
              <Ionicons name="flame-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.metricText}>{recipe.calories}</Text>
            </View>
          </View>
          
          {!compact && (
            <View style={styles.ingredients}>
              <IngredientBadge count={recipe.matchingIngredients.length} type="matching" />
              <IngredientBadge count={recipe.missingIngredients.length} type="missing" />
            </View>
          )}
        </View>
        
        {/* View Details Button */}
        <View style={styles.viewDetailsButton}>
          <Text style={styles.viewDetailsText}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
        </View>
      </Pressable>

      <RecipeDetailModal
        recipe={recipe}
        visible={showDetail}
        onClose={() => setShowDetail(false)}
        onFavoriteToggle={() => onFavoriteToggle(recipe)}
        isFavorite={isFavorite}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardCompact: {
    height: 200,
    marginBottom: theme.spacing.sm,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  cardHeader: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
  },
  matchBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.sm,
  },
  matchText: {
    fontSize: theme.fontSize.md,
    fontWeight: 'bold',
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderRadius: 20,
    padding: 6,
  },
  content: {
    padding: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricSeparator: {
    width: 1,
    height: 16,
    backgroundColor: theme.colors.border.primary,
    marginHorizontal: theme.spacing.sm,
  },
  metricText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  ingredients: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginVertical: theme.spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.md,
    gap: 4,
  },
  badgeText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: 'rgba(83, 209, 129, 0.1)',
    gap: 6,
  },
  viewDetailsText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.primary,
  },
});