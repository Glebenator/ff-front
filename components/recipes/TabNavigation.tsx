import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
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
        title="Suggested" 
        active={activeTab === 'suggested'} 
        onPress={() => onChangeTab('suggested')} 
      />
      <TabButton 
        title="Favorites" 
        active={activeTab === 'favorites'} 
        onPress={() => onChangeTab('favorites')} 
      />
      <TabButton 
        title="Recent" 
        active={activeTab === 'recent'} 
        onPress={() => onChangeTab('recent')} 
      />
    </View>
  );
}

interface TabButtonProps {
  title: string;
  active: boolean;
  onPress: () => void;
}

function TabButton({ title, active, onPress }: TabButtonProps) {
  return (
    <Pressable 
      style={({ pressed }) => [
        styles.tabButton,
        active && styles.activeTab,
        pressed && styles.pressedTab
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.tabText,
        active && styles.activeTabText
      ]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    margin: theme.spacing.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  pressedTab: {
    opacity: 0.8,
  },
  tabText: {
    fontSize: theme.fontSize.md,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  activeTabText: {
    color: theme.colors.background.primary,
    fontWeight: '600',
  },
});
