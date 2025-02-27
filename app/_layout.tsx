// Root layout: The app/_layout.tsx file. It defines shared UI elements such as headers and tab bars so they are consistent between different routes.

import { Stack } from "expo-router";
import { Platform } from 'react-native';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/styles/theme';
import { NotificationService } from '@/services/notifications/notificationService';
import SessionNotification from "@/components/sessions/SessionNotification";
import Toast from "@/components/Toast";

export default function RootLayout() {
  const theme = useTheme();
  useEffect(() => {
    if (Platform.OS !== 'web') {
      setupNotifications();
    }
  }, []);

  const setupNotifications = async () => {
    await NotificationService.requestPermissions();
  };
  return (
    <>
      <StatusBar hidden />
      <Stack
        screenOptions={{
          contentStyle: {
            backgroundColor: theme.colors.background.primary,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="ingredient" options={{ headerShown: true }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <SessionNotification />
      <Toast />
    </>
  );
}