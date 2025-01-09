// Root layout: The app/_layout.tsx file. It defines shared UI elements such as headers and tab bars so they are consistent between different routes.

import { Stack } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

export default function RootLayout() {
  return (
    <>
      <StatusBar hidden/>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}