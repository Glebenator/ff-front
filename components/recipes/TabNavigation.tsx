import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';

type TabType = 'suggested' | 'favorites' | 'recent';

interface TabNavigationProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export default function TabNavigation({ activeTab, onChangeTab }: TabNavigationProps) {
  return (
    <View style={styles.tabContainer}>
      <TabButton 
        label="Suggested" 
        icon="bulb-outline"
        isActive={activeTab === 'suggested'}
        onPress={() => onChangeTab('suggested')}
      />
      <TabButton 
        label="Favorites" 
        icon="heart-outline"
        isActive={activeTab === 'favorites'}
        onPress={() => onChangeTab('favorites')}
      />
      <TabButton 
        label="Recent" 
        icon="time-outline"
        isActive={activeTab === 'recent'}
        onPress={() => onChangeTab('recent')}
      />
    </View>
  );
}

interface TabButtonProps {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  isActive: boolean;
  onPress: () => void;
}

const TabButton = ({ label, icon, isActive, onPress }: TabButtonProps) => (
  <Pressable 
    style={[styles.tabButton, isActive && styles.tabButtonActive]}
    onPress={onPress}
  >
    <Ionicons 
      name={icon} 
      size={18} 
      color={isActive ? theme.colors.primary : theme.colors.text.secondary} 
    />
    <Text style={[
      styles.tabButtonText,
      isActive && styles.tabButtonTextActive
    ]}>
      {label}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: theme.colors.border.primary,
    height: 45,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  tabButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  tabButtonTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});
