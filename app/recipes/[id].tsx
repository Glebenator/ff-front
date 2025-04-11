import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { theme } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { sharedStyles } from '@/styles/sharedStyles';
import { RecipeType } from '@/types/types';

export const RecipeDetailScreen = () => {
  const { recipe } = useLocalSearchParams<{ recipe: RecipeType }>();

  if (!recipe) {
    return (
      <View style={sharedStyles.container}>
        <Text>No recipe data found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{recipe.name}</Text>
      </View>
      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={20} color={theme.colors.text.secondary} />
          <Text style={styles.infoText}>{recipe.estimatedTime} min</Text>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{recipe.description}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ingredients</Text>
        {recipe.ingredients.map((ingredient, index) => (
          <View key={index} style={styles.ingredientItem}>
            <Text style={styles.ingredientText}>{ingredient}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    padding: theme.spacing.md,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  infoSection: {
    marginBottom: theme.spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
  },
  ingredientItem: {
    marginBottom: theme.spacing.xs,
  },
  ingredientText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
  },
});