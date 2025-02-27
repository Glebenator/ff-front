// components/SessionNotification.tsx
import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { theme } from '@/styles/theme';
import { useSessions } from '@/hooks/useSessions';

const NOTIFICATION_DURATION = 3000; // 3 seconds

export default function SessionNotification() {
  const { 
    pendingSessions, 
    hasPendingSessions, 
    dismissNotification 
  } = useSessions();

  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (hasPendingSessions) {
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Set timeout for auto-dismiss
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          dismissNotification();
        });
      }, NOTIFICATION_DURATION);

      return () => clearTimeout(timer);
    }
  }, [hasPendingSessions, fadeAnim]);

  if (!hasPendingSessions || Platform.OS === 'web') return null;

  const handlePress = () => {
    dismissNotification();
    router.push('/sessions');
  };

  return (
    <Animated.View style={[styles.notification, { opacity: fadeAnim }]}>
      <Pressable
        style={styles.content}
        onPress={handlePress}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="scan" size={24} color={theme.colors.background.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>New Items Detected</Text>
          <Text style={styles.subtitle}>
            {pendingSessions.length} pending session{pendingSessions.length > 1 ? 's' : ''} to review
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={theme.colors.background.primary}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  notification: {
    position: 'absolute',
    bottom: 90, // Above tab bar
    left: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.background.primary,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.background.primary,
    opacity: 0.9,
  },
});