// services/sessionManager.ts
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockMqttService, type FridgeSession } from './mqtt/mockMqttService';
import { ingredientDb, type Ingredient } from '@/services/database/ingredientDb';
import { toastStore } from '@/services/toastStore';

const SESSIONS_STORAGE_KEY = 'fridge_sessions';

// Extend the FridgeItem interface to include editable fields
export interface EditableFridgeItem {
  name: string;
  direction: 'in' | 'out';
  confidence: number;
  quantity: number;
  expiryDate?: string;
  category?: string;
  notes?: string;
}

export interface EditableSession extends Omit<FridgeSession, 'items'> {
  items: EditableFridgeItem[];
}

class SessionManager {
  private sessions: EditableSession[] = [];
  private subscribers: ((sessions: EditableSession[]) => void)[] = [];
  private defaultCategories = [
    'Dairy',
    'Meat',
    'Vegetables',
    'Fruits',
    'Beverages',
    'Condiments',
    'Other'
  ];

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
    // Convert regular session to editable session
    const editableSession: EditableSession = {
      ...session,
      items: session.items.map(item => ({
        ...item,
        quantity: item.quantity || 1,
        category: this.inferCategory(item.name),
        expiryDate: this.calculateDefaultExpiry(item.name)
      }))
    };

    this.sessions.unshift(editableSession);
    this.saveSessions();
    this.notifySubscribers();
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback([...this.sessions]));
  }

  async approveSession(sessionId: string, items: EditableFridgeItem[]) {
    const sessionIndex = this.sessions.findIndex(s => s.sessionId === sessionId);
    if (sessionIndex === -1) return;

    // Update session status
    this.sessions[sessionIndex] = {
      ...this.sessions[sessionIndex],
      items,
      status: 'approved'
    };

    const changes = {
      added: 0,
      removed: 0,
    };

    try {
      // Process all items
      for (const item of items) {
        if (item.direction === 'in') {
          // Add new item
          await ingredientDb.add({
            name: item.name,
            quantity: item.quantity.toString(),
            expiryDate: item.expiryDate || this.calculateDefaultExpiry(item.name),
            category: item.category || this.inferCategory(item.name),
            notes: item.notes,
          });
          changes.added++;
        } else {
          // Handle removal
          const existingItems = await ingredientDb.getAll();
          const matchingItems = existingItems.filter(
            i => i.name.toLowerCase() === item.name.toLowerCase()
          );

          let remainingToRemove = item.quantity;

          for (const matchingItem of matchingItems) {
            const currentQuantity = parseInt(matchingItem.quantity) || 1;
            
            if (remainingToRemove >= currentQuantity) {
              // Remove entire item
              await ingredientDb.delete(matchingItem.id!);
              remainingToRemove -= currentQuantity;
              changes.removed += currentQuantity;
            } else {
              // Partially reduce quantity
              const newQuantity = currentQuantity - remainingToRemove;
              await ingredientDb.update(matchingItem.id!, {
                quantity: newQuantity.toString()
              });
              changes.removed += remainingToRemove;
              remainingToRemove = 0;
            }

            if (remainingToRemove <= 0) break;
          }

          if (remainingToRemove > 0) {
            toastStore.warning(`Could not remove all requested ${item.name} (insufficient quantity)`);
          }
        }
      }

      await this.saveSessions();
      this.notifySubscribers();
      return changes;
    } catch (error) {
      console.error('Error processing session:', error);
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

    await this.saveSessions();
    this.notifySubscribers();
  }

  async clearSessions(status: 'pending' | 'approved' | 'rejected') {
    this.sessions = this.sessions.filter(session => session.status !== status);
    await this.saveSessions();
    this.notifySubscribers();
  }

  async updateSessionItem(
    sessionId: string,
    itemIndex: number,
    updates: Partial<EditableFridgeItem>
  ) {
    const sessionIndex = this.sessions.findIndex(s => s.sessionId === sessionId);
    if (sessionIndex === -1) return;

    const updatedItems = [...this.sessions[sessionIndex].items];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      ...updates
    };

    this.sessions[sessionIndex] = {
      ...this.sessions[sessionIndex],
      items: updatedItems
    };

    await this.saveSessions();
    this.notifySubscribers();
  }

  async removeSessionItem(sessionId: string, itemIndex: number) {
    const sessionIndex = this.sessions.findIndex(s => s.sessionId === sessionId);
    if (sessionIndex === -1) return;

    const updatedItems = this.sessions[sessionIndex].items.filter((_, index) => index !== itemIndex);

    this.sessions[sessionIndex] = {
      ...this.sessions[sessionIndex],
      items: updatedItems
    };

    await this.saveSessions();
    this.notifySubscribers();
  }

  subscribe(callback: (sessions: EditableSession[]) => void) {
    this.subscribers.push(callback);
    callback([...this.sessions]);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  getAvailableCategories(): string[] {
    return this.defaultCategories;
  }

  private calculateDefaultExpiry(itemName: string): string {
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
      beef: 3,
      fish: 2,
      carrots: 14,
      apples: 14,
      lettuce: 7,
      tomatoes: 7,
      bread: 5,
      juice: 7
    };

    return defaultExpiries[itemName.toLowerCase()] || 7;
  }

  private inferCategory(itemName: string): string {
    const lowerName = itemName.toLowerCase();
    
    const categoryMappings: { [key: string]: string[] } = {
      Dairy: ['milk', 'cheese', 'yogurt', 'butter', 'cream'],
      Meat: ['chicken', 'beef', 'pork', 'fish', 'salmon'],
      Vegetables: ['carrot', 'lettuce', 'tomato', 'cucumber', 'pepper'],
      Fruits: ['apple', 'banana', 'orange', 'grape', 'berry'],
      Beverages: ['juice', 'soda', 'water', 'tea', 'coffee'],
      Condiments: ['ketchup', 'mustard', 'mayo', 'sauce', 'dressing']
    };

    for (const [category, keywords] of Object.entries(categoryMappings)) {
      if (keywords.some(keyword => lowerName.includes(keyword))) {
        return category;
      }
    }

    return 'Other';
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();