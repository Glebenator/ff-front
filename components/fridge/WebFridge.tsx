import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';
import { sharedStyles } from '@/styles/sharedStyles';
import { StyleSheet } from 'react-native';

export const WebFridge = () => (
  <View style={sharedStyles.container}>
    <View style={sharedStyles.emptyState}>
      <Ionicons 
        name="phone-portrait-outline" 
        size={theme.fontSize.hero} 
        color={theme.colors.primary}
      />
      <Text style={sharedStyles.emptyStateTitle}>
        Mobile Only Feature
      </Text>
      <Text style={sharedStyles.emptyStateText}>
        The Fridge Friend app is currently available only on mobile devices.
        Please use our mobile app to access all features.
      </Text>
      <View style={styles.bulletPoints}>
        <Text style={styles.bulletPoint}>• Track your ingredients</Text>
        <Text style={styles.bulletPoint}>• Get expiry notifications</Text>
        <Text style={styles.bulletPoint}>• Manage your fridge efficiently</Text>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  bulletPoints: {
    alignItems: 'flex-start',
    marginTop: theme.spacing.md,
  },
  bulletPoint: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    marginVertical: theme.spacing.xs,
  },
});