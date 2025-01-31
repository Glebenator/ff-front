// services/sessionManager.ts
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockMqttService, type FridgeSession } from './mqtt/mockMqttService';
import { ingredientDb } from './database/ingredientDb';

const SESSIONS_STORAGE_KEY = 'fridge_sessions';

class SessionManager {
  private sessions: FridgeSession[] = [];
  private subscribers: ((sessions: FridgeSession[]) => void)[] = [];

  constructor() {
    this.loadSessions();
    if (Platform.OS !== 'web') {
      mockMqttService.subscribe(this.handleNewSession.bind(this));
    }
  }

  private async loadSessions() {
    try {
      const storedSessions = await AsyncStorage.getItem(SESSIONS_STORAGE_KEY);
      if (storedSessions) {
        this.sessions = JSON.parse(storedSessions);
        this.notifySubscribers();
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  }

  private async saveSessions() {
    try {
      await AsyncStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(this.sessions));
    } catch (error) {
      console.error('Error saving sessions:', error);
    }
  }

  private handleNewSession(session: FridgeSession) {
    this.sessions.unshift(session);
    this.saveSessions();
    this.notifySubscribers();
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback([...this.sessions]));
  }

  async approveSession(sessionId: string, updatedItems: FridgeSession['items']) {
    const sessionIndex = this.sessions.findIndex(s => s.sessionId === sessionId);
    if (sessionIndex === -1) return;

    // Update session status
    this.sessions[sessionIndex] = {
      ...this.sessions[sessionIndex],
      items: updatedItems,
      status: 'approved'
    };

    // Track changes for summary
    const changes = {
      added: 0,
      removed: 0,
    };

    // Update database based on items
    try {
      for (const item of updatedItems) {
        if (item.direction === 'in') {
          // Add new item to database
          await ingredientDb.add({
            name: item.name,
            quantity: item.quantity?.toString() || '1',
            expiryDate: this.calculateDefaultExpiry(item.name),
            category: this.inferCategory(item.name)
          });
          changes.added++;
        } else {
          // Find items to remove
          const existingItems = await ingredientDb.getAll();
          const matchingItems = existingItems.filter(
            i => i.name.toLowerCase() === item.name.toLowerCase()
          );

          // Remove items based on quantity
          const quantityToRemove = item.quantity || 1;
          let remainingToRemove = quantityToRemove;

          for (const matchingItem of matchingItems) {
            const currentQuantity = parseInt(matchingItem.quantity) || 1;
            
            if (remainingToRemove >= currentQuantity) {
              // Remove entire item
              await ingredientDb.delete(matchingItem.id!);
              remainingToRemove -= currentQuantity;
              changes.removed++;
            } else {
              // Partially reduce quantity
              const newQuantity = currentQuantity - remainingToRemove;
              await ingredientDb.update(matchingItem.id!, {
                quantity: newQuantity.toString()
              });
              remainingToRemove = 0;
              changes.removed++;
              break;
            }

            if (remainingToRemove <= 0) break;
          }
        }
      }

      this.saveSessions();
      this.notifySubscribers();

      // Return changes summary
      return changes;
    } catch (error) {
      console.error('Error updating database:', error);
      throw error;
    }
  }

  async rejectSession(sessionId: string) {
    const sessionIndex = this.sessions.findIndex(s => s.sessionId === sessionId);
    if (sessionIndex === -1) return;

    this.sessions[sessionIndex] = {
      ...this.sessions[sessionIndex],
      status: 'rejected'
    };

    this.saveSessions();
    this.notifySubscribers();
  }

  subscribe(callback: (sessions: FridgeSession[]) => void) {
    this.subscribers.push(callback);
    callback([...this.sessions]);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  getPendingSessions() {
    return this.sessions.filter(session => session.status === 'pending');
  }

  private calculateDefaultExpiry(itemName: string): string {
    // Simple expiry calculation - can be made more sophisticated
    const today = new Date();
    const daysToAdd = this.getDefaultExpiryDays(itemName);
    today.setDate(today.getDate() + daysToAdd);
    return today.toISOString().split('T')[0];
  }

  private getDefaultExpiryDays(itemName: string): number {
    const defaultExpiries: { [key: string]: number } = {
      milk: 7,
      eggs: 21,
      cheese: 14,
      yogurt: 14,
      butter: 30,
      chicken: 2,
      carrots: 14,
      apples: 14,
      lettuce: 7,
      tomatoes: 7
    };

    return defaultExpiries[itemName.toLowerCase()] || 7;
  }

  private inferCategory(itemName: string): string {
    const categories: { [key: string]: string } = {
      milk: 'Dairy',
      eggs: 'Dairy',
      cheese: 'Dairy',
      yogurt: 'Dairy',
      butter: 'Dairy',
      chicken: 'Meat',
      carrots: 'Vegetables',
      apples: 'Fruits',
      lettuce: 'Vegetables',
      tomatoes: 'Vegetables'
    };

    return categories[itemName.toLowerCase()] || 'Other';
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();