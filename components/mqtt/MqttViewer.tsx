// components/mqtt/MqttViewer.tsx
// Main MQTT viewer component that combines all MQTT UI components

import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { mqttService } from '@/services/mqtt/mqttService';
import MqttSettingsPanel from './MqttSettingsPanel';
import ConnectionStatus from './ConnectionStatus';
import MqttMessageList from './MqttMessageList';
import { theme } from '@/styles/theme';

interface MqttViewerProps {
  initialBroker?: string;
  initialPort?: number;
  initialUsername?: string;
  initialPassword?: string;
  initialTopic?: string;
}

export default function MqttViewer({
  initialBroker = "192.168.50.14",
  initialPort = 9001,
  initialUsername = "coolcake",
  initialPassword = "coolcake2",
  initialTopic = "rpi/test"
}: MqttViewerProps) {
  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  
  // Configure MQTT service with initial values
  useEffect(() => {
    mqttService.configure({
      broker: initialBroker,
      port: initialPort,
      username: initialUsername,
      password: initialPassword,
      topic: initialTopic
    });
    
    // Clean up on unmount
    return () => {
      mqttService.disconnect();
    };
  }, [initialBroker, initialPort, initialUsername, initialPassword, initialTopic]);

  return (
    <View style={styles.container}>
      {/* Settings Panel */}
      <MqttSettingsPanel 
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        onClearMessages={() => mqttService.clearMessages()}
        initialBroker={initialBroker}
        initialPort={initialPort}
        initialUsername={initialUsername}
        initialPassword={initialPassword}
        initialTopic={initialTopic}
      />
      
      {/* Connection Status */}
      <ConnectionStatus 
        autoScroll={autoScroll}
        setAutoScroll={setAutoScroll}
      />
      
      {/* Message List */}
      <MqttMessageList 
        autoScroll={autoScroll}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
});