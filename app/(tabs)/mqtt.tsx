// app/(tabs)/mqtt.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '@/styles/theme';
import MqttViewer from '@/components/mqtt/MqttViewer';

export default function MqttScreen() {
  return (
    <View style={styles.container}>
      <MqttViewer
        initialBroker="192.168.50.14"
        initialPort={1883}
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