// services/notifications/notificationService.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ingredientDb } from '@/services/database/ingredientDb';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  // Request permissions for notifications
  static async requestPermissions() {
    if (Platform.OS === 'web') {
      console.log('Notifications not supported on web platform');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push notification permissions');
      return false;
    }

    return true;
  }

  // Schedule notification for items expiring tomorrow
  static async scheduleExpiryNotification(ingredientId: number) {
    if (Platform.OS === 'web') return;

    try {
      const ingredient = await ingredientDb.getById(ingredientId);
      if (!ingredient) return;

      const expiryDate = new Date(ingredient.expiryDate);
      const notificationDate = new Date(expiryDate);
      notificationDate.setDate(expiryDate.getDate() - 1); // Set to day before expiry
      notificationDate.setHours(9, 0, 0); // Set to 9:00 AM

      // Only schedule if the notification time is in the future
      if (notificationDate > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Item Expiring Tomorrow',
            body: `${ingredient.name} will expire tomorrow. Remember to use it soon!`,
            data: { ingredientId: ingredient.id },
          },
          trigger: {
            date: notificationDate,
          },
        });

        console.log(`Scheduled notification for ${ingredient.name}`);
      }
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }

  // Cancel a specific notification (if needed)
  static async cancelNotification(ingredientId: number) {
    if (Platform.OS === 'web') return;

    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      const notification = notifications.find(
        n => n.content.data?.ingredientId === ingredientId
      );

      if (notification) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        console.log(`Cancelled notification for ingredient ${ingredientId}`);
      }
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }
}