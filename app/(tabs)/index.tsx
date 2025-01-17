import React from 'react';
import { Platform } from 'react-native';
import { WebLanding } from '@/components/WebLanding';
import { MobileHome } from '@/components/MobileHome';

export default function HomeScreen() {
  return Platform.OS === 'web' ? <WebLanding /> : <MobileHome />;
}