// hooks/useFavorites.ts
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type Recipe } from '@/services/api/recipeGenerationService';

const FAVORITES_STORAGE_KEY = 'fridgefriend_favorites'; // Standard key

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

  // Save favorites to storage whenever the favorites state changes
  useEffect(() => {
    const saveFavoritesToStorage = async () => {
      if (isLoading) return; // Skip saving during initial load
      try {
        console.log('Saving favorites from useEffect:', favorites.length);
        await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
      } catch (error) {
        console.error('Error saving favorites from useEffect:', error);
      }
    };

    saveFavoritesToStorage();
  }, [favorites, isLoading]);

  // Save favorites to storage
  const saveFavorites = async (newFavorites: Recipe[]) => {
    try {
      console.log('Saving favorites:', newFavorites.length);
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  const toggleFavorite = useCallback(async (recipe: Recipe) => {
    console.log('Toggle favorite called for:', recipe.id);
    setFavorites(prev => {
      const isFavorited = prev.some(fav => fav.id === recipe.id);
      console.log('Current favorite status:', isFavorited);
      const newFavorites = isFavorited
        ? prev.filter(fav => fav.id !== recipe.id)
        : [...prev, recipe];
      
      // Log the action
      console.log(`${isFavorited ? 'Removing from' : 'Adding to'} favorites: ${recipe.id}`);
      console.log('New favorites count:', newFavorites.length);
      
      // We no longer need to call saveFavorites here as it will be handled by the useEffect
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