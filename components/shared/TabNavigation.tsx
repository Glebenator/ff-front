import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  badge?: number;
}

export interface SharedTabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onChangeTab: (tabId: string) => void;
  variant?: 'pillow' | 'compact' | 'full-width';
  scrollable?: boolean;
}

export default function SharedTabNavigation({ 
  tabs, 
  activeTab, 
  onChangeTab,
  variant = 'compact',
  scrollable = false
}: SharedTabNavigationProps) {
  const containerStyle = getContainerStyle(variant);
  const tabStyle = getTabStyle(variant);

  const TabContent = () => (
    <>
      {tabs.map((tab) => (
        <TabButton 
          key={tab.id}
          tab={tab}
          active={activeTab === tab.id} 
          onPress={() => onChangeTab(tab.id)}
          variant={variant}
          style={tabStyle}
        />
      ))}
    </>
  );

  return (
    <View style={[styles.container, containerStyle]}>
      {scrollable ? (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <TabContent />
        </ScrollView>
      ) : (
        <View style={styles.tabRow}>
          <TabContent />
        </View>
      )}
    </View>
  );
}

interface TabButtonProps {
  tab: Tab;
  active: boolean;
  onPress: () => void;
  variant: 'pillow' | 'compact' | 'full-width';
  style: any;
}

function TabButton({ tab, active, onPress, variant, style }: TabButtonProps) {
  const hasIcon = !!tab.icon;
  const hasBadge = tab.badge && tab.badge > 0;

  return (
    <Pressable 
      style={({ pressed }) => [
        style.base,
        active && style.active,
        pressed && styles.pressed
      ]}
      onPress={onPress}
    >
      <View style={styles.tabContent}>
        {hasIcon && (
          <Ionicons 
            name={tab.icon!} 
            size={variant === 'compact' ? 16 : 18} 
            color={active ? theme.colors.background.primary : theme.colors.text.primary} 
          />
        )}
        <Text style={[
          styles.tabText,
          variant === 'compact' && styles.compactText,
          active && styles.activeTabText
        ]}>
          {tab.label}
        </Text>
        {hasBadge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {tab.badge! > 99 ? '99+' : tab.badge}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function getContainerStyle(variant: 'pillow' | 'compact' | 'full-width') {
  switch (variant) {
    case 'pillow':
      return styles.pillowContainer;
    case 'compact':
      return styles.compactContainer;
    case 'full-width':
      return styles.fullWidthContainer;
    default:
      return styles.compactContainer;
  }
}

function getTabStyle(variant: 'pillow' | 'compact' | 'full-width') {
  switch (variant) {
    case 'pillow':
      return {
        base: styles.pillowTab,
        active: styles.pillowTabActive
      };
    case 'compact':
      return {
        base: styles.compactTab,
        active: styles.compactTabActive
      };
    case 'full-width':
      return {
        base: styles.fullWidthTab,
        active: styles.fullWidthTabActive
      };
    default:
      return {
        base: styles.compactTab,
        active: styles.compactTabActive
      };
  }
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
  },
  tabRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  scrollContent: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  
  // Container styles
  pillowContainer: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
  },
  compactContainer: {
    backgroundColor: 'transparent',
  },
  fullWidthContainer: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xs,
  },

  // Tab button styles
  pillowTab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillowTabActive: {
    backgroundColor: theme.colors.primary,
  },
  
  compactTab: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  compactTabActive: {
    backgroundColor: theme.colors.primary,
  },

  fullWidthTab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidthTabActive: {
    backgroundColor: theme.colors.primary,
  },

  // Common styles
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    position: 'relative',
  },
  tabText: {
    fontSize: theme.fontSize.md,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  compactText: {
    fontSize: theme.fontSize.sm,
  },
  activeTabText: {
    color: theme.colors.background.primary,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.8,
  },
  
  // Badge styles
  badge: {
    position: 'absolute',
    right: -8,
    top: -8,
    backgroundColor: theme.colors.status.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});
