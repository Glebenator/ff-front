// Root layout: The app/_layout.tsx file. It defines shared UI elements such as headers and tab bars so they are consistent between different routes.

import { Stack } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useTheme } from '@/styles/theme';

export default function RootLayout() {
  const theme = useTheme();
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
    </>
  );
}