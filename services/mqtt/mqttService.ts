// services/mqtt/mqttService.ts
// Complete MQTT service implementation using Paho MQTT library

import AsyncStorage from '@react-native-async-storage/async-storage';
import Paho from 'paho-mqtt';

// Message format for MQTT messages
export interface MqttMessage {
  topic: string;
  message: string;
  timestamp: number;
  id: string;
}

// FridgeItem definition (moved from mockMqttService.ts)
export interface FridgeItem {
  name: string;
  direction: 'in' | 'out';
  confidence: number;
  quantity?: number;
}

// FridgeSession definition (moved from mockMqttService.ts)
export interface FridgeSession {
  sessionId: string;
  timestamp: number;
  items: FridgeItem[];
  status: 'pending' | 'approved' | 'rejected';
}

// Configuration for MQTT connection
export interface MqttConfig {
  broker: string;
  port: number;
  username: string;
  password: string;
  topic: string;
}

// MQTT Service class
export class MqttService {
  private client: Paho.Client | null = null;
  private messages: MqttMessage[] = [];
  private subscribers: ((message: MqttMessage) => void)[] = [];
  private connectionListeners: ((status: boolean) => void)[] = [];
  private sessionListeners: ((session: FridgeSession) => void)[] = [];
  private isConnectedState: boolean = false;
  private connecting: boolean = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private maxStoredMessages: number = 100;
  private storageKey: string = 'mqtt_messages';
  
  // Connection parameters
  private config: MqttConfig = {
    broker: '',
    port: 1883,
    username: '',
    password: '',
    topic: ''
  };
  
  private clientId: string = `expo_${Math.random().toString(16).substr(2, 8)}`;
  
  constructor() {
    this.loadMessages();
  }
  
  // Configure the MQTT connection
  public configure(config: MqttConfig): void {
    this.config = { ...config };
  }
  
  // Get current connection status
  public isConnected(): boolean {
    return this.isConnectedState;
  }
  
  // Connect to the MQTT broker
  public async connect(): Promise<void> {
    if (this.client || this.connecting) return;
    
    if (!this.config.broker || !this.config.topic) {
      throw new Error('MQTT broker and topic must be configured before connecting');
    }
    
    this.connecting = true;
    console.log(`Connecting to MQTT broker ${this.config.broker}:${this.config.port}...`);

    try {
      // For Paho MQTT we need to use a WebSocket connection
      this.client = new Paho.Client(
        this.config.broker,
        this.config.port,
        "/mqtt", // WebSocket path
        this.clientId
      );

      // Set callback handlers
      this.client.onConnectionLost = this.handleConnectionLost;
      this.client.onMessageArrived = this.handleMessageArrived;
      
      // Connect the client
      const connectOptions: Paho.ConnectionOptions = {
        useSSL: false,
        userName: this.config.username,
        password: this.config.password,
        onSuccess: this.handleConnect,
        onFailure: this.handleConnectFailure,
        reconnect: true,
        keepAliveInterval: 30,
      };

      console.log('Attempting to connect to MQTT broker...');
      this.client.connect(connectOptions);
    } catch (error) {
      console.error('MQTT connection error:', error);
      this.connecting = false;
      this.scheduleReconnect();
      throw error;
    }
  }

  // Disconnect from the MQTT broker
  public disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.client && this.isConnectedState) {
      try {
        this.client.disconnect();
        console.log('MQTT disconnected');
      } catch (error) {
        console.error('Error disconnecting from MQTT:', error);
      }
      this.client = null;
      this.updateConnectionStatus(false);
      this.connecting = false;
    }
  }

  // Publish a message to a topic
  public publish(topic: string, message: string): void {
    if (this.client && this.isConnectedState) {
      try {
        const mqttMessage = new Paho.Message(message);
        mqttMessage.destinationName = topic;
        mqttMessage.qos = 0;
        mqttMessage.retained = false;
        this.client.send(mqttMessage);
      } catch (error) {
        console.error('Error publishing MQTT message:', error);
      }
    } else {
      console.warn('Cannot publish: MQTT client not connected');
    }
  }
  
  // Subscribe to receive messages
  public subscribe(callback: (message: MqttMessage) => void): () => void {
    this.subscribers.push(callback);
    
    // Send existing messages to new subscriber
    this.messages.forEach(message => {
      callback(message);
    });
    
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }
  
  // Subscribe to connection status changes
  public onConnectionChange(callback: (status: boolean) => void): () => void {
    this.connectionListeners.push(callback);
    callback(this.isConnectedState);
    
    return () => {
      this.connectionListeners = this.connectionListeners.filter(cb => cb !== callback);
    };
  }
  
  // Subscribe to fridge sessions
  public subscribeToSessions(callback: (session: FridgeSession) => void): () => void {
    this.sessionListeners.push(callback);
    return () => {
      this.sessionListeners = this.sessionListeners.filter(cb => cb !== callback);
    };
  }
  
  // Get all stored messages
  public getMessages(): MqttMessage[] {
    return [...this.messages];
  }
  
  // Clear message history
  public clearMessages(): void {
    this.messages = [];
    this.saveMessages();
  }

  // Handle successful connection
  private handleConnect = () => {
    console.log('MQTT Connected!');
    this.connecting = false;
    this.updateConnectionStatus(true);
    
    // Subscribe to the configured topic
    if (this.client && this.config.topic) {
      this.client.subscribe(this.config.topic, {
        qos: 0,
        onSuccess: () => {
          console.log(`Subscribed to ${this.config.topic}`);
        },
        onFailure: (error) => {
          console.error('MQTT subscription error:', error);
        }
      });
    }
  };

  // Handle connection failure
  private handleConnectFailure = (error: any) => {
    console.error('MQTT connection failed:', error);
    this.connecting = false;
    this.updateConnectionStatus(false);
    this.scheduleReconnect();
  };

  // Handle connection lost
  private handleConnectionLost = (responseObject: any) => {
    if (responseObject.errorCode !== 0) {
      console.log(`MQTT connection lost: ${responseObject.errorMessage}`);
    }
    this.updateConnectionStatus(false);
    this.connecting = false;
    this.scheduleReconnect();
  };

  // Handle incoming messages
  private handleMessageArrived = (mqttMessage: any) => {
    try {
      const topic = mqttMessage.destinationName;
      const messageStr = mqttMessage.payloadString;
      console.log(`MQTT message on ${topic}: ${messageStr}`);
      
      const message: MqttMessage = {
        topic,
        message: messageStr,
        timestamp: Date.now(),
        id: Math.random().toString(36).substring(2, 15),
      };
      
      // Add to message history
      this.addMessage(message);
      
      // Notify subscribers
      this.notifySubscribers(message);
      
      // Try to parse as FridgeSession
      this.tryParseAsSession(message);
    } catch (error) {
      console.error('Error processing MQTT message:', error);
    }
  };
  
  // Try to parse a message as a FridgeSession
  private tryParseAsSession(message: MqttMessage): void {
    try {
      const data = JSON.parse(message.message);
      
      // Check if the message follows FridgeSession structure
      if (
        data.sessionId && 
        data.timestamp && 
        Array.isArray(data.items) && 
        data.status
      ) {
        const session: FridgeSession = data;
        this.notifySessionListeners(session);
      }
    } catch (error) {
      // Not a valid session, just ignore
    }
  }

  // Schedule a reconnection attempt
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    this.reconnectTimeout = setTimeout(() => {
      if (!this.isConnectedState && !this.connecting) {
        console.log('Attempting to reconnect to MQTT...');
        this.connect();
      }
    }, 5000); // Try to reconnect after 5 seconds
  }
  
  // Notify all subscribers of a new message
  private notifySubscribers(message: MqttMessage): void {
    this.subscribers.forEach(callback => callback(message));
  }
  
  // Notify session listeners of a new session
  private notifySessionListeners(session: FridgeSession): void {
    this.sessionListeners.forEach(callback => callback(session));
  }
  
  // Update and notify about connection status changes
  private updateConnectionStatus(status: boolean): void {
    if (this.isConnectedState !== status) {
      this.isConnectedState = status;
      this.connectionListeners.forEach(listener => listener(status));
    }
  }
  
  // Add a message to the history
  private addMessage(message: MqttMessage): void {
    this.messages.push(message);
    
    // Trim message history if it exceeds the maximum size
    if (this.messages.length > this.maxStoredMessages) {
      this.messages = this.messages.slice(-this.maxStoredMessages);
    }
    
    this.saveMessages();
  }
  
  // Save messages to AsyncStorage
  private async saveMessages(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.messages));
    } catch (error) {
      console.error('Error saving MQTT messages:', error);
    }
  }
  
  // Load messages from AsyncStorage
  private async loadMessages(): Promise<void> {
    try {
      const storedMessages = await AsyncStorage.getItem(this.storageKey);
      if (storedMessages) {
        this.messages = JSON.parse(storedMessages);
      }
    } catch (error) {
      console.error('Error loading MQTT messages:', error);
    }
  }
}

// Export singleton instance
export const mqttService = new MqttService();