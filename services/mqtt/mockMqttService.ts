// services/mqtt/mockMqttService.ts

export interface FridgeSession {
    sessionId: string;
    timestamp: number;
    items: FridgeItem[];
    status: 'pending' | 'approved' | 'rejected';
  }
  
  export interface FridgeItem {
    name: string;
    direction: 'in' | 'out';
    confidence: number;
    quantity?: number;
  }
  
  type SessionCallback = (session: FridgeSession) => void;
  
  class MockMqttService {
    private subscribers: SessionCallback[] = [];
    private mockItems = [
      'Milk',
      'Eggs',
      'Cheese',
      'Yogurt',
      'Butter',
      'Chicken',
      'Carrots',
      'Apples',
      'Lettuce',
      'Tomatoes'
    ];
  
    constructor() {
      // Simulate random sessions every 30-90 seconds
      setInterval(this.generateMockSession.bind(this), this.getRandomInterval());
    }
  
    private getRandomInterval(): number {
      return Math.floor(Math.random() * (90000 - 30000) + 30000); // 30-90 seconds
    }
  
    private generateMockSession() {
      const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items
      const items: FridgeItem[] = [];
  
      for (let i = 0; i < numItems; i++) {
        items.push({
          name: this.mockItems[Math.floor(Math.random() * this.mockItems.length)],
          direction: Math.random() > 0.5 ? 'in' : 'out',
          confidence: Math.random() * 0.5 + 0.5, // 50-100% confidence
        });
      }
  
      const session: FridgeSession = {
        sessionId: Math.random().toString(36).substring(7),
        timestamp: Date.now(),
        items,
        status: 'pending'
      };
  
      this.notifySubscribers(session);
    }
  
    private notifySubscribers(session: FridgeSession) {
      this.subscribers.forEach(callback => callback(session));
    }
  
    subscribe(callback: SessionCallback) {
      this.subscribers.push(callback);
      return () => {
        this.subscribers = this.subscribers.filter(cb => cb !== callback);
      };
    }
  
    // For testing purposes
    triggerMockSession() {
      this.generateMockSession();
    }
  }
  
  // Export singleton instance
  export const mockMqttService = new MockMqttService();