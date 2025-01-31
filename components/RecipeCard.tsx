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
  }
  
  export default function RecipeCard({ 
    recipe, 
    onFavoriteToggle,
    isFavorite 
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
            pressed && styles.cardPressed
          ]}
          onPress={() => setShowDetail(true)}
        >
          <Image 
            source={{ uri: recipe.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
          
          <View style={styles.content}>
            <View>
              <Text style={styles.title} numberOfLines={1}>
                {recipe.title}
              </Text>
              
              <View style={styles.metrics}>
                <MetricItem 
                  icon="time-outline" 
                  value={recipe.cookingTime} 
                />
                <MetricItem 
                  icon="restaurant-outline" 
                  value={recipe.difficulty} 
                />
                {isFavorite && (
                  <Ionicons 
                    name="heart" 
                    size={16} 
                    color={theme.colors.status.error} 
                  />
                )}
              </View>
            </View>
  
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
          </View>
  
          <Ionicons 
            name="chevron-forward" 
            size={20} 
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
    value 
  }: { 
    icon: React.ComponentProps<typeof Ionicons>['name'];
    value: string;
  }) => (
    <View style={styles.metricItem}>
      <Ionicons 
        name={icon} 
        size={14} 
        color={theme.colors.text.secondary} 
      />
      <Text style={styles.metricText}>{value}</Text>
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
  });