// hooks/useMqtt.ts
import { useEffect, useState, useCallback, useRef } from 'react';
import { mqttService, MqttMessage, FridgeSession } from '@/services/mqtt/mqttService';

interface UseMqttOptions {
  autoConnect?: boolean;
  subscribeToHeartbeat?: boolean;
  subscribeToSessions?: boolean;
}

interface UseMqttResult {
  // Connection state
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  reconnect: () => void;
  
  // Messages
  messages: MqttMessage[];
  clearMessages: () => void;
  
  // Publishing
  publish: (topic: string, message: string, qos?: 0 | 1 | 2, retained?: boolean) => void;
  
  // Raspberry Pi status
  raspberryPiStatus: 'online' | 'offline' | 'unknown';
  lastHeartbeat: number;
  
  // Fridge sessions
  fridgeSessions: FridgeSession[];
  
  // Loading state
  isConnecting: boolean;
}

/**
 * React hook for interacting with the MQTT service
 * 
 * @param options Configuration options for the hook
 * @returns Object with MQTT state and functions
 */
export function useMqtt(options: UseMqttOptions = {}): UseMqttResult {
  // Default options
  const {
    autoConnect = true, 
    subscribeToHeartbeat = true,
    subscribeToSessions = true
  } = options;
  
  // State
  const [isConnected, setIsConnected] = useState(mqttService.isConnected());
  const [isConnecting, setIsConnecting] = useState(false);
  const [messages, setMessages] = useState<MqttMessage[]>(mqttService.getMessages());
  const [raspberryPiStatus, setRaspberryPiStatus] = useState<'online' | 'offline' | 'unknown'>(
    mqttService.getRaspberryPiStatus()
  );
  const [lastHeartbeat, setLastHeartbeat] = useState<number>(
    mqttService.getHeartbeatInfo().lastHeartbeat
  );
  const [fridgeSessions, setFridgeSessions] = useState<FridgeSession[]>([]);
  
  // Refs for unsubscribe functions
  const unsubscribersRef = useRef<Array<() => void>>([]);
  
  // Connect to MQTT broker
  const connect = useCallback(async () => {
    if (isConnected || isConnecting) return;
    
    setIsConnecting(true);
    try {
      await mqttService.connect();
    } catch (error) {
      console.error('Error connecting to MQTT:', error);
    } finally {
      setIsConnecting(false);
    }
  }, [isConnected, isConnecting]);
  
  // Disconnect from MQTT broker
  const disconnect = useCallback(() => {
    mqttService.disconnect();
  }, []);
  
  // Reconnect to MQTT broker
  const reconnect = useCallback(() => {
    mqttService.reconnect();
  }, []);
  
  // Publish a message
  const publish = useCallback((topic: string, message: string, qos?: 0 | 1 | 2, retained?: boolean) => {
    mqttService.publish(topic, message, qos, retained);
  }, []);
  
  // Clear message history
  const clearMessages = useCallback(() => {
    mqttService.clearMessages();
    setMessages([]);
  }, []);
  
  // Setup subscriptions
  useEffect(() => {
    const unsubscribers: Array<() => void> = [];
    
    // Subscribe to connection changes
    unsubscribers.push(
      mqttService.onConnectionChange((status) => {
        setIsConnected(status);
        if (!status) {
          setIsConnecting(false);
        }
      })
    );
    
    // Subscribe to MQTT messages
    unsubscribers.push(
      mqttService.subscribe((message) => {
        setMessages((prev) => [...prev, message]);
      })
    );
    
    // Subscribe to heartbeat if enabled
    if (subscribeToHeartbeat) {
      unsubscribers.push(
        mqttService.subscribeToHeartbeat((info) => {
          setRaspberryPiStatus(info.raspberryPiStatus);
          setLastHeartbeat(info.lastHeartbeat);
        })
      );
    }
    
    // Subscribe to sessions if enabled
    if (subscribeToSessions) {
      unsubscribers.push(
        mqttService.subscribeToSessions((session) => {
          setFridgeSessions((prev) => {
            // Update if exists, otherwise add
            const sessionExists = prev.some(s => s.sessionId === session.sessionId);
            
            if (sessionExists) {
              return prev.map(s => 
                s.sessionId === session.sessionId ? session : s
              );
            } else {
              return [...prev, session];
            }
          });
        })
      );
    }
    
    // Store unsubscribers
    unsubscribersRef.current = unsubscribers;
    
    // Auto connect if enabled
    if (autoConnect && !mqttService.isConnected()) {
      connect();
    }
    
    // Cleanup subscriptions on unmount
    return () => {
      unsubscribersRef.current.forEach(unsubscribe => unsubscribe());
    };
  }, [autoConnect, connect, subscribeToHeartbeat, subscribeToSessions]);
  
  return {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    reconnect,
    messages,
    clearMessages,
    publish,
    raspberryPiStatus,
    lastHeartbeat,
    fridgeSessions
  };
}
