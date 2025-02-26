import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ingredientDb } from '@/services/database/ingredientDb';
import { theme } from '@/styles/theme';
import { sharedStyles } from '@/styles/sharedStyles';
import { 
  ExpiryStatus, 
  StatusInfoType, 
  StatusCardProps, 
  QuickActionButtonProps 
} from '@/types/types';

export const MobileHome: React.FC = () => {
  const [status, setStatus] = useState<ExpiryStatus>({
    expiringSoon: 0,
    expired: 0,
    total: 0
  });

  const loadExpiryStatus = useCallback((): void => {
    try {
      const expiringItems = ingredientDb.getExpiringSoon(3);
      const allItems = ingredientDb.getAll();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

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
      loadExpiryStatus();
    }, [loadExpiryStatus])
  );

  return (
    <View style={[sharedStyles.container, styles.mobileContainer]}>
      {status.expiringSoon + status.expired > 0 ? (
        <StatusCard status={status} />
      ) : (
        <WellMaintainedCard />
      )}
      <RecipeIdeas />
      <QuickActions />
    </View>
  );
};

const StatusCard: React.FC<StatusCardProps> = ({ status }) => {
  const getStatusInfo = (): StatusInfoType => {
    if (status.expired > 0) {
      return {
        color: theme.colors.status.error,
        count: status.expired,
        message: `${status.expired} expired item${status.expired > 1 ? 's' : ''} need attention`
      };
    }
    if (status.expiringSoon > 0) {
      return {
        color: theme.colors.status.warning,
        count: status.expiringSoon,
        message: `${status.expiringSoon} item${status.expiringSoon > 1 ? 's' : ''} expiring soon`
      };
    }
    return {
      color: theme.colors.primary,
      count: 0,
      message: "No items need attention"
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <Pressable 
      style={[styles.card, { borderLeftWidth: 4, borderLeftColor: statusInfo.color }]}
      onPress={() => router.push('/fridge?initialFilter=all')}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Items Needing Attention</Text>
        <Text style={[styles.statusCount, { color: statusInfo.color }]}>{statusInfo.count}</Text>
      </View>
      <Text style={styles.cardText}>{statusInfo.message}</Text>
      <Text style={styles.viewAllLink}>View all {status.total} items →</Text>
    </Pressable>
  );
};

const WellMaintainedCard: React.FC = () => (
  <View style={[styles.card, styles.smallCard]}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardTitle}>Great job!</Text>
      <Ionicons name="checkmark-circle" size={28} color={theme.colors.primary} />
    </View>
    <Text style={styles.cardText}>All your items are tracked and up to date</Text>
  </View>
);

const RecipeIdeas: React.FC = () => (
  <View style={styles.card}>
    <View style={styles.recipeHeader}>
      <View style={styles.recipeTitleContainer}>
        <Ionicons name="restaurant" size={24} color={theme.colors.primary} />
        <Text style={styles.cardTitle}>Recipe Ideas</Text>
      </View>
      <Text style={styles.viewAllText}>View All</Text>
    </View>
    <Text style={styles.recipeSubtitle}>Quick Recipes with Your Ingredients</Text>
    <Text style={styles.recipeCount}>3 possible</Text>
    <Text style={styles.recipeTime}>
      <Ionicons name="time-outline" size={16} color={theme.colors.text.secondary} />
      {' '}15-30 min recipes you can make now
    </Text>
    <View style={styles.recipeTags}>
      <Text style={styles.recipeTag}>Pasta</Text>
      <Text style={styles.recipeTag}>Salad</Text>
      <Text style={styles.recipeTag}>+1 more</Text>
    </View>
  </View>
);

const QuickActions: React.FC = () => (
  <View style={styles.quickActionsSection}>
    <Text style={styles.sectionTitle}>Quick Actions</Text>
    <View style={styles.quickActionsGrid}>
      <QuickActionButton 
        icon="time-outline"
        text="Expiring Soon"
        color={theme.colors.primary}
        onPress={() => router.push('/fridge?initialFilter=expiring-soon')}
      />
      <QuickActionButton 
        icon="alert-outline"
        text="Expired Items"
        color={theme.colors.status.error}
        onPress={() => router.push('/fridge?initialFilter=expired')}
      />
    </View>
    <Pressable 
      style={styles.addNewButton}
      onPress={() => router.push('/ingredient')}
    >
      <Ionicons name="add-circle" size={24} color={theme.colors.primary} />
      <Text style={styles.addNewButtonText}>Add New Item</Text>
    </Pressable>
  </View>
);

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ 
  icon, 
  text, 
  color, 
  onPress 
}) => (
  <Pressable 
    style={styles.quickActionButton}
    onPress={onPress}
  >
    <Ionicons name={icon} size={24} color={color} />
    <Text style={styles.quickActionText}>{text}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  mobileContainer: {
    padding: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  smallCard: {
    paddingVertical: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  cardTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  cardText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  statusCount: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
  },
  viewAllLink: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    marginTop: theme.spacing.sm,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  recipeTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  viewAllText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.md,
    fontWeight: '500',
  },
  recipeSubtitle: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  recipeCount: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  recipeTime: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  recipeTags: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  recipeTag: {
    backgroundColor: theme.colors.background.secondary,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    color: theme.colors.text.primary,
    fontSize: theme.fontSize.md,
  },
  quickActionsSection: {
    gap: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  quickActionText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  addNewButton: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  addNewButtonText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text.primary,
  },
});