import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Recipe } from '@/services/api/recipeGenerationService';
import { theme } from '@/styles/theme';

interface RecipeDetailModalProps {
  visible: boolean;
  recipe: Recipe | null;
  onClose: () => void;
}

export default function RecipeDetailModal({ visible, recipe, onClose }: RecipeDetailModalProps) {
  if (!recipe) return null;

  // Helper function to extract ingredient information
  const getIngredientDetails = (ingredient: any) => {
    if (typeof ingredient === 'string') {
      return {
        name: ingredient,
        quantity: 'To taste',
        macros: { protein: '0g', carbs: '0g', fat: '0g' }
      };
    }
    return ingredient;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>{recipe.title}</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </Pressable>
          </View>
          
          <ScrollView style={styles.scrollContent}>
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

            {/* Ingredients sections with detailed information */}
            <View style={styles.ingredientsContainer}>
              <Text style={styles.sectionTitle}>You have:</Text>
              <View style={styles.ingredientsList}>
                {recipe.matchingIngredients.map((ingredient, index) => {
                  const details = getIngredientDetails(ingredient);
                  return (
                    <View key={`matching-${index}`} style={styles.ingredientItem}>
                      <Text style={styles.ingredientName}>
                        • {details.name} 
                        <Text style={styles.ingredientQuantity}> ({details.quantity})</Text>
                      </Text>
                      <Text style={styles.macrosText}>
                        P: {details.macros.protein} • C: {details.macros.carbs} • F: {details.macros.fat}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {recipe.missingIngredients.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>You need:</Text>
                  <View style={styles.ingredientsList}>
                    {recipe.missingIngredients.map((ingredient, index) => {
                      const details = getIngredientDetails(ingredient);
                      return (
                        <View key={`missing-${index}`} style={styles.ingredientItem}>
                          <Text style={styles.ingredientName}>
                            • {details.name}
                            <Text style={styles.ingredientQuantity}> ({details.quantity})</Text>
                          </Text>
                          <Text style={styles.macrosText}>
                            P: {details.macros.protein} • C: {details.macros.carbs} • F: {details.macros.fat}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </>
              )}
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
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: theme.colors.background.primary,
    width: '90%',
    height: '80%',
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  scrollContent: {
    padding: theme.spacing.md,
  },
  description: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    marginBottom: 4,
  },
  detailText: {
    marginLeft: 4,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  nutritionContainer: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.spacing.sm,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  macroLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  ingredientsContainer: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
    color: theme.colors.text.primary,
  },
  ingredientsList: {
    marginBottom: theme.spacing.md,
  },
  ingredientItem: {
    marginBottom: theme.spacing.xs,
  },
  ingredientName: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
  },
  ingredientQuantity: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
  },
  macrosText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginLeft: 12,
  },
  instructionsContainer: {
    marginBottom: theme.spacing.xl,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
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
});