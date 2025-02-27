// components/RecipeDetailModal.tsx
import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  Image, 
  StyleSheet,
  Platform,
  useWindowDimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';
import { sharedStyles } from '@/styles/sharedStyles';
import { type Recipe } from '@/services/api/recipeGenerationService';
import { type IngredientMatch } from '@/services/recipeMatcherService';

interface RecipeDetailModalProps {
  recipe: Recipe;
  visible: boolean;
  onClose: () => void;
  onFavoriteToggle: () => void;
  isFavorite: boolean;
}

export default function RecipeDetailModal({ 
  recipe, 
  visible, 
  onClose,
  onFavoriteToggle,
  isFavorite 
}: RecipeDetailModalProps) {
  const { width } = useWindowDimensions();
  const [userRating, setUserRating] = useState<number>(0);
  
  const modalStyle = Platform.select({
    web: {
      width: Math.min(800, width - 40),
      alignSelf: 'center',
      margin: 20,
      maxHeight: '90vh',
    },
    default: {
      flex: 1,
      margin: 0,
    },
  });

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return theme.colors.status.success;
    if (percentage >= 50) return theme.colors.primary;
    return theme.colors.status.warning;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, modalStyle]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable 
            onPress={onClose}
            style={styles.headerButton}
          >
            <Ionicons name="close" size={24} color={theme.colors.text.primary} />
          </Pressable>
          <Pressable 
            onPress={onFavoriteToggle}
            style={styles.headerButton}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={24} 
              color={isFavorite ? theme.colors.status.error : theme.colors.text.primary} 
            />
          </Pressable>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Image */}
          <Image 
            source={{ uri: recipe.imageUrl }}
            style={styles.heroImage}
            resizeMode="cover"
          />

          <View style={styles.mainContent}>
            {/* Title and Rating */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>{recipe.title}</Text>
              <RatingStars 
                rating={userRating} 
                onRatingChange={setUserRating} 
              />
            </View>

            {/* Quick Info */}
            <View style={styles.quickInfoSection}>
              <QuickInfoItem 
                icon="time-outline" 
                label="Cooking Time" 
                value={recipe.cookingTime} 
              />
              <QuickInfoItem 
                icon="restaurant-outline" 
                label="Difficulty" 
                value={recipe.difficulty} 
              />
              <QuickInfoItem 
                icon="people-outline" 
                label="Servings" 
                value={recipe.servings} 
              />
              <QuickInfoItem 
                icon="flame-outline" 
                label="Calories" 
                value={recipe.calories} 
              />
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.description}>{recipe.description}</Text>
            </View>

            {/* Nutritional Info */}
            <View style={styles.section}>
              <SectionTitle title="Nutritional Information" />
              <View style={styles.nutritionGrid}>
                <NutritionItem 
                  label="Protein" 
                  value={recipe.nutritionalInfo.protein} 
                />
                <NutritionItem 
                  label="Carbs" 
                  value={recipe.nutritionalInfo.carbs} 
                />
                <NutritionItem 
                  label="Fat" 
                  value={recipe.nutritionalInfo.fat} 
                />
              </View>
            </View>

            {/* Ingredients */}
            <View style={styles.section}>
              <SectionTitle title="Ingredients" />
              
              {/* Match Percentage */}
              <View style={styles.matchPercentageContainer}>
                <Text style={[
                  styles.matchPercentageText,
                  { color: getMatchColor(recipe.matchPercentage) }
                ]}>
                  {Math.round(recipe.matchPercentage)}% of ingredients available
                </Text>
                <View style={styles.matchBar}>
                  <View 
                    style={[
                      styles.matchBarFill, 
                      { 
                        width: `${recipe.matchPercentage}%`,
                        backgroundColor: getMatchColor(recipe.matchPercentage)
                      }
                    ]} 
                  />
                </View>
              </View>

              <View style={styles.ingredientsList}>
                {/* Available Ingredients */}
                <View style={styles.ingredientGroup}>
                  <Text style={styles.ingredientGroupTitle}>Available Ingredients</Text>
                  {recipe.ingredientMatches
                    .filter(match => match.match)
                    .map((ingredient, index) => (
                      <IngredientItem 
                        key={`available-${index}`}
                        ingredient={ingredient}
                        isAvailable={true}
                      />
                    ))}
                </View>

                {/* Missing Ingredients */}
                {recipe.missingIngredients.length > 0 && (
                  <View style={styles.ingredientGroup}>
                    <Text style={styles.ingredientGroupTitle}>Additional Ingredients Needed</Text>
                    {recipe.ingredientMatches
                      .filter(match => !match.match)
                      .map((ingredient, index) => (
                        <IngredientItem 
                          key={`missing-${index}`}
                          ingredient={ingredient}
                          isAvailable={false}
                        />
                      ))}
                  </View>
                )}
              </View>
            </View>

            {/* Instructions */}
            <View style={styles.section}>
              <SectionTitle title="Instructions" />
              {recipe.instructions.map((instruction, index) => (
                <View key={index} style={styles.instructionItem}>
                  <View style={styles.instructionNumber}>
                    <Text style={styles.instructionNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.instructionText}>{instruction}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// Helper Components
const SectionTitle = ({ title }: { title: string }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

const RatingStars = ({ 
  rating, 
  onRatingChange 
}: { 
  rating: number; 
  onRatingChange: (rating: number) => void;
}) => (
  <View style={styles.ratingContainer}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Pressable
        key={star}
        onPress={() => onRatingChange(star)}
        style={styles.starButton}
      >
        <Ionicons
          name={rating >= star ? "star" : "star-outline"}
          size={24}
          color={rating >= star ? theme.colors.primary : theme.colors.text.secondary}
        />
      </Pressable>
    ))}
  </View>
);

const QuickInfoItem = ({ 
  icon, 
  label, 
  value 
}: { 
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) => (
  <View style={styles.quickInfoItem}>
    <Ionicons name={icon} size={24} color={theme.colors.text.secondary} />
    <Text style={styles.quickInfoLabel}>{label}</Text>
    <Text style={styles.quickInfoValue}>{value}</Text>
  </View>
);

const NutritionItem = ({ 
  label, 
  value 
}: { 
  label: string; 
  value: string;
}) => (
  <View style={styles.nutritionItem}>
    <Text style={styles.nutritionLabel}>{label}</Text>
    <Text style={styles.nutritionValue}>{value}</Text>
  </View>
);

const IngredientItem = ({ 
  ingredient, 
  isAvailable 
}: { 
  ingredient: IngredientMatch;
  isAvailable: boolean;
}) => (
  <View style={styles.ingredientItem}>
    <View style={styles.ingredientMain}>
      <Ionicons
        name={isAvailable ? "checkmark-circle" : "add-circle"}
        size={20}
        color={isAvailable ? theme.colors.status.success : theme.colors.primary}
      />
      <Text style={styles.ingredientText}>{ingredient.name}</Text>
    </View>
    
    {isAvailable && ingredient.daysUntilExpiry !== undefined && (
      <Text style={[
        styles.expiryText,
        ingredient.daysUntilExpiry <= 3 && styles.expiryTextWarning,
        ingredient.daysUntilExpiry <= 0 && styles.expiryTextDanger,
      ]}>
        {ingredient.daysUntilExpiry === 0 && 'Expires today'}
        {ingredient.daysUntilExpiry < 0 && `Expired (${Math.abs(ingredient.daysUntilExpiry)}d)`}
        {ingredient.daysUntilExpiry > 0 && `${ingredient.daysUntilExpiry}d left`}
      </Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: Platform.OS === 'web' ? theme.borderRadius.lg : 0,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  headerButton: {
    padding: theme.spacing.sm,
  },
  content: {
    flex: 1,
  },
  heroImage: {
    width: '100%',
    height: 300,
  },
  mainContent: {
    padding: theme.spacing.lg,
  },
  titleSection: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  starButton: {
    padding: theme.spacing.xs,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  description: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
    lineHeight: 24,
  },
  quickInfoSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
  },
  quickInfoItem: {
    flex: 1,
    minWidth: 100,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  quickInfoLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  quickInfoValue: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  nutritionItem: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
  },
  nutritionLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  nutritionValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  matchPercentageContainer: {
    marginBottom: theme.spacing.lg,
  },
  matchPercentageText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  matchBar: {
    height: 4,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
  },
  matchBarFill: {
    height: '100%',
  },
  ingredientsList: {
    gap: theme.spacing.lg,
  },
  ingredientGroup: {
    gap: theme.spacing.sm,
  },
  ingredientGroupTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
  },
  ingredientMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  ingredientText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
  },
  expiryText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  expiryTextWarning: {
    color: theme.colors.status.warning,
  },
  expiryTextDanger: {
    color: theme.colors.status.danger,
  },
  instructionItem: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionNumberText: {
    color: theme.colors.background.primary,
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
  instructionText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
    lineHeight: 24,
  },
});