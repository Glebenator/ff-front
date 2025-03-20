// app/(tabs)/mqtt.tsx
// MQTT tab screen in the application

import React from 'react';
import { View, StyleSheet } from 'react-native';
import MqttViewer from '@/components/mqtt/MqttViewer';
import { theme } from '@/styles/theme';

export default function MqttScreen() {
  return (
    <View style={styles.container}>
      <MqttViewer
        initialBroker="192.168.50.14"
        initialPort={9001}
        initialUsername="coolcake"
        initialPassword="coolcake2"
        initialTopic="rpi/test"
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