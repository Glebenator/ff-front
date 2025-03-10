// components/mqtt/MqttViewer.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Switch,
  RefreshControl,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mqttService, MqttMessage } from '@/services/mqtt/mqttService';
import { theme } from '@/styles/theme';
import { sharedStyles } from '@/styles/sharedStyles';

interface MqttViewerProps {
  initialBroker?: string;
  initialPort?: number;
  initialUsername?: string;
  initialPassword?: string;
  initialTopic?: string;
}

export default function MqttViewer({
  initialBroker = "192.168.50.14",
  initialPort = 1883,
  initialUsername = "coolcake",
  initialPassword = "coolcake2",
  initialTopic = "rpi/test"
}: MqttViewerProps) {
  // Connection parameters
  const [broker, setBroker] = useState(initialBroker);
  const [port, setPort] = useState(initialPort.toString());
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState(initialPassword);
  const [topic, setTopic] = useState(initialTopic);
  
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Messages state
  const [messages, setMessages] = useState<MqttMessage[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Refs
  const scrollViewRef = React.useRef<ScrollView>(null);

  // Configure MQTT service with initial values
  useEffect(() => {
    mqttService.configure({
      broker: initialBroker,
      port: initialPort,
      username: initialUsername,
      password: initialPassword,
      topic: initialTopic
    });
    
    // Subscribe to connection status changes
    const unsubscribe = mqttService.onConnectionChange(status => {
      setIsConnected(status);
      setIsConnecting(false);
    });
    
    return () => {
      unsubscribe();
      mqttService.disconnect();
    };
  }, [initialBroker, initialPort, initialUsername, initialPassword, initialTopic]);

  // Subscribe to MQTT messages
  useEffect(() => {
    const unsubscribe = mqttService.subscribe(message => {
      setMessages(prev => [...prev, message]);
      if (autoScroll) {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [autoScroll]);

  // Connect to MQTT broker
  const connect = useCallback(async () => {
    try {
      // Validate inputs
      if (!broker.trim()) {
        Alert.alert('Error', 'Please enter a broker address');
        return;
      }
      
      const portNum = parseInt(port);
      if (isNaN(portNum) || portNum <= 0 || portNum > 65535) {
        Alert.alert('Error', 'Please enter a valid port number (1-65535)');
        return;
      }
      
      if (!topic.trim()) {
        Alert.alert('Error', 'Please enter a topic to subscribe to');
        return;
      }
      
      // Update configuration
      mqttService.configure({
        broker,
        port: portNum,
        username,
        password,
        topic
      });
      
      setIsConnecting(true);
      await mqttService.connect();
    } catch (error) {
      console.error('Failed to connect:', error);
      Alert.alert('Connection Error', 'Failed to connect to MQTT broker. Please check your settings and try again.');
      setIsConnecting(false);
    }
  }, [broker, port, username, password, topic]);

  // Disconnect from MQTT broker
  const disconnect = useCallback(() => {
    mqttService.disconnect();
  }, []);

  // Clear message history
  const clearMessages = useCallback(() => {
    mqttService.clearMessages();
    setMessages([]);
  }, []);

  // Refresh messages
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setMessages(mqttService.getMessages());
    setRefreshing(false);
  }, []);

  // Format message for display
  const formatMessage = (message: MqttMessage) => {
    try {
      // Try to parse JSON
      const jsonObj = JSON.parse(message.message);
      return JSON.stringify(jsonObj, null, 2);
    } catch (e) {
      // If not JSON, return as is
      return message.message;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header section */}
      <View style={styles.header}>
        <Text style={styles.title}>MQTT Viewer</Text>
        <View style={styles.headerButtons}>
          <Pressable
            style={styles.iconButton}
            onPress={() => setShowSettings(!showSettings)}
          >
            <Ionicons
              name="settings-outline"
              size={24}
              color={theme.colors.text.primary}
            />
          </Pressable>
          <Pressable
            style={styles.iconButton}
            onPress={clearMessages}
          >
            <Ionicons
              name="trash-outline"
              size={24}
              color={theme.colors.text.primary}
            />
          </Pressable>
        </View>
      </View>

      {/* Connection settings */}
      {showSettings && (
        <View style={styles.settingsContainer}>
          <View style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Broker:</Text>
            <TextInput
              style={styles.input}
              value={broker}
              onChangeText={setBroker}
              placeholder="MQTT Broker IP/Host"
              placeholderTextColor={theme.colors.text.secondary}
              editable={!isConnected}
            />
          </View>
          <View style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Port:</Text>
            <TextInput
              style={[styles.input, styles.shortInput]}
              value={port}
              onChangeText={setPort}
              placeholder="Port"
              placeholderTextColor={theme.colors.text.secondary}
              keyboardType="number-pad"
              editable={!isConnected}
            />
          </View>
          <View style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Username:</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              placeholderTextColor={theme.colors.text.secondary}
              editable={!isConnected}
            />
          </View>
          <View style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Password:</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={theme.colors.text.secondary}
              secureTextEntry
              editable={!isConnected}
            />
          </View>
          <View style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Topic:</Text>
            <TextInput
              style={styles.input}
              value={topic}
              onChangeText={setTopic}
              placeholder="MQTT Topic"
              placeholderTextColor={theme.colors.text.secondary}
              editable={!isConnected}
            />
          </View>
          <View style={styles.connectionRow}>
            {isConnected ? (
              <Pressable
                style={[styles.connectionButton, styles.disconnectButton]}
                onPress={disconnect}
              >
                <Text style={styles.connectionButtonText}>Disconnect</Text>
              </Pressable>
            ) : (
              <Pressable
                style={[styles.connectionButton, styles.connectButton]}
                onPress={connect}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.connectionButtonText}>Connect</Text>
                )}
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* Connection status */}
      <View style={[styles.statusBar, isConnected ? styles.statusConnected : styles.statusDisconnected]}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>
          {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
        </Text>
        <View style={styles.autoScrollToggle}>
          <Text style={styles.autoScrollText}>Auto-scroll</Text>
          <Switch
            value={autoScroll}
            onValueChange={setAutoScroll}
            trackColor={{ false: theme.colors.background.secondary, true: theme.colors.primary }}
            thumbColor={theme.colors.background.primary}
          />
        </View>
      </View>

      {/* Messages list */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-outline" size={48} color={theme.colors.text.secondary} />
            <Text style={styles.emptyStateText}>No messages yet</Text>
            {!isConnected && (
              <Text style={styles.emptyStateSubtext}>Connect to the MQTT broker to start receiving messages</Text>
            )}
          </View>
        ) : (
          messages.map((message, index) => (
            <View key={message.id} style={styles.messageCard}>
              <View style={styles.messageHeader}>
                <Text style={styles.messageTopic}>{message.topic}</Text>
                <Text style={styles.messageTime}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </Text>
              </View>
              <View style={styles.messageBody}>
                <Text style={styles.messageContent}>{formatMessage(message)}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  iconButton: {
    padding: theme.spacing.sm,
  },
  settingsContainer: {
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  settingsLabel: {
    width: 90,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.text.primary,
    fontSize: theme.fontSize.md,
  },
  shortInput: {
    maxWidth: 100,
  },
  connectionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
  },
  connectionButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    minWidth: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectButton: {
    backgroundColor: theme.colors.primary,
  },
  disconnectButton: {
    backgroundColor: theme.colors.status.error,
  },
  connectionButtonText: {
    color: theme.colors.background.primary,
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  statusConnected: {
    backgroundColor: 'rgba(0, 128, 0, 0.2)',
  },
  statusDisconnected: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
    marginRight: theme.spacing.sm,
  },
  statusText: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSize.md,
  },
  autoScrollToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  autoScrollText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSize.sm,
    marginRight: theme.spacing.sm,
  },
  messagesContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    marginTop: 100,
  },
  emptyStateText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
  emptyStateSubtext: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  messageCard: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
    margin: theme.spacing.sm,
    overflow: 'hidden',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.sm,
  },
  messageTopic: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
  messageTime: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSize.sm,
  },
  messageBody: {
    padding: theme.spacing.md,
  },
  messageContent: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSize.sm,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});