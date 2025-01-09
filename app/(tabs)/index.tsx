import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ingredientDb } from '@/services/database/ingredientDb';
import { theme } from '@/styles/theme';

const WebLanding = () => {
  return (
    <View style={styles.webContainer}>
      <View style={styles.heroSection}>
        <Ionicons 
          name="restaurant" 
          size={theme.fontSize.hero} 
          color={theme.colors.primary}
          style={styles.heroIcon}
        />
        <Text style={styles.heroTitle}>Welcome to Fridge Friend</Text>
        <Text style={styles.heroSubtitle}>
          Your smart kitchen companion for tracking ingredients and reducing food waste
        </Text>
      </View>

      <View style={styles.featuresSection}>
        <View style={styles.featureCard}>
          <Ionicons name="time-outline" size={theme.fontSize.xxxl} color={theme.colors.primary} />
          <Text style={styles.featureTitle}>Track Expiry Dates</Text>
          <Text style={styles.featureText}>
            Never waste food again with smart expiry date tracking
          </Text>
        </View>

        <View style={styles.featureCard}>
          <Ionicons name="notifications-outline" size={theme.fontSize.xxxl} color={theme.colors.primary} />
          <Text style={styles.featureTitle}>Get Reminders</Text>
          <Text style={styles.featureText}>
            Receive alerts when ingredients are about to expire
          </Text>
        </View>

        <View style={styles.featureCard}>
          <Ionicons name="list-outline" size={theme.fontSize.xxxl} color={theme.colors.primary} />
          <Text style={styles.featureTitle}>Organize Items</Text>
          <Text style={styles.featureText}>
            Keep your ingredients organized by categories
          </Text>
        </View>
      </View>

      <View style={styles.downloadSection}>
        <Text style={styles.downloadTitle}>Get Started Today</Text>
        <Text style={styles.downloadText}>
          Download Fridge Friend on your mobile device to start tracking your ingredients
        </Text>
        <View style={styles.storeButtons}>
          <Pressable style={styles.storeButton}>
            <Ionicons name="logo-apple" size={theme.fontSize.xl} color={theme.colors.text.primary} />
            <Text style={styles.storeButtonText}>App Store</Text>
          </Pressable>
          <Pressable style={styles.storeButton}>
            <Ionicons name="logo-google-playstore" size={theme.fontSize.xl} color={theme.colors.text.primary} />
            <Text style={styles.storeButtonText}>Play Store</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

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
          <Ionicons name="add-circle" size={theme.fontSize.xxxl} color={theme.colors.primary} />
          <Text style={styles.mainActionText}>Add New Item</Text>
        </View>
        <Ionicons name="chevron-forward" size={theme.fontSize.xl} color={theme.colors.text.secondary} />
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
    backgroundColor: theme.colors.background.primary,
    padding: theme.spacing.xl,
  },
  mobileContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    padding: theme.spacing.md,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl * 2,
  },
  heroIcon: {
    marginBottom: theme.spacing.xl,
  },
  heroTitle: {
    fontSize: theme.fontSize.hero,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  heroSubtitle: {
    fontSize: theme.fontSize.xl,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    maxWidth: 600,
  },
  featuresSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.xl,
    marginBottom: theme.spacing.xl * 2,
    flexWrap: 'wrap',
  },
  featureCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xl,
    alignItems: 'center',
    width: '30%',
    minWidth: 280,
  },
  featureTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  featureText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  downloadSection: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  downloadTitle: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  downloadText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  storeButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  storeButton: {
    backgroundColor: theme.colors.background.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    minWidth: 160,
    justifyContent: 'center',
  },
  storeButtonText: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
  mainAction: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  mainActionText: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  statusCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xl,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  statusTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  statusCount: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statusSubtext: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  viewAll: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: '500',
  },
});