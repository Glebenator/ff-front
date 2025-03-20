// components/mqtt/ConnectionStatus.tsx
// Component to display MQTT connection status

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { mqttService } from '@/services/mqtt/mqttService';
import { theme } from '@/styles/theme';

interface ConnectionStatusProps {
  autoScroll: boolean;
  setAutoScroll: (value: boolean) => void;
}

export default function ConnectionStatus({
  autoScroll,
  setAutoScroll
}: ConnectionStatusProps) {
  const [isConnected, setIsConnected] = useState(mqttService.isConnected());

  // Subscribe to connection status changes
  useEffect(() => {
    const unsubscribe = mqttService.onConnectionChange((status) => {
      setIsConnected(status);
    });
    
    return unsubscribe;
  }, []);

  return (
    <View style={[
      styles.statusBar,
      isConnected ? styles.statusConnected : styles.statusDisconnected
    ]}>
      <View style={[
        styles.statusDot,
        { backgroundColor: isConnected ? theme.colors.status.success : theme.colors.status.error }
      ]} />
      
      <Text style={styles.statusText}>
        {isConnected ? 'Connected' : 'Disconnected'}
      </Text>
      
      <View style={styles.autoScrollToggle}>
        <Text style={styles.autoScrollText}>Auto-scroll</Text>
        <Switch
          value={autoScroll}
          onValueChange={setAutoScroll}
          trackColor={{ 
            false: theme.colors.background.secondary, 
            true: theme.colors.primary 
          }}
          thumbColor={theme.colors.background.primary}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  statusConnected: {
    backgroundColor: 'rgba(99, 207, 139, 0.1)',
  },
  statusDisconnected: {
    backgroundColor: 'rgba(180, 32, 32, 0.1)',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
});