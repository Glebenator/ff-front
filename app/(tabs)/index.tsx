import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ingredientDb } from '@/services/database/ingredientDb';

const WebLanding = () => (
  <View style={styles.webContainer}>
    {/* Hero Section */}
    <View style={styles.heroSection}>
      <Ionicons 
        name="restaurant" 
        size={64} 
        color="rgb(99, 207, 139)"
        style={styles.heroIcon}
      />
      <Text style={styles.heroTitle}>Welcome to Fridge Friend</Text>
      <Text style={styles.heroSubtitle}>
        Your smart kitchen companion for tracking ingredients and reducing food waste
      </Text>
    </View>

    {/* Features Section */}
    <View style={styles.featuresSection}>
      <View style={styles.featureCard}>
        <Ionicons name="time-outline" size={32} color="rgb(99, 207, 139)" />
        <Text style={styles.featureTitle}>Track Expiry Dates</Text>
        <Text style={styles.featureText}>
          Never waste food again with smart expiry date tracking
        </Text>
      </View>

      <View style={styles.featureCard}>
        <Ionicons name="notifications-outline" size={32} color="rgb(99, 207, 139)" />
        <Text style={styles.featureTitle}>Get Reminders</Text>
        <Text style={styles.featureText}>
          Receive alerts when ingredients are about to expire
        </Text>
      </View>

      <View style={styles.featureCard}>
        <Ionicons name="list-outline" size={32} color="rgb(99, 207, 139)" />
        <Text style={styles.featureTitle}>Organize Items</Text>
        <Text style={styles.featureText}>
          Keep your ingredients organized by categories
        </Text>
      </View>
    </View>

    {/* Download Section */}
    <View style={styles.downloadSection}>
      <Text style={styles.downloadTitle}>Get Started Today</Text>
      <Text style={styles.downloadText}>
        Download Fridge Friend on your mobile device to start tracking your ingredients
      </Text>
      <View style={styles.storeButtons}>
        <Pressable style={styles.storeButton}>
          <Ionicons name="logo-apple" size={24} color="rgb(247, 233, 233)" />
          <Text style={styles.storeButtonText}>App Store</Text>
        </Pressable>
        <Pressable style={styles.storeButton}>
          <Ionicons name="logo-google-playstore" size={24} color="rgb(247, 233, 233)" />
          <Text style={styles.storeButtonText}>Play Store</Text>
        </Pressable>
      </View>
    </View>
  </View>
);

const MobileHome = () => {
  const [expiringCount, setExpiringCount] = useState(0);

  useEffect(() => {
    try {
      const expiringItems = ingredientDb.getExpiringSoon(3);
      setExpiringCount(expiringItems.length);
    } catch (error) {
      console.error('Error loading expiring items:', error);
    }
  }, []);

  return (
    <View style={styles.mobileContainer}>
      <Pressable 
        style={styles.mainAction}
        onPress={() => router.push('/add-ingredient')}
      >
        <View style={styles.actionContent}>
          <Ionicons name="add-circle" size={32} color="rgb(99, 207, 139)" />
          <Text style={styles.mainActionText}>Add New Item</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="rgb(180, 180, 180)" />
      </Pressable>

      <Pressable 
        style={styles.statusCard}
        onPress={() => router.push('/fridge')}
      >
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>Items Expiring Soon</Text>
          <Text style={styles.statusCount}>{expiringCount}</Text>
        </View>
        <Text style={styles.statusSubtext}>
          {expiringCount === 0 
            ? "You're all good! No items expiring soon." 
            : `${expiringCount} ${expiringCount === 1 ? 'item needs' : 'items need'} attention`}
        </Text>
        <Text style={styles.viewAll}>View all items →</Text>
      </Pressable>
    </View>
  );
};

export default function HomeScreen() {
  return Platform.OS === 'web' ? <WebLanding /> : <MobileHome />;
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    backgroundColor: 'rgb(36, 32, 28)',
    padding: 40,
  },
  mobileContainer: {
    flex: 1,
    backgroundColor: 'rgb(36, 32, 28)',
    padding: 16,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  heroIcon: {
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'rgb(247, 233, 233)',
    textAlign: 'center',
    marginBottom: 16,
  },
  heroSubtitle: {
    fontSize: 20,
    color: 'rgb(180, 180, 180)',
    textAlign: 'center',
    maxWidth: 600,
  },
  featuresSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 60,
    flexWrap: 'wrap',
  },
  featureCard: {
    backgroundColor: 'rgb(48, 44, 40)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '30%',
    minWidth: 280,
  },
  featureTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: 'rgb(247, 233, 233)',
    marginTop: 16,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 16,
    color: 'rgb(180, 180, 180)',
    textAlign: 'center',
  },
  downloadSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  downloadTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'rgb(247, 233, 233)',
    marginBottom: 16,
  },
  downloadText: {
    fontSize: 18,
    color: 'rgb(180, 180, 180)',
    marginBottom: 24,
    textAlign: 'center',
  },
  storeButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  storeButton: {
    backgroundColor: 'rgb(48, 44, 40)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    minWidth: 160,
    justifyContent: 'center',
  },
  storeButtonText: {
    color: 'rgb(247, 233, 233)',
    fontSize: 16,
    fontWeight: '600',
  },
  mainAction: {
    backgroundColor: 'rgb(48, 44, 40)',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mainActionText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgb(247, 233, 233)',
  },
  statusCard: {
    backgroundColor: 'rgb(48, 44, 40)',
    borderRadius: 16,
    padding: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgb(247, 233, 233)',
  },
  statusCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'rgb(99, 207, 139)',
  },
  statusSubtext: {
    fontSize: 16,
    color: 'rgb(180, 180, 180)',
    marginBottom: 12,
  },
  viewAll: {
    fontSize: 16,
    color: 'rgb(99, 207, 139)',
    fontWeight: '500',
  },
});