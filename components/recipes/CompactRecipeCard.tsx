// components/recipes/CompactRecipeCard.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';
import { type Recipe } from '@/services/api/recipeGenerationService';
import RecipeDetailModal from './RecipeDetailModal';

interface CompactRecipeCardProps {
  recipe: Recipe;
  onFavoriteToggle: (recipe: Recipe) => void;
  isFavorite: boolean;
  allowDelete?: boolean;
  onDelete?: () => void;
  onAddToRecent: (recipe: Recipe) => void; // Add this prop
}

export default function CompactRecipeCard({
  recipe,
  onFavoriteToggle,
  isFavorite,
  allowDelete = false,
  onDelete,
  onAddToRecent // Destructure the new prop
}: CompactRecipeCardProps) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed
        ]}
        onPress={() => setShowDetail(true)}
      >
        {/* Left side: Image */}
        <Image
          source={{ uri: recipe.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Middle: Recipe info */}
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {recipe.title}
          </Text>

          {/* Recipe brief metrics */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Ionicons name="time-outline" size={14} color={theme.colors.primary} />
              <Text style={styles.metricText}>{recipe.cookingTime}</Text>
            </View>

            <View style={styles.metricSeparator} />

            <View style={styles.metricItem}>
              <Ionicons name="restaurant-outline" size={14} color={theme.colors.primary} />
              <Text style={styles.metricText}>{recipe.difficulty}</Text>
            </View>
          </View>

          {/* Ingredient count */}
          <View style={styles.ingredientCounts}>
            <Text style={styles.countText}>
              <Text style={styles.countHighlight}>{recipe.matchingIngredients.length}</Text> available,
              <Text style={[styles.countHighlight, styles.missingText]}> {recipe.missingIngredients.length}</Text> needed
            </Text>
          </View>
        </View>

        {/* Right side: Actions */}
        <View style={styles.actionsContainer}>
          {allowDelete && onDelete && (
            <Pressable
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color={theme.colors.status.error}
              />
            </Pressable>
          )}

          <Pressable
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              onFavoriteToggle(recipe);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={20}
              color={isFavorite ? theme.colors.status.error : theme.colors.text.secondary}
            />
          </Pressable>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.text.secondary}
            style={styles.chevron}
          />
        </View>
      </Pressable>

      <RecipeDetailModal
        recipe={recipe}
        visible={showDetail}
        onClose={() => {
          setShowDetail(false);
          onAddToRecent(recipe); // Call hook function on close
          console.log('CompactRecipeCard: Adding to recent on modal close:', recipe.id);
        }}
        onFavoriteToggle={() => onFavoriteToggle(recipe)}
        isFavorite={isFavorite}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xs,
    marginHorizontal: theme.spacing.xs,
    flexDirection: 'row',
    overflow: 'hidden',
    height: 90,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  image: {
    width: 90,
    height: '100%',
  },
  content: {
    flex: 1,
    padding: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: theme.fontSize.md,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricSeparator: {
    width: 1,
    height: 12,
    backgroundColor: theme.colors.border.primary,
    marginHorizontal: theme.spacing.sm,
  },
  metricText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  ingredientCounts: {
    marginTop: 2,
  },
  countText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  countHighlight: {
    color: theme.colors.status.success,
    fontWeight: '600',
  },
  missingText: {
    color: theme.colors.status.warning,
  },
  actionsContainer: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingRight: theme.spacing.sm,
    paddingLeft: theme.spacing.xs,
  },
  actionButton: {
    padding: 3,
  },
  chevron: {
    marginTop: theme.spacing.sm,
  }
});
