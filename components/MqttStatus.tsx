// components/MqttStatus.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useMqtt } from '@/hooks/useMqtt';
import { Ionicons } from '@expo/vector-icons';

interface MqttStatusProps {
  showControls?: boolean;
}

/**
 * Component to display MQTT and Raspberry Pi connection status
 */
export const MqttStatus: React.FC<MqttStatusProps> = ({ showControls = false }) => {
  const { 
    isConnected, 
    isConnecting, 
    connect, 
    disconnect, 
    reconnect,
    raspberryPiStatus,
    lastHeartbeat
  } = useMqtt();
  
  const [lastSeen, setLastSeen] = useState<string>('');
  
  // Format last heartbeat time
  useEffect(() => {
    if (lastHeartbeat > 0) {
      const updateLastSeen = () => {
        const now = Date.now();
        const diff = now - lastHeartbeat;
        
        if (diff < 60000) {
          setLastSeen(`${Math.floor(diff / 1000)}s ago`);
        } else if (diff < 3600000) {
          setLastSeen(`${Math.floor(diff / 60000)}m ago`);
        } else {
          setLastSeen(`${Math.floor(diff / 3600000)}h ago`);
        }
      };
      
      updateLastSeen();
      const intervalId = setInterval(updateLastSeen, 5000);
      
      return () => clearInterval(intervalId);
    } else {
      setLastSeen('Never');
    }
  }, [lastHeartbeat]);
  
  // Get status colors
  const getMqttStatusColor = () => {
    if (isConnecting) return '#FFD700'; // Yellow for connecting
    return isConnected ? '#4CAF50' : '#F44336'; // Green for connected, red for disconnected
  };
  
  const getRpiStatusColor = () => {
    switch (raspberryPiStatus) {
      case 'online': return '#4CAF50'; // Green
      case 'offline': return '#F44336'; // Red
      default: return '#9E9E9E'; // Gray for unknown
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        <View style={styles.statusItem}>
          <View style={[styles.statusDot, { backgroundColor: getMqttStatusColor() }]} />
          <Text style={styles.statusText}>
            MQTT: {isConnecting ? 'Connecting...' : (isConnected ? 'Connected' : 'Disconnected')}
          </Text>
        </View>
        
        <View style={styles.statusItem}>
          <View style={[styles.statusDot, { backgroundColor: getRpiStatusColor() }]} />
          <Text style={styles.statusText}>
            Raspberry Pi: {raspberryPiStatus}
            {raspberryPiStatus === 'online' && (
              <Text style={styles.lastSeenText}> • {lastSeen}</Text>
            )}
          </Text>
        </View>
      </View>
      
      {showControls && (
        <View style={styles.controls}>
          {isConnecting ? (
            <ActivityIndicator size="small" color="#2196F3" />
          ) : isConnected ? (
            <>
              <TouchableOpacity 
                style={[styles.button, styles.disconnectButton]}
                onPress={disconnect}
              >
                <Ionicons name="power" size={16} color="white" />
                <Text style={styles.buttonText}>Disconnect</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={[styles.button, styles.connectButton]}
              onPress={connect}
            >
              <Ionicons name="refresh" size={16} color="white" />
              <Text style={styles.buttonText}>Connect</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 16,
  },
  statusContainer: {
    marginBottom: 8,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#333333',
  },
  lastSeenText: {
    fontSize: 12,
    color: '#757575',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  connectButton: {
    backgroundColor: '#2196F3',
  },
  disconnectButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
  },
});
