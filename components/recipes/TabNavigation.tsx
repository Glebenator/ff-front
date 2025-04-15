import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '@/styles/theme';
import { sharedStyles } from '@/styles/sharedStyles';

type TabType = 'suggested' | 'favorites' | 'recent';

interface TabNavigationProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export default function TabNavigation({ activeTab, onChangeTab }: TabNavigationProps) {
  return (
    <View style={styles.tabContainer}>
      <Pressable
        style={[sharedStyles.filterButton, activeTab === 'suggested' && sharedStyles.filterButtonActive]}
        onPress={() => onChangeTab('suggested')}
      >
        <Text style={[sharedStyles.filterButtonText, activeTab === 'suggested' && sharedStyles.filterButtonTextActive]}>
          Suggested
        </Text>
      </Pressable>
      <Pressable
        style={[sharedStyles.filterButton, activeTab === 'favorites' && sharedStyles.filterButtonActive]}
        onPress={() => onChangeTab('favorites')}
      >
        <Text style={[sharedStyles.filterButtonText, activeTab === 'favorites' && sharedStyles.filterButtonTextActive]}>
          Favorites
        </Text>
      </Pressable>
      <Pressable
        style={[sharedStyles.filterButton, activeTab === 'recent' && sharedStyles.filterButtonActive]}
        onPress={() => onChangeTab('recent')}
      >
        <Text style={[sharedStyles.filterButtonText, activeTab === 'recent' && sharedStyles.filterButtonTextActive]}>
          Recent
        </Text>
      </Pressable>
    </View>
  );
}



const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border.primary,
  },
});
