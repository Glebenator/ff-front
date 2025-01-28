// hooks/useIngredientManagement.ts
import { Platform } from 'react-native';
import { ingredientDb, type Ingredient } from '@/services/database/ingredientDb';
import { NotificationService } from '@/services/notifications/notificationService';

export const useIngredientManagement = () => {
  const addIngredient = async (ingredient: Omit<Ingredient, 'id' | 'dateAdded'>) => {
    try {
      const id = await ingredientDb.add(ingredient);
      
      if (Platform.OS !== 'web' && id) {
        await NotificationService.scheduleExpiryNotification(id);
      }
      
      return id;
    } catch (error) {
      console.error('Error adding ingredient:', error);
      throw error;
    }
  };

  const updateIngredient = async (id: number, updates: Partial<Omit<Ingredient, 'id' | 'dateAdded'>>) => {
    try {
      await ingredientDb.update(id, updates);
      
      if (Platform.OS !== 'web') {
        // Cancel existing notification and schedule new one if expiry date was updated
        if (updates.expiryDate) {
          await NotificationService.cancelNotification(id);
          await NotificationService.scheduleExpiryNotification(id);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error updating ingredient:', error);
      throw error;
    }
  };

  const deleteIngredient = async (id: number) => {
    try {
      await ingredientDb.delete(id);
      
      if (Platform.OS !== 'web') {
        await NotificationService.cancelNotification(id);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting ingredient:', error);
      throw error;
    }
  };

  return {
    addIngredient,
    updateIngredient,
    deleteIngredient,
  };
};