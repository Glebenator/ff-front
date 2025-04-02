// services/mqtt/mqttService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import Paho from 'paho-mqtt';
import * as Device from 'expo-device';
import { toastStore } from '../toastStore'; // [cite: code folder/services/toastStore.ts] Import toastStore if needed later

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

  private reconnectAttempts: number = 0;
  private readonly INITIAL_RECONNECT_DELAY = 5000; // 5 seconds
  private readonly MAX_RECONNECT_DELAY = 300000; // 5 minutes

  // Connection parameters (ensure these are appropriate or loaded from config)
  private config: MqttConfig = {
    broker: '192.168.50.14', // Example IP, replace if needed
    port: 9001, // Default WebSocket MQTT port
    username: 'coolcake', // Example username
    password: 'coolcake2', // Example password
    topic: 'rpi/test' // Example topic
  };

  private clientId: string = '';
  private CLIENT_ID_STORAGE_KEY = 'mqtt_client_id';
  private HEARTBEAT_TIMEOUT = 60000; // 60 seconds timeout for heartbeat

  // --- State variable to track initial connection success ---
  private initialConnectionSucceeded: boolean = false;

  constructor() {
    this.loadMessages();
    this.loadClientId();
    // Optionally, trigger the first connection attempt here or let the UI do it
    // this.connect();
  }

  // Load or generate a consistent clientId
  private async loadClientId() {
    try {
      let storedId = await AsyncStorage.getItem(this.CLIENT_ID_STORAGE_KEY);

      if (!storedId) {
        // Generate a new client ID based on device info
        const deviceName = Device.deviceName || 'unknown_device';
        // Ensure client ID format is acceptable (Paho might have restrictions)
        storedId = `expo_${deviceName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Math.random().toString(16).substr(2, 8)}`;
        await AsyncStorage.setItem(this.CLIENT_ID_STORAGE_KEY, storedId);
        console.log(`Generated and stored new MQTT client ID: ${storedId}`);
      } else {
        console.log(`Loaded existing MQTT client ID: ${storedId}`);
      }

      this.clientId = storedId;
    } catch (error) {
      console.error('Error loading/generating client ID:', error);
      // Fallback to a random ID if loading fails - less ideal for persistent sessions
      this.clientId = `expo_fallback_${Math.random().toString(16).substr(2, 8)}`;
    }
  }

  // Configure the MQTT connection (e.g., from settings)
  public configure(config: MqttConfig): void {
    const needsReconnect = this.config.broker !== config.broker || this.config.port !== config.port;
    this.config = { ...config };
    console.log('MQTT configuration updated.');
    if (needsReconnect && this.isConnectedState) {
        console.log('Configuration changed, disconnecting to apply new settings...');
        this.disconnect();
        // Consider automatically reconnecting after a short delay
        // setTimeout(() => this.connect(), 1000);
    } else if (needsReconnect && !this.isConnectedState && !this.connecting) {
        // If not connected, try connecting with new config immediately
        this.connect();
    }
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
    // Prevent multiple concurrent connection attempts
    if (this.connecting) {
        console.log("MQTT connect skipped: Already connecting.");
        return;
    }
    if (this.client && this.isConnectedState) {
        console.log("MQTT connect skipped: Already connected.");
        return;
    }

    if (!this.config.broker || !this.config.topic) {
        console.error('MQTT broker and topic must be configured before connecting');
        return; // Avoid connection attempt if config is missing
    }

    this.connecting = true;
    console.log(`Connecting to MQTT broker ${this.config.broker}:${this.config.port}...`);

    try {
        // Ensure we have a client ID before connecting
        if (!this.clientId) {
            await this.loadClientId();
        }

        // Paho MQTT JS requires WebSocket URI for browser/React Native
        // The path often needs to be specified, commonly "/mqtt" or "/ws"
        this.client = new Paho.Client(
            this.config.broker,
            this.config.port,
            "/mqtt", // Standard WebSocket path for MQTT, adjust if your broker uses a different one
            this.clientId
        );

        // Set callback handlers BEFORE connecting
        this.client.onConnectionLost = this.handleConnectionLost;
        this.client.onMessageArrived = this.handleMessageArrived;

        const connectOptions: Paho.ConnectionOptions = {
            useSSL: false, // Set to true if using WSS on a secure port (e.g., 8884)
            userName: this.config.username,
            password: this.config.password,
            onSuccess: this.handleConnect,
            onFailure: this.handleConnectFailure,
            reconnect: true, // Enable Paho's built-in reconnect mechanism
            keepAliveInterval: 30, // Send keep-alive packets every 30 seconds
            cleanSession: false, // Set to false for persistent sessions (broker must support)
            invocationContext: { service: this }, // Pass context if needed in callbacks
            // timeout: 10 // Connection attempt timeout in seconds (optional)
        };

        console.log('Attempting MQTT connection with Paho...');
        this.client.connect(connectOptions);
    } catch (error: any) {
        console.error('MQTT connection initiation error:', error.message || error);
        this.connecting = false;
        // Update status internally but avoid broad notification if initial failed
        this.updateConnectionStatus(false);
        this.scheduleReconnect(); // Still schedule a retry
    }
  }

  // Manually trigger a reconnection attempt
  public reconnect(): void {
    if (!this.isConnectedState && !this.connecting) {
      console.log('Manually triggering reconnection to MQTT...');
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      this.connect(); // Use connect to handle flags properly
    } else {
        console.log(`MQTT reconnect skipped: ${this.isConnectedState ? 'Already connected' : 'Already connecting'}.`)
    }
  }

  // Disconnect from the MQTT broker
  public disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
      console.log('Cleared pending reconnect timeout.');
    }

    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }

    if (this.client && this.client.isConnected()) { // Use Paho's isConnected() check
      try {
        console.log('Disconnecting MQTT client...');
        // Publish offline status before disconnecting if possible
        if (this.initialConnectionSucceeded) {
            this.publishAppStatus('offline');
        }
        this.client.disconnect();
        // Note: onConnectionLost might be called automatically by Paho after disconnect()
        console.log('MQTT disconnect initiated.');
      } catch (error) {
        console.error('Error during MQTT disconnect:', error);
      }
      // Let onConnectionLost handle state updates
    } else {
        console.log('MQTT disconnect skipped: Client not connected.');
        // Ensure state is correct if disconnect called while not connected
        if (this.isConnectedState || this.connecting) {
            this.updateConnectionStatus(false);
            this.connecting = false;
             this.updateHeartbeatInfo({
                lastHeartbeat: this.heartbeatInfo.lastHeartbeat,
                raspberryPiStatus: 'unknown'
            });
        }
    }
    this.client = null; // Clear client reference
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
        // console.log(`Published to ${topic}: ${message.substring(0,50)}...`); // Less verbose logging
      } catch (error: any) {
        console.error(`Error publishing MQTT message to ${topic}:`, error.message || error);
        // Handle potential disconnect on publish error
        if (error.errorCode === Paho.MQTT_ERROR_CODES.CLIENT_NOT_CONNECTED) {
             this.handleConnectionLost({errorCode: error.errorCode, errorMessage: "Publish failed: Client not connected"});
        }
      }
    } else {
      console.warn(`Cannot publish to ${topic}: MQTT client not connected.`);
    }
  }

  // Subscribe to receive messages (general purpose)
  public subscribe(callback: (message: MqttMessage) => void): () => void {
    this.subscribers.push(callback);

    // Optionally send recent messages to new subscriber?
    // this.messages.slice(-10).forEach(message => callback(message));

    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  // Subscribe to connection status changes
  public onConnectionChange(callback: (status: boolean) => void): () => void {
    this.connectionListeners.push(callback);
    callback(this.isConnectedState); // Immediately provide current status

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
    callback({ ...this.heartbeatInfo }); // Provide current status immediately

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
    console.log('Cleared stored MQTT messages.');
  }

  // --- MODIFIED: Handle successful connection ---
  private handleConnect = () => {
    console.log('MQTT Connected!');
    this.connecting = false;
    this.initialConnectionSucceeded = true; // Mark initial connection success
    this.reconnectAttempts = 0; // Reset attempts on successful connection
    this.updateConnectionStatus(true); // Notify listeners

    // Clear any pending reconnect timeout upon successful connection
    if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
    }

    // Subscribe to topics after connection
    if (this.client && this.config.topic) {
      const mainTopic = this.config.topic;
      const heartbeatTopic = `${this.config.topic}/heartbeat`;
      const appStatusTopic = `${this.config.topic}/app_status`; // For publishing only

      // Subscribe to main topic (for sessions etc.)
      this.client.subscribe(mainTopic, {
        qos: 1, // Use QoS 1 for reliable message delivery
        onSuccess: () => console.log(`Subscribed to ${mainTopic} (QoS 1)`),
        onFailure: (error) => console.error(`Failed to subscribe to ${mainTopic}:`, error.errorMessage)
      });

      // Subscribe to heartbeat topic
      this.client.subscribe(heartbeatTopic, {
        qos: 1, // QoS 1 for heartbeat too
        onSuccess: () => console.log(`Subscribed to ${heartbeatTopic}`),
        onFailure: (error) => console.error(`Failed to subscribe to ${heartbeatTopic}:`, error.errorMessage)
      });

      this.startHeartbeatTimeout(); // Start monitoring Pi heartbeat
      this.publishAppStatus('online'); // Announce app is online
    }
  };

  // --- MODIFIED: Handle connection failure ---
  private handleConnectFailure = (error: { errorCode: number, errorMessage: string }) => {
    // Check if already handled disconnect/failure
    if (this.connecting === false && this.isConnectedState === false) return;

    // console.error(`MQTT connection failed: ${error.errorMessage} (Code: ${error.errorCode})`);
    this.connecting = false;

    // updateConnectionStatus handles initial failure case silently
    this.updateConnectionStatus(false);

    // Optional: Show error only after initial success
    // if (this.initialConnectionSucceeded) {
    //   toastStore.error('MQTT connection failed. Retrying...');
    // }

    this.scheduleReconnect(); // Always schedule a retry

    this.updateHeartbeatInfo({
      lastHeartbeat: this.heartbeatInfo.lastHeartbeat,
      raspberryPiStatus: 'unknown' // Assume unknown if connection fails
    });
  };

  // --- MODIFIED: Handle connection lost ---
  private handleConnectionLost = (responseObject: { errorCode: number, errorMessage: string }) => {
     // Check if already handled disconnect/failure
    if (this.connecting === false && this.isConnectedState === false) return;

    const wasConnected = this.isConnectedState; // Check status *before* updating
    if (responseObject.errorCode !== 0) {
      console.log(`MQTT connection lost: ${responseObject.errorMessage}`);
      // Optional: Show warning only if we were previously connected
      // if (this.initialConnectionSucceeded && wasConnected) {
      //    toastStore.warning('MQTT connection lost. Reconnecting...');
      // }
    } else {
      // Error code 0 usually means a clean disconnect initiated by client.disconnect()
      console.log('MQTT connection closed normally.');
    }

    this.updateConnectionStatus(false); // updateConnectionStatus handles initial state
    this.connecting = false;
    this.scheduleReconnect(); // Schedule reconnect attempt

    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }

    this.updateHeartbeatInfo({
      lastHeartbeat: this.heartbeatInfo.lastHeartbeat,
      raspberryPiStatus: 'unknown' // Assume unknown if disconnected
    });
  };

  // Handle incoming messages
  private handleMessageArrived = (mqttMessage: Paho.Message) => {
    try {
      const topic = mqttMessage.destinationName;
      const messageStr = mqttMessage.payloadString;

      // Ignore empty messages
      if (!messageStr) return;

      const message: MqttMessage = {
        topic,
        message: messageStr,
        timestamp: Date.now(),
        id: `${Date.now()}-${Math.random().toString(16).substr(2, 8)}`, // More unique ID
      };

      // Handle specific topics
      if (topic === `${this.config.topic}/heartbeat`) {
        this.handleHeartbeat(messageStr);
        return; // Don't process heartbeat as general message
      }

      // Log general messages concisely
      // console.log(`MQTT on ${topic}: ${messageStr.substring(0, 80)}${messageStr.length > 80 ? '...' : ''}`);

      this.addMessage(message); // Add to history
      this.notifySubscribers(message); // Notify general listeners
      this.tryParseAsSession(message); // Check if it's a session message

    } catch (error) {
      console.error('Error processing MQTT message:', error);
    }
  };

  // Handle heartbeat messages
  private handleHeartbeat(messageStr: string): void {
    try {
      const data = JSON.parse(messageStr);
      const timestamp = data.timestamp || Date.now(); // Use Pi's timestamp if available

      // Update heartbeat info - mark as online
      this.updateHeartbeatInfo({
        lastHeartbeat: timestamp,
        raspberryPiStatus: 'online'
      });

      this.startHeartbeatTimeout(); // Reset the timeout since we got a heartbeat

      // console.log(`Received Pi heartbeat at ${new Date(timestamp).toLocaleTimeString()}`); // Less verbose
    } catch (error) {
      console.error('Error processing heartbeat message:', error);
    }
  }

  // Start or reset the heartbeat timeout
  private startHeartbeatTimeout(): void {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
    }

    this.heartbeatTimeout = setTimeout(() => {
      console.warn('Heartbeat timeout reached. Assuming Raspberry Pi is offline.');
      // Update status to offline if timeout expires
      this.updateHeartbeatInfo({
        lastHeartbeat: this.heartbeatInfo.lastHeartbeat, // Keep last known heartbeat time
        raspberryPiStatus: 'offline'
      });
    }, this.HEARTBEAT_TIMEOUT);
  }

  // Publish app status (online/offline) as a retained message
  private publishAppStatus(status: 'online' | 'offline'): void {
    if (this.client && this.isConnectedState && this.config.topic) {
      const statusTopic = `${this.config.topic}/app_status`;
      const statusMessage = JSON.stringify({
        clientId: this.clientId,
        status: status,
        timestamp: Date.now(),
        deviceName: Device.deviceName || 'unknown_app_device'
      });

      this.publish(statusTopic, statusMessage, 1, true); // QoS 1, Retained = true
      // console.log(`Published app status '${status}' to ${statusTopic}`);
    }
  }

  // Try to parse a message as a FridgeSession
  private tryParseAsSession(message: MqttMessage): void {
    // Assume sessions arrive on the main configured topic
    if (message.topic !== this.config.topic) return;

    try {
      const data = JSON.parse(message.message);
      // Basic validation for FridgeSession structure
      if (data.sessionId && data.timestamp && Array.isArray(data.items)) {
        // More thorough validation could be added here
        const session: FridgeSession = {
            sessionId: data.sessionId,
            timestamp: data.timestamp,
            items: data.items,
            status: data.status || 'pending' // Default status if missing
        };
        console.log(`Received Fridge Session: ${session.sessionId}`);
        this.notifySessionListeners(session);
      }
    } catch (error) {
      // It's not JSON or not a session, ignore silently
    }
  }

  // --- MODIFIED: Schedule a reconnection attempt ---
  private scheduleReconnect(): void {
    // Don't schedule if already connecting or connected
    if (this.connecting || this.isConnectedState) {
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      return;
    }
    // Don't schedule if already scheduled
    if (this.reconnectTimeout) {
      return;
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.INITIAL_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts),
      this.MAX_RECONNECT_DELAY
    );
    console.log(`Scheduling MQTT reconnection attempt ${this.reconnectAttempts + 1} in ${delay / 1000} seconds...`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      if (!this.isConnectedState && !this.connecting) {
        this.reconnectAttempts++;
        console.log(`Attempting scheduled MQTT reconnect (attempt ${this.reconnectAttempts})...`);
        this.connect();
      } else {
        console.log('Reconnect cancelled, state changed before execution.');
      }
    }, delay);
  }

  // Notify all general message subscribers
  private notifySubscribers(message: MqttMessage): void {
    // Use slice to prevent issues if a subscriber modifies the array
    [...this.subscribers].forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error('Error in message subscriber callback:', error);
      }
    });
  }

  // Notify session listeners
  private notifySessionListeners(session: FridgeSession): void {
     [...this.sessionListeners].forEach(callback => {
      try {
        callback(session);
      } catch (error) {
        console.error('Error in session listener callback:', error);
      }
    });
  }

  // --- MODIFIED: Update and notify about connection status changes ---
  private updateConnectionStatus(status: boolean): void {
    // Only proceed if the status is actually changing
    if (this.isConnectedState === status) {
      return;
    }

    // *** GRACEFUL HANDLING LOGIC for initial connection failure ***
    if (!status && !this.initialConnectionSucceeded) {
      console.log('MQTT disconnected before initial success. Updating status silently.');
      this.isConnectedState = false;
      // Do NOT notify listeners broadly in this specific case
      return; // Exit early
    }
    // *** END GRACEFUL HANDLING LOGIC ***

    // If status is changing (and it's not the initial silent failure), update and notify.
    const previousStatus = this.isConnectedState;
    this.isConnectedState = status;
    console.log(`MQTT connection status changed: ${previousStatus} -> ${status}`);

    // Notify all connection listeners
     [...this.connectionListeners].forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in connection listener callback:', error);
      }
    });

    // Update app online/offline status topic (consider only publishing offline if previously online)
    if (status) {
      this.publishAppStatus('online');
    } else if (previousStatus === true) { // Only publish offline if we were connected
       this.publishAppStatus('offline');
    }
  }

  // Update and notify about heartbeat info changes
  private updateHeartbeatInfo(info: HeartbeatInfo): void {
    const prevStatus = this.heartbeatInfo.raspberryPiStatus;
    // Prevent unnecessary updates if nothing changed
    if (this.heartbeatInfo.lastHeartbeat === info.lastHeartbeat && prevStatus === info.raspberryPiStatus) {
        return;
    }

    this.heartbeatInfo = { ...info };

    if (prevStatus !== info.raspberryPiStatus) {
      console.log(`Raspberry Pi status changed: ${prevStatus} -> ${info.raspberryPiStatus}`);
    }

    // Notify listeners
     [...this.heartbeatListeners].forEach(listener => {
      try {
        // Send a copy to prevent mutation
        listener({ ...this.heartbeatInfo });
      } catch (error) {
        console.error('Error in heartbeat listener callback:', error);
      }
    });
  }

  // Add a message to the history and save
  private addMessage(message: MqttMessage): void {
    this.messages.push(message);
    // Trim history if it exceeds max size
    if (this.messages.length > this.maxStoredMessages) {
      this.messages = this.messages.slice(-this.maxStoredMessages);
    }
    this.saveMessagesDebounced(); // Use debounced save
  }

  // --- Debounced Save Logic ---
  private saveTimeout: NodeJS.Timeout | null = null;
  private saveMessagesDebounced(): void {
      if (this.saveTimeout) {
          clearTimeout(this.saveTimeout);
      }
      this.saveTimeout = setTimeout(() => {
          this.saveMessages();
          this.saveTimeout = null;
      }, 1000); // Save at most once per second
  }

  // Save messages to AsyncStorage
  private async saveMessages(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.messages));
      // console.log('Saved MQTT messages to storage.'); // Less verbose
    } catch (error) {
      console.error('Error saving MQTT messages:', error);
    }
  }

  // Load messages from AsyncStorage on startup
  private async loadMessages(): Promise<void> {
    try {
      const storedMessages = await AsyncStorage.getItem(this.storageKey);
      if (storedMessages) {
        this.messages = JSON.parse(storedMessages);
        console.log(`Loaded ${this.messages.length} stored MQTT messages.`);
        // Ensure messages array doesn't exceed max size after loading
        if (this.messages.length > this.maxStoredMessages) {
           this.messages = this.messages.slice(-this.maxStoredMessages);
        }
      }
    } catch (error) {
      console.error('Error loading MQTT messages:', error);
      this.messages = []; // Start with empty if loading fails
    }
  }
}

// Export a singleton instance for use throughout the app
export const mqttService = new MqttService();