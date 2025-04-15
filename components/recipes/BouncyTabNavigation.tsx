import React, { useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { theme } from '@/styles/theme';

type TabType = 'suggested' | 'favorites' | 'recent';

interface BouncyTabNavigationProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export default function BouncyTabNavigation({ activeTab, onChangeTab }: BouncyTabNavigationProps) {
  // Animation values for each tab
  const suggestedScale = useRef(new Animated.Value(activeTab === 'suggested' ? 1.1 : 1)).current;
  const favoritesScale = useRef(new Animated.Value(activeTab === 'favorites' ? 1.1 : 1)).current;
  const recentScale = useRef(new Animated.Value(activeTab === 'recent' ? 1.1 : 1)).current;
  
  const getScaleValue = (tab: TabType) => {
    switch (tab) {
      case 'suggested': return suggestedScale;
      case 'favorites': return favoritesScale;
      case 'recent': return recentScale;
    }
  };
  
  const animateTab = (tab: TabType) => {
    // Reset all tabs
    [suggestedScale, favoritesScale, recentScale].forEach(scale => {
      Animated.timing(scale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      }).start();
    });
    
    // Animate the selected tab
    const selectedScale = getScaleValue(tab);
    
    // Bounce animation sequence
    Animated.sequence([
      Animated.timing(selectedScale, {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: true
      }),
      Animated.spring(selectedScale, {
        toValue: 1.1,
        friction: 5,
        tension: 40,
        useNativeDriver: true
      })
    ]).start();
    
    // Call the actual tab change function
    onChangeTab(tab);
  };
  
  const renderTab = (tab: TabType, label: string) => {
    const isActive = activeTab === tab;
    const scaleValue = getScaleValue(tab);
    
    return (
      <Pressable
        style={styles.tabButton}
        onPress={() => animateTab(tab)}
      >
        <Animated.View 
          style={[
            styles.tabContent,
            isActive && styles.activeTabContent,
            { transform: [{ scale: scaleValue }] }
          ]}
        >
          <Text style={[
            styles.tabText,
            isActive && styles.activeTabText
          ]}>
            {label}
          </Text>
        </Animated.View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        {renderTab('suggested', 'Suggested')}
        {renderTab('favorites', 'Favorites')}
        {renderTab('recent', 'Recent')}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border.primary,
    paddingVertical: theme.spacing.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
  },
  tabContent: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background.secondary,
    minWidth: 100,
    alignItems: 'center',
  },
  activeTabContent: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  tabText: {
    fontSize: theme.fontSize.md,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  activeTabText: {
    color: 'white',
    fontWeight: '600',
  },
});