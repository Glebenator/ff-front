// services/mqtt/mqttService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import Paho from 'paho-mqtt';
import * as Device from 'expo-device';

// Message format for MQTT messages
export interface MqttMessage {
  topic: string;
  message: string;
  timestamp: number;
  id: string;
}

// FridgeItem definition
export interface FridgeItem {
  name: string;
  direction: 'in' | 'out';
  confidence: number;
  quantity?: number;
}

// FridgeSession definition
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

// Heartbeat information
interface HeartbeatInfo {
  lastHeartbeat: number;
  raspberryPiStatus: 'online' | 'offline' | 'unknown';
}

// MQTT Service class
export class MqttService {
  private client: Paho.Client | null = null;
  private messages: MqttMessage[] = [];
  private subscribers: ((message: MqttMessage) => void)[] = [];
  private connectionListeners: ((status: boolean) => void)[] = [];
  private sessionListeners: ((session: FridgeSession) => void)[] = [];
  private heartbeatListeners: ((info: HeartbeatInfo) => void)[] = [];
  private isConnectedState: boolean = false;
  private connecting: boolean = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatTimeout: NodeJS.Timeout | null = null;
  private maxStoredMessages: number = 100;
  private storageKey: string = 'mqtt_messages';
  private heartbeatInfo: HeartbeatInfo = {
    lastHeartbeat: 0,
    raspberryPiStatus: 'unknown'
  };
  
  // Connection parameters
  private config: MqttConfig = {
    broker: '192.168.50.14',
    port: 9001,
    username: 'coolcake',
    password: 'coolcake2',
    topic: 'rpi/test'
  };
  
  private clientId: string = '';
  private CLIENT_ID_STORAGE_KEY = 'mqtt_client_id';
  private HEARTBEAT_TIMEOUT = 60000; // 60 seconds timeout for heartbeat
  
  constructor() {
    this.loadMessages();
    this.loadClientId();
  }
  
  // Load or generate a consistent clientId
  private async loadClientId() {
    try {
      let storedId = await AsyncStorage.getItem(this.CLIENT_ID_STORAGE_KEY);
      
      if (!storedId) {
        // Generate a new client ID based on device info
        const deviceName = Device.deviceName || 'unknown_device';
        storedId = `expo_${deviceName.replace(/[^a-zA-Z0-9]/g, '_')}_${Math.random().toString(16).substr(2, 8)}`;
        await AsyncStorage.setItem(this.CLIENT_ID_STORAGE_KEY, storedId);
      }
      
      this.clientId = storedId;
      console.log(`Using MQTT client ID: ${this.clientId}`);
    } catch (error) {
      console.error('Error loading/generating client ID:', error);
      // Fallback to a random ID if loading fails
      this.clientId = `expo_fallback_${Math.random().toString(16).substr(2, 8)}`;
    }
  }
  
  // Configure the MQTT connection
  public configure(config: MqttConfig): void {
    this.config = { ...config };
  }
  
  // Get current connection status
  public isConnected(): boolean {
    return this.isConnectedState;
  }
  
  // Get Raspberry Pi status based on heartbeat
  public getRaspberryPiStatus(): 'online' | 'offline' | 'unknown' {
    return this.heartbeatInfo.raspberryPiStatus;
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
      // Ensure we have a client ID
      if (!this.clientId) {
        await this.loadClientId();
      }
      
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
        cleanSession: false, // This enables persistent sessions
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

  // Manually trigger a reconnection
  public reconnect(): void {
    if (!this.isConnectedState && !this.connecting) {
      console.log('Manually triggering reconnection to MQTT...');
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      this.connect();
    }
  }

  // Disconnect from the MQTT broker
  public disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
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
      
      // Update Raspberry Pi status on disconnect
      this.updateHeartbeatInfo({
        lastHeartbeat: this.heartbeatInfo.lastHeartbeat,
        raspberryPiStatus: 'unknown'
      });
    }
  }

  // Publish a message to a topic
  public publish(topic: string, message: string, qos: 0 | 1 | 2 = 1, retained: boolean = false): void {
    if (this.client && this.isConnectedState) {
      try {
        const mqttMessage = new Paho.Message(message);
        mqttMessage.destinationName = topic;
        mqttMessage.qos = qos;
        mqttMessage.retained = retained;
        this.client.send(mqttMessage);
        console.log(`Published message to ${topic} (QoS: ${qos}, Retained: ${retained})`);
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
  
  // Subscribe to heartbeat updates
  public subscribeToHeartbeat(callback: (info: HeartbeatInfo) => void): () => void {
    this.heartbeatListeners.push(callback);
    callback({ ...this.heartbeatInfo });
    
    return () => {
      this.heartbeatListeners = this.heartbeatListeners.filter(cb => cb !== callback);
    };
  }
  
  // Get all stored messages
  public getMessages(): MqttMessage[] {
    return [...this.messages];
  }
  
  // Get last heartbeat info
  public getHeartbeatInfo(): HeartbeatInfo {
    return { ...this.heartbeatInfo };
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
    
    // Subscribe to the configured topic with QoS 1
    if (this.client && this.config.topic) {
      // Main topic for sessions
      this.client.subscribe(this.config.topic, {
        qos: 1,
        onSuccess: () => {
          console.log(`Subscribed to ${this.config.topic} with QoS 1`);
        },
        onFailure: (error) => {
          console.error('MQTT subscription error:', error);
        }
      });
      
      // Subscribe to heartbeat topic with QoS 1
      const heartbeatTopic = `${this.config.topic}/heartbeat`;
      this.client.subscribe(heartbeatTopic, {
        qos: 1,
        onSuccess: () => {
          console.log(`Subscribed to heartbeat topic: ${heartbeatTopic}`);
        },
        onFailure: (error) => {
          console.error('MQTT heartbeat subscription error:', error);
        }
      });
      
      // Start heartbeat timeout
      this.startHeartbeatTimeout();
      
      // Publish app status to let Pi know we're online
      this.publishAppStatus('online');
    }
  };

  // Handle connection failure
  private handleConnectFailure = (error: any) => {
    console.error('MQTT connection failed:', error);
    this.connecting = false;
    this.updateConnectionStatus(false);
    this.scheduleReconnect();
    
    // Update Raspberry Pi status on connection failure
    this.updateHeartbeatInfo({
      lastHeartbeat: this.heartbeatInfo.lastHeartbeat,
      raspberryPiStatus: 'unknown'
    });
  };

  // Handle connection lost
  private handleConnectionLost = (responseObject: any) => {
    if (responseObject.errorCode !== 0) {
      console.log(`MQTT connection lost: ${responseObject.errorMessage}`);
    }
    this.updateConnectionStatus(false);
    this.connecting = false;
    this.scheduleReconnect();
    
    // Stop heartbeat timeout
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
    
    // Update Raspberry Pi status on disconnect
    this.updateHeartbeatInfo({
      lastHeartbeat: this.heartbeatInfo.lastHeartbeat,
      raspberryPiStatus: 'unknown'
    });
  };

  // Handle incoming messages
  private handleMessageArrived = (mqttMessage: any) => {
    try {
      const topic = mqttMessage.destinationName;
      const messageStr = mqttMessage.payloadString;
      
      // Create message object
      const message: MqttMessage = {
        topic,
        message: messageStr,
        timestamp: Date.now(),
        id: Math.random().toString(36).substring(2, 15),
      };
      
      // Handle heartbeat messages
      if (topic === `${this.config.topic}/heartbeat`) {
        this.handleHeartbeat(messageStr);
        return;
      }
      
      console.log(`MQTT message on ${topic}: ${messageStr.substring(0, 100)}${messageStr.length > 100 ? '...' : ''}`);
      
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
  
  // Handle heartbeat messages
  private handleHeartbeat(messageStr: string): void {
    try {
      const data = JSON.parse(messageStr);
      const timestamp = data.timestamp || Date.now();
      
      // Update heartbeat info
      this.updateHeartbeatInfo({
        lastHeartbeat: timestamp,
        raspberryPiStatus: 'online'
      });
      
      // Reset heartbeat timeout
      this.startHeartbeatTimeout();
      
      console.log(`Received heartbeat from Raspberry Pi at ${new Date(timestamp).toLocaleTimeString()}`);
    } catch (error) {
      console.error('Error processing heartbeat message:', error);
    }
  }
  
  // Start heartbeat timeout
  private startHeartbeatTimeout(): void {
    // Clear any existing timeout
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
    }
    
    // Set new timeout
    this.heartbeatTimeout = setTimeout(() => {
      console.log('Heartbeat timeout reached, marking Raspberry Pi as offline');
      
      // Update status to offline
      this.updateHeartbeatInfo({
        lastHeartbeat: this.heartbeatInfo.lastHeartbeat,
        raspberryPiStatus: 'offline'
      });
      
    }, this.HEARTBEAT_TIMEOUT);
  }
  
  // Publish app status to let Pi know we're online/offline
  private publishAppStatus(status: 'online' | 'offline'): void {
    if (this.client && this.isConnectedState && this.config.topic) {
      const statusMessage = {
        clientId: this.clientId,
        status: status,
        timestamp: Date.now(),
        deviceName: Device.deviceName || 'unknown'
      };
      
      this.publish(
        `${this.config.topic}/app_status`,
        JSON.stringify(statusMessage),
        1,  // QoS 1
        true // Retained message
      );
    }
  }
  
  // Try to parse a message as a FridgeSession
  private tryParseAsSession(message: MqttMessage): void {
    try {
      const data = JSON.parse(message.message);
      
      // Check if the message follows FridgeSession structure
      if (
        data.sessionId && 
        data.timestamp && 
        Array.isArray(data.items) && 
        typeof data.status === 'string'
      ) {
        const session: FridgeSession = data;
        this.notifySessionListeners(session);
      }
    } catch (error) {
      // Not a valid session, just ignore
      console.log('Message is not a valid session');
    }
  }

  // Schedule a reconnection attempt
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    const delay = 5000; // 5 seconds
    console.log(`Scheduling reconnection attempt in ${delay/1000} seconds...`);
    
    this.reconnectTimeout = setTimeout(() => {
      if (!this.isConnectedState && !this.connecting) {
        console.log('Attempting to reconnect to MQTT...');
        this.connect();
      }
    }, delay);
  }
  
  // Notify all subscribers of a new message
  private notifySubscribers(message: MqttMessage): void {
    this.subscribers.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error('Error in message subscriber callback:', error);
      }
    });
  }
  
  // Notify session listeners of a new session
  private notifySessionListeners(session: FridgeSession): void {
    this.sessionListeners.forEach(callback => {
      try {
        callback(session);
      } catch (error) {
        console.error('Error in session listener callback:', error);
      }
    });
  }
  
  // Update and notify about connection status changes
  private updateConnectionStatus(status: boolean): void {
    if (this.isConnectedState !== status) {
      this.isConnectedState = status;
      console.log(`MQTT connection status changed to: ${status ? 'connected' : 'disconnected'}`);
      
      this.connectionListeners.forEach(listener => {
        try {
          listener(status);
        } catch (error) {
          console.error('Error in connection listener callback:', error);
        }
      });
      
      // If we've just connected or disconnected, update app status
      if (status) {
        this.publishAppStatus('online');
      }
    }
  }
  
  // Update and notify about heartbeat info changes
  private updateHeartbeatInfo(info: HeartbeatInfo): void {
    const prevStatus = this.heartbeatInfo.raspberryPiStatus;
    this.heartbeatInfo = { ...info };
    
    // Log if status changed
    if (prevStatus !== info.raspberryPiStatus) {
      console.log(`Raspberry Pi status changed: ${prevStatus} -> ${info.raspberryPiStatus}`);
    }
    
    // Notify listeners
    this.heartbeatListeners.forEach(listener => {
      try {
        listener({ ...this.heartbeatInfo });
      } catch (error) {
        console.error('Error in heartbeat listener callback:', error);
      }
    });
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
        console.log(`Loaded ${this.messages.length} stored MQTT messages`);
      }
    } catch (error) {
      console.error('Error loading MQTT messages:', error);
    }
  }
}

// Export singleton instance
export const mqttService = new MqttService();