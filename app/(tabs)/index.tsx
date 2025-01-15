import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ingredientDb } from '@/services/database/ingredientDb';
import { theme } from '@/styles/theme';

type ExpiryStatus = {
  expiringSoon: number;
  expired: number;
  total: number;
};

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
  const [status, setStatus] = useState<ExpiryStatus>({
    expiringSoon: 0,
    expired: 0,
    total: 0
  });

  const loadExpiryStatus = useCallback(() => {
    if (Platform.OS === 'web') return;

    try {
      // Get items expiring soon (within next 3 days)
      const expiringItems = ingredientDb.getExpiringSoon(3);
      
      // Get all items
      const allItems = ingredientDb.getAll();
      
      // Get current date with time set to start of day
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Filter for expired items
      const expiredItems = allItems.filter(item => {
        const expiryDate = new Date(item.expiryDate);
        expiryDate.setHours(0, 0, 0, 0);
        return expiryDate < today;
      });

      setStatus({
        expiringSoon: expiringItems.length,
        expired: expiredItems.length,
        total: allItems.length
      });
    } catch (error) {
      console.error('Error loading expiry status:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'web') return;

      console.log('Home screen focused, loading expiry status...');
      loadExpiryStatus();
    }, [loadExpiryStatus])
  );

  const getStatusMessage = () => {
    const totalAlert = status.expiringSoon + status.expired;
    
    if (totalAlert === 0) {
      return "You're all good! No items need attention.";
    }
    
    const parts = [];
    if (status.expired > 0) {
      parts.push(`${status.expired} expired`);
    }
    if (status.expiringSoon > 0) {
      parts.push(`${status.expiringSoon} expiring soon`);
    }
    
    return `${parts.join(' and ')} ${totalAlert === 1 ? 'item needs' : 'items need'} attention`;
  };

  return (
    <View style={styles.mobileContainer}>
      {(status.expiringSoon + status.expired > 0) && (
        <Pressable 
          style={styles.statusCard}
          onPress={() => router.push('/fridge?initialFilter=all')}
        >
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Items Needing Attention</Text>
            <Text style={styles.statusCount}>{status.expiringSoon + status.expired}</Text>
          </View>
          <Text style={styles.statusSubtext}>{getStatusMessage()}</Text>
          {status.total > 0 && (
            <Text style={styles.viewAll}>View all {status.total} items →</Text>
          )}
        </Pressable>
      )}

      <View style={styles.quickActions}>
        <Text style={styles.quickActionsTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <Pressable 
            style={styles.quickActionButton}
            onPress={() => router.push('/fridge?initialFilter=expiring-soon')}
          >
            <Ionicons name="time-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.quickActionText}>Expiring Soon</Text>
          </Pressable>
          
          <Pressable 
            style={styles.quickActionButton}
            onPress={() => router.push('/fridge?initialFilter=expired')}
          >
            <Ionicons name="alert-outline" size={24} color={theme.colors.status.error} />
            <Text style={styles.quickActionText}>Expired Items</Text>
          </Pressable>
        </View>

        <Pressable 
          style={styles.addNewButton}
          onPress={() => router.push('/add-ingredient')}
        >
          <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.quickActionText}>Add New Item</Text>
        </Pressable>
      </View>
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
  statusCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.md,
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
  quickActions: {
    marginTop: theme.spacing.md,
  },
  quickActionsTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  addNewButton: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  quickActionText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
});