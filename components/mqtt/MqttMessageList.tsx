// components/mqtt/MqttMessageList.tsx
// Component for displaying MQTT messages

import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mqttService, MqttMessage } from '@/services/mqtt/mqttService';
import { theme } from '@/styles/theme';

interface MqttMessageListProps {
  autoScroll: boolean;
}

export default function MqttMessageList({
  autoScroll
}: MqttMessageListProps) {
  const [messages, setMessages] = useState<MqttMessage[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Subscribe to messages
  useEffect(() => {
    const unsubscribe = mqttService.subscribe((message) => {
      setMessages(prevMessages => [...prevMessages, message]);
      
      // Scroll to bottom if autoScroll is enabled
      if (autoScroll) {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    });
    
    return unsubscribe;
  }, [autoScroll]);
  
  // Get initial messages
  useEffect(() => {
    setMessages(mqttService.getMessages());
  }, []);
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    setMessages(mqttService.getMessages());
    setRefreshing(false);
  };
  
  // Format JSON message for better display
  const formatMessage = (message: string): string => {
    try {
      // Try to parse as JSON and format it
      const jsonObj = JSON.parse(message);
      return JSON.stringify(jsonObj, null, 2);
    } catch (e) {
      // If not JSON, return as is
      return message;
    }
  };
  
  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.messagesContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      {messages.length === 0 ? (
        // Empty state
        <View style={styles.emptyState}>
          <Ionicons 
            name="chatbubble-outline" 
            size={48} 
            color={theme.colors.text.secondary} 
          />
          <Text style={styles.emptyStateText}>No messages yet</Text>
          {!mqttService.isConnected() && (
            <Text style={styles.emptyStateSubtext}>
              Connect to the MQTT broker to start receiving messages
            </Text>
          )}
        </View>
      ) : (
        // Message list
        messages.map((message) => (
          <View key={message.id} style={styles.messageCard}>
            <View style={styles.messageHeader}>
              <Text style={styles.messageTopic}>{message.topic}</Text>
              <Text style={styles.messageTime}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </Text>
            </View>
            <View style={styles.messageBody}>
              <Text style={styles.messageContent}>
                {formatMessage(message.message)}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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