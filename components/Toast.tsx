// components/Toast.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';
import { toastStore } from '@/services/toastStore';

export default function Toast() {
  const [toast, setToast] = useState<null | { id: string; message: string; type: 'success' | 'error' | 'info' }>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    return toastStore.subscribe((newToast) => {
      if (newToast) {
        setToast(newToast);
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      } else {
        // Fade out
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => setToast(null));
      }
    });
  }, [fadeAnim]);

  if (!toast) return null;

  const getIconName = () => {
    switch (toast.type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'alert-circle';
      default:
        return 'information-circle';
    }
  };

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return theme.colors.status.success;
      case 'error':
        return theme.colors.status.error;
      default:
        return theme.colors.primary;
    }
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        { backgroundColor: getBackgroundColor() },
        { opacity: fadeAnim }
      ]}
    >
      <Ionicons 
        name={getIconName()} 
        size={24} 
        color="white" 
      />
      <Text style={styles.message}>{toast.message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90, // Above tab bar
    left: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  message: {
    color: 'white',
    fontSize: theme.fontSize.md,
    fontWeight: '500',
    flex: 1,
  },
});