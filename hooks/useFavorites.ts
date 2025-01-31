// hooks/useFavorites.ts
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type Recipe } from '@/services/ai/mockGeminiService';

const FAVORITES_STORAGE_KEY = '@recipe_favorites';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load favorites from storage
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const storedFavorites = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
        if (storedFavorites) {
          setFavorites(JSON.parse(storedFavorites));
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFavorites();
  }, []);

  // Save favorites to storage
  const saveFavorites = async (newFavorites: Recipe[]) => {
    try {
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  const toggleFavorite = useCallback(async (recipe: Recipe) => {
    setFavorites(prev => {
      const isFavorite = prev.some(fav => fav.id === recipe.id);
      const newFavorites = isFavorite
        ? prev.filter(fav => fav.id !== recipe.id)
        : [...prev, recipe];
      
      saveFavorites(newFavorites);
      return newFavorites;
    });
  }, []);

  const isFavorite = useCallback((recipeId: string) => {
    return favorites.some(fav => fav.id === recipeId);
  }, [favorites]);

  return {
    favorites,
    isLoading,
    toggleFavorite,
    isFavorite
  };
};