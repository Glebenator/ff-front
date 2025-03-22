// services/sessionManager.ts
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mqttService, FridgeSession, FridgeItem } from '@/services/mqtt/mqttService';
import { ingredientDb } from '@/services/database/ingredientDb';
import { toastStore } from '@/services/toastStore';
import { EditableFridgeItem, EditableSession, SessionStatus } from '@/types/session';
import { CategoryUtils } from '@/utils/categoryUtils';
import { ExpiryUtils } from '@/utils/expiryUtils';
import { STORAGE_KEYS } from '@/constants/storage';

class SessionManager {
  private sessions: EditableSession[] = [];
  private subscribers: ((sessions: EditableSession[]) => void)[] = [];
  private userCategories: string[] = [];
  private processedSessionIds: Set<string> = new Set();
  private PROCESSED_SESSIONS_KEY = 'processed_session_ids';

  constructor() {
    this.initialize();
  }

  private async initialize() {
    await Promise.all([
      this.loadSessions(),
      this.loadCategories(),
      this.loadProcessedSessionIds()
    ]);
    
    if (Platform.OS !== 'web') {
      // Subscribe to MQTT sessions
      mqttService.subscribeToSessions(this.handleNewSession.bind(this));
      
      // Subscribe to MQTT heartbeat
      mqttService.subscribeToHeartbeat(this.handleHeartbeatUpdate.bind(this));
      
      // Try to connect to the MQTT broker
      try {
        await mqttService.connect();
      } catch (error) {
        console.error('Failed to connect to MQTT broker:', error);
      }
    }
  }

  // ===== Session Storage Methods =====
  
  private async loadSessions() {
    try {
      const storedSessions = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (storedSessions) {
        this.sessions = JSON.parse(storedSessions);
        console.log(`Loaded ${this.sessions.length} stored sessions`);
        this.notifySubscribers();
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  }

  private async saveSessions() {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(this.sessions));
    } catch (error) {
      console.error('Error saving sessions:', error);
    }
  }
  
  private async loadProcessedSessionIds() {
    try {
      const storedIds = await AsyncStorage.getItem(this.PROCESSED_SESSIONS_KEY);
      if (storedIds) {
        const idArray = JSON.parse(storedIds);
        this.processedSessionIds = new Set(idArray);
        console.log(`Loaded ${this.processedSessionIds.size} processed session IDs`);
      }
    } catch (error) {
      console.error('Error loading processed session IDs:', error);
    }
  }
  
  private async saveProcessedSessionIds() {
    try {
      const idArray = Array.from(this.processedSessionIds);
      await AsyncStorage.setItem(this.PROCESSED_SESSIONS_KEY, JSON.stringify(idArray));
    } catch (error) {
      console.error('Error saving processed session IDs:', error);
    }
  }
  
  private async loadCategories() {
    this.userCategories = await CategoryUtils.loadUserCategories();
  }

  // ===== Session Management Methods =====
  
  private handleNewSession(session: FridgeSession) {
    console.log(`Received session: ${session.sessionId} with ${session.items.length} items`);
    
    // Check if this session has already been processed
    if (this.processedSessionIds.has(session.sessionId)) {
      console.log(`Session ${session.sessionId} already processed, ignoring duplicate`);
      return;
    }
    
    // Check if we already have this session (by ID)
    const existingSessionIndex = this.sessions.findIndex(s => s.sessionId === session.sessionId);
    if (existingSessionIndex !== -1) {
      console.log(`Session ${session.sessionId} already exists in sessions list, ignoring duplicate`);
      return;
    }
    
    // It's a new session, add it
    const editableSession: EditableSession = {
      ...session,
      items: session.items.map(item => ({
        ...item,
        quantity: item.quantity || 1,
        category: CategoryUtils.inferCategory(item.name),
        expiryDate: ExpiryUtils.calculateDefaultExpiry(item.name)
      }))
    };

    this.sessions.unshift(editableSession);
    
    // If this is a pending session, show a notification toast
    if (session.status === 'pending') {
      toastStore.info(`New session with ${session.items.length} item(s) received`);
    }
    
    // Save and notify
    this.saveSessions();
    this.notifySubscribers();
    
    // Record this session as processed
    this.markSessionAsProcessed(session.sessionId);
  }
  
  private async markSessionAsProcessed(sessionId: string) {
    this.processedSessionIds.add(sessionId);
    
    // Maintain a reasonable size for the set (keep last 1000 sessions)
    if (this.processedSessionIds.size > 1000) {
      const idsArray = Array.from(this.processedSessionIds);
      this.processedSessionIds = new Set(idsArray.slice(-1000));
    }
    
    await this.saveProcessedSessionIds();
  }
  
  private handleHeartbeatUpdate(heartbeatInfo: {
    lastHeartbeat: number;
    raspberryPiStatus: 'online' | 'offline' | 'unknown';
  }) {
    // This is optional - you could use heartbeat info to show Pi status in the UI
    // For example, show a toast when the Pi goes offline
    if (heartbeatInfo.raspberryPiStatus === 'offline') {
      toastStore.warning('Raspberry Pi appears to be offline');
    } else if (heartbeatInfo.raspberryPiStatus === 'online') {
      // Optional: Show toast when Pi comes back online
      // toastStore.success('Raspberry Pi is online');
    }
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

    const changes = await this.processSessionItems(items);
    
    await this.saveSessions();
    this.notifySubscribers();
    return changes;
  }
  
  private async processSessionItems(items: EditableFridgeItem[]) {
    const changes = { added: 0, removed: 0 };
    
    try {
      for (const item of items) {
        if (item.direction === 'in') {
          await this.processIncomingItem(item);
          changes.added++;
        } else {
          const removedCount = await this.processOutgoingItem(item);
          changes.removed += removedCount;
        }
      }
      return changes;
    } catch (error) {
      console.error('Error processing session items:', error);
      throw error;
    }
  }
  
  private async processIncomingItem(item: EditableFridgeItem) {
    await ingredientDb.add({
      name: item.name,
      quantity: item.quantity.toString(),
      expiryDate: item.expiryDate || ExpiryUtils.calculateDefaultExpiry(item.name),
      category: item.category || CategoryUtils.inferCategory(item.name),
      notes: item.notes,
    });
  }
  
  private async processOutgoingItem(item: EditableFridgeItem) {
    const existingItems = await ingredientDb.getAll();
    const matchingItems = existingItems.filter(
      i => i.name.toLowerCase() === item.name.toLowerCase()
    );

    let remainingToRemove = item.quantity || 1;
    let removedCount = 0;

    for (const matchingItem of matchingItems) {
      const currentQuantity = parseInt(matchingItem.quantity) || 1;
      
      if (remainingToRemove >= currentQuantity) {
        // Remove entire item
        await ingredientDb.delete(matchingItem.id!);
        remainingToRemove -= currentQuantity;
        removedCount += currentQuantity;
      } else {
        // Partially reduce quantity
        const newQuantity = currentQuantity - remainingToRemove;
        await ingredientDb.update(matchingItem.id!, {
          quantity: newQuantity.toString()
        });
        removedCount += remainingToRemove;
        remainingToRemove = 0;
      }

      if (remainingToRemove <= 0) break;
    }

    if (remainingToRemove > 0) {
      toastStore.warning(`Could not remove all requested ${item.name} (insufficient quantity)`);
    }
    
    return removedCount;
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

  async clearSessions(status: SessionStatus) {
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

  // ===== Subscription Management =====
  
  subscribe(callback: (sessions: EditableSession[]) => void) {
    this.subscribers.push(callback);
    callback([...this.sessions]);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }
  
  private notifySubscribers() {
    this.subscribers.forEach(callback => callback([...this.sessions]));
  }

  // ===== Category Management =====
  
  getAvailableCategories(): string[] {
    const defaultCategories = CategoryUtils.getDefaultCategories();
    
    // Add user categories that aren't already in the default list
    this.userCategories.forEach(category => {
      if (!defaultCategories.includes(category)) {
        defaultCategories.push(category);
      }
    });
    
    return defaultCategories;
  }

  async addCategory(category: string): Promise<void> {
    if (!category.trim()) return;
    
    const trimmedCategory = category.trim();
    const currentCategories = this.getAvailableCategories();
    
    if (!currentCategories.includes(trimmedCategory) && 
        !this.userCategories.includes(trimmedCategory)) {
      this.userCategories.push(trimmedCategory);
      await CategoryUtils.saveUserCategories(this.userCategories);
    }
  }

  // ===== MQTT Status Methods =====
  
  isConnectedToMqtt(): boolean {
    return mqttService.isConnected();
  }
  
  getRaspberryPiStatus(): 'online' | 'offline' | 'unknown' {
    return mqttService.getRaspberryPiStatus();
  }
  
  reconnectToMqtt(): void {
    mqttService.reconnect();
  }

  // ===== Storage Utility Methods =====
  
  getItem(key: string): string | null {
    // This is a synchronous version just for compatibility.
    try {
      return AsyncStorage.getItem(key) as unknown as string;
    } catch (error) {
      console.error('Error getting item:', error);
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting item:', error);
    }
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();
export * from '@/types/session';