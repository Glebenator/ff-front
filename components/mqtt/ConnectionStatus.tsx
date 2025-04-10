// components/mqtt/ConnectionStatus.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mqttService } from '@/services/mqtt/mqttService';
import { sessionManager } from '@/services/sessionManager';
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
  const [piStatus, setPiStatus] = useState<'online' | 'offline' | 'unknown'>(
    mqttService.getRaspberryPiStatus()
  );
  const [lastConnectionTime, setLastConnectionTime] = useState<Date | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Subscribe to connection status changes
  useEffect(() => {
    const unsubscribeMqtt = mqttService.onConnectionChange((status) => {
      setIsConnected(status);
      if (status) {
        setLastConnectionTime(new Date());
      }
      if (status) {
        setIsReconnecting(false);
      }
    });
    
    const unsubscribeHeartbeat = mqttService.subscribeToHeartbeat((info) => {
      setPiStatus(info.raspberryPiStatus);
    });
    
    return () => {
      unsubscribeMqtt();
      unsubscribeHeartbeat();
    };
  }, []);

  // Handle reconnect
  const handleReconnect = () => {
    setIsReconnecting(true);
    mqttService.reconnect();
    
    // Safety timeout in case reconnect doesn't trigger connection status change
    setTimeout(() => {
      setIsReconnecting(false);
    }, 10000);
  };

  // Get icon and color based on status
  const getStatusIcon = (status: 'online' | 'offline' | 'unknown'): {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    color: string;
  } => {
    switch (status) {
      case 'online':
        return { icon: 'checkmark-circle', color: theme.colors.status.success };
      case 'offline':
        return { icon: 'close-circle', color: theme.colors.status.error };
      default:
        return { icon: 'help-circle', color: theme.colors.text.secondary };
    }
  };
  
  const mqttStatusIcon = isConnected 
    ? { icon: 'wifi', color: theme.colors.status.success }
    : { icon: 'wifi-outline', color: theme.colors.status.error };
    
  const piStatusIcon = getStatusIcon(piStatus);

  return (
    <View style={[
      styles.statusBar,
      isConnected ? styles.statusConnected : styles.statusDisconnected
    ]}>
      <View style={styles.statusSection}>
        <View style={styles.statusRow}>
          <Ionicons
            name={mqttStatusIcon.icon}
            size={18}
            color={mqttStatusIcon.color}
            style={styles.statusIcon}
          />
          <Text style={styles.statusText}>
            MQTT: {isConnected ? 'Connected' : 'Disconnected'}
          </Text>
          
          {!isConnected && (
            <Pressable
              onPress={handleReconnect}
              style={styles.reconnectButton}
              disabled={isReconnecting}
            >
              {isReconnecting ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Text style={styles.reconnectText}>Reconnect</Text>
              )}
            </Pressable>
          )}
        </View>
        
        <View style={styles.statusRow}>
          <Ionicons
            name={piStatusIcon.icon}
            size={18}
            color={piStatusIcon.color}
            style={styles.statusIcon}
          />
          <Text style={styles.statusText}>
            Pi: {piStatus.charAt(0).toUpperCase() + piStatus.slice(1)}
          </Text>
        </View>
      </View>
      
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
    justifyContent: 'space-between',
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
  statusSection: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusIcon: {
    marginRight: theme.spacing.sm,
  },
  statusText: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSize.sm,
  },
  reconnectButton: {
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.md,
    minWidth: 80,
    alignItems: 'center',
  },
  reconnectText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
  },
  autoScrollToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  autoScrollText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSize.sm,
    marginRight: theme.spacing.sm,
  },
});