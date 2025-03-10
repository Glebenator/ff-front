// services/mqtt/mqttService.ts
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Paho from 'paho-mqtt';

export interface MqttMessage {
  topic: string;
  message: string;
  timestamp: number;
  id: string;
}

type MqttCallback = (message: MqttMessage) => void;

class MqttService {
  private client: Paho.Client | null = null;
  private subscribers: MqttCallback[] = [];
  private messages: MqttMessage[] = [];
  private isConnected: boolean = false;
  private connecting: boolean = false;
  private connectionListeners: ((status: boolean) => void)[] = [];
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private maxStoredMessages: number = 100;
  
  // Connection parameters
  private broker: string = '';
  private port: number = 1883;
  private username: string = '';
  private password: string = '';
  private topic: string = '';
  private clientId: string = `expo_${Math.random().toString(16).substr(2, 8)}`;

  constructor() {
    this.loadStoredMessages();
  }

  private async loadStoredMessages() {
    try {
      const storedMessages = await AsyncStorage.getItem('mqtt_messages');
      if (storedMessages) {
        this.messages = JSON.parse(storedMessages);
        // Notify subscribers of stored messages
        this.messages.forEach(msg => {
          this.notifySubscribers(msg);
        });
      }
    } catch (error) {
      console.error('Error loading stored MQTT messages:', error);
    }
  }

  private async saveMessages() {
    try {
      // Only store the last N messages
      const messagesToStore = this.messages.slice(-this.maxStoredMessages);
      await AsyncStorage.setItem('mqtt_messages', JSON.stringify(messagesToStore));
    } catch (error) {
      console.error('Error saving MQTT messages:', error);
    }
  }

  // Get connection status
  public isClientConnected(): boolean {
    return this.isConnected;
  }

  // Listen for connection status changes
  public onConnectionChange(callback: (status: boolean) => void) {
    this.connectionListeners.push(callback);
    // Immediately call with current status
    callback(this.isConnected);
    return () => {
      this.connectionListeners = this.connectionListeners.filter(cb => cb !== callback);
    };
  }

  private updateConnectionStatus(status: boolean) {
    if (this.isConnected !== status) {
      this.isConnected = status;
      this.connectionListeners.forEach(listener => listener(status));
    }
  }

  // Configure connection parameters
  public configure(config: {
    broker: string;
    port: number;
    username: string;
    password: string;
    topic: string;
  }) {
    this.broker = config.broker;
    this.port = config.port;
    this.username = config.username;
    this.password = config.password;
    this.topic = config.topic;
  }

  // Connect to the MQTT broker
  public async connect() {
    if (this.client || this.connecting) return;
    
    this.connecting = true;

    try {
      // For Paho MQTT we need to use a WebSocket connection, since this is running in a browser environment
      // Create a client instance
      this.client = new Paho.Client(
        this.broker,
        this.port,
        "/mqtt", // WebSocket path
        this.clientId
      );

      // Set callback handlers
      this.client.onConnectionLost = this.handleConnectionLost;
      this.client.onMessageArrived = this.handleMessageArrived;
      
      // Connect the client
      const connectOptions: Paho.ConnectionOptions = {
        useSSL: false,
        userName: this.username,
        password: this.password,
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
    }
  }

  // Handle successful connection
  private handleConnect = () => {
    console.log('MQTT Connected!');
    this.connecting = false;
    this.updateConnectionStatus(true);
    
    // Subscribe to the configured topic
    if (this.client && this.topic) {
      this.client.subscribe(this.topic, {
        qos: 0,
        onSuccess: () => {
          console.log(`Subscribed to ${this.topic}`);
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
      this.messages.push(message);
      if (this.messages.length > this.maxStoredMessages) {
        this.messages.shift(); // Remove oldest message if we exceed max size
      }
      
      // Save messages to storage
      this.saveMessages();
      
      // Notify subscribers
      this.notifySubscribers(message);
    } catch (error) {
      console.error('Error processing MQTT message:', error);
    }
  };

  // Schedule a reconnection attempt
  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    this.reconnectTimeout = setTimeout(() => {
      if (!this.isConnected && !this.connecting) {
        console.log('Attempting to reconnect to MQTT...');
        this.connect();
      }
    }, 5000); // Try to reconnect after 5 seconds
  }

  // Disconnect from the MQTT broker
  public disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.client && this.isConnected) {
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

  // Subscribe to receive messages
  public subscribe(callback: MqttCallback) {
    this.subscribers.push(callback);
    
    // Send existing messages to new subscriber
    this.messages.forEach(message => {
      callback(message);
    });
    
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  // Publish a message to a topic
  public publish(topic: string, message: string) {
    if (this.client && this.isConnected) {
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

  // Notify all subscribers of a new message
  private notifySubscribers(message: MqttMessage) {
    this.subscribers.forEach(callback => callback(message));
  }

  // Get all stored messages
  public getMessages(): MqttMessage[] {
    return [...this.messages];
  }

  // Clear message history
  public clearMessages() {
    this.messages = [];
    this.saveMessages();
  }
}

// Export singleton instance
export const mqttService = new MqttService();