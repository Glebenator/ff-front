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

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return theme.colors.status.success;
    if (percentage >= 50) return theme.colors.primary;
    return theme.colors.status.warning;
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
        <Image 
          source={{ uri: recipe.imageUrl }}
          style={[styles.image, compact && styles.imageCompact]}
          resizeMode="cover"
        />
        
        <View style={[styles.content, compact && styles.contentCompact]}>
          <View>
            <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={1}>
              {recipe.title}
            </Text>
            
            <View style={styles.metrics}>
              <MetricItem 
                icon="time-outline" 
                value={recipe.cookingTime}
                compact={compact} 
              />
              <MetricItem 
                icon="restaurant-outline" 
                value={recipe.difficulty}
                compact={compact}
              />
              {isFavorite && (
                <Ionicons 
                  name="heart" 
                  size={compact ? 14 : 16} 
                  color={theme.colors.status.error} 
                />
              )}
            </View>
          </View>

          {!compact && (
            <View style={styles.matchInfo}>
              <View style={styles.matchPercentage}>
                <Text style={[
                  styles.matchPercentageText,
                  { color: getMatchColor(recipe.matchPercentage) }
                ]}>
                  {Math.round(recipe.matchPercentage)}% match
                </Text>
              </View>
              
              <Text style={styles.ingredientAvailable}>
                {recipe.matchingIngredients.length} ingredients available
              </Text>
              <Text style={styles.ingredientNeeded}>
                {recipe.missingIngredients.length} ingredients needed
              </Text>
            </View>
          )}
        </View>

        <Ionicons 
          name="chevron-forward" 
          size={compact ? 16 : 20} 
          color={theme.colors.text.secondary} 
          style={styles.arrow}
        />
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

const MetricItem = ({ 
  icon, 
  value,
  compact = false 
}: { 
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: string;
  compact?: boolean;
}) => (
  <View style={styles.metricItem}>
    <Ionicons 
      name={icon} 
      size={compact ? 12 : 14} 
      color={theme.colors.text.secondary} 
    />
    <Text style={[styles.metricText, compact && styles.metricTextCompact]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  cardPressed: {
    opacity: 0.7,
  },
  image: {
    width: 100,
    height: 100,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  metrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  matchInfo: {
    gap: theme.spacing.xs,
  },
  matchPercentage: {
    marginBottom: theme.spacing.xs,
  },
  matchPercentageText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
  ingredientAvailable: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.status.success,
  },
  ingredientNeeded: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.status.warning,
  },
  arrow: {
    alignSelf: 'center',
    marginRight: theme.spacing.sm,
  },
  cardCompact: {
    height: 70,
    marginBottom: theme.spacing.sm,
  },
  imageCompact: {
    width: 70,
    height: 70,
  },
  contentCompact: {
    padding: theme.spacing.sm,
  },
  titleCompact: {
    fontSize: theme.fontSize.md,
  },
  metricTextCompact: {
    fontSize: theme.fontSize.xs,
  },
  matchTextCompact: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  }
});