// components/mqtt/MqttSettingsPanel.tsx
// Component for MQTT connection settings

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  Pressable, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mqttService } from '@/services/mqtt/mqttService';
import { theme } from '@/styles/theme';

interface MqttSettingsPanelProps {
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  onClearMessages: () => void;
  initialBroker?: string;
  initialPort?: number;
  initialUsername?: string;
  initialPassword?: string;
  initialTopic?: string;
}

export default function MqttSettingsPanel({
  showSettings,
  setShowSettings,
  onClearMessages,
  initialBroker = '',
  initialPort = 1883,
  initialUsername = '',
  initialPassword = '',
  initialTopic = 'rpi/test'
}: MqttSettingsPanelProps) {
  // State for form fields
  const [broker, setBroker] = useState(initialBroker);
  const [port, setPort] = useState(initialPort.toString());
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState(initialPassword);
  const [topic, setTopic] = useState(initialTopic);
  
  // Connection state
  const [isConnected, setIsConnected] = useState(mqttService.isConnected());
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Subscribe to connection status changes
  useEffect(() => {
    const unsubscribe = mqttService.onConnectionChange((status) => {
      setIsConnected(status);
      setIsConnecting(false);
    });
    
    return unsubscribe;
  }, []);
  
  // Set initial values 
  useEffect(() => {
    setBroker(initialBroker);
    setPort(initialPort.toString());
    setUsername(initialUsername);
    setPassword(initialPassword);
    setTopic(initialTopic);
  }, [initialBroker, initialPort, initialUsername, initialPassword, initialTopic]);
  
  // Handle form submission and connect
  const handleConnect = async () => {
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
      Alert.alert(
        'Connection Error', 
        'Failed to connect to MQTT broker. Please check your settings and try again.'
      );
      setIsConnecting(false);
    }
  };
  
  // Handle disconnect
  const handleDisconnect = () => {
    mqttService.disconnect();
  };
  
  return (
    <View>
      {/* Header */}
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
            onPress={onClearMessages}
          >
            <Ionicons
              name="trash-outline"
              size={24}
              color={theme.colors.text.primary}
            />
          </Pressable>
        </View>
      </View>
      
      {/* Settings Form */}
      {showSettings && (
        <View style={styles.settingsContainer}>
          {/* Broker */}
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
          
          {/* Port */}
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
          
          {/* Username */}
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
          
          {/* Password */}
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
          
          {/* Topic */}
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
          
          {/* Connect/Disconnect Button */}
          <View style={styles.connectionRow}>
            {isConnected ? (
              <Pressable
                style={[styles.connectionButton, styles.disconnectButton]}
                onPress={handleDisconnect}
              >
                <Text style={styles.connectionButtonText}>Disconnect</Text>
              </Pressable>
            ) : (
              <Pressable
                style={[styles.connectionButton, styles.connectButton]}
                onPress={handleConnect}
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
    </View>
  );
}

const styles = StyleSheet.create({
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
});