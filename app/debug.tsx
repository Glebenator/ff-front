import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import StorageViewer from '@/components/debug/StorageViewer';
import { theme } from '@/styles/theme';

export default function DebugScreen() {
  return (
    <>
      <Stack.Screen options={{ 
        title: "Debug Tools",
        headerStyle: {
          backgroundColor: theme.colors.background.secondary,
        },
        headerTintColor: theme.colors.text.primary,
      }} />
      
      <StorageViewer />
    </>
  );
}