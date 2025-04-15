import React, { useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing, LayoutChangeEvent } from 'react-native';
import { theme } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';

type TabType = 'suggested' | 'favorites' | 'recent';

interface MaterialTabNavigationProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

// Define icon mapping for tabs
const tabIcons = {
  suggested: 'restaurant-outline',
  favorites: 'heart-outline',
  recent: 'time-outline',
};

export default function MaterialTabNavigation({ activeTab, onChangeTab }: MaterialTabNavigationProps) {
  // Animation related states
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const activeOpacity = useRef(new Animated.Value(1)).current;
  const [tabLayout, setTabLayout] = useState<{[key in TabType]?: { width: number, x: number }}>({});
  
  // Handle tab layout measurements
  const handleTabLayout = (tab: TabType) => (event: LayoutChangeEvent) => {
    const { width, x } = event.nativeEvent.layout;
    setTabLayout(prev => ({
      ...prev,
      [tab]: { width, x }
    }));
  };
  
  // Handle tab change with animation
  const handleTabChange = (tab: TabType) => {
    // First fade out
    Animated.timing(activeOpacity, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      // Change the tab
      onChangeTab(tab);
      
      // Then fade back in with reveal animation
      Animated.timing(activeOpacity, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    });
  };
  
  // Calculate indicator position and width based on active tab
  const indicatorStyle = {
    width: tabLayout[activeTab]?.width || 0,
    transform: [{ 
      translateX: tabLayout[activeTab]?.x || 0
    }],
    opacity: activeOpacity
  };

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[styles.indicator, indicatorStyle]} 
      />
      
      <View style={styles.tabContainer}>
        {(['suggested', 'favorites', 'recent'] as TabType[]).map((tab) => (
          <Pressable
            key={tab}
            style={styles.tab}
            onLayout={handleTabLayout(tab)}
            onPress={() => handleTabChange(tab)}
            android_ripple={{ color: 'rgba(0, 0, 0, 0.1)', borderless: false }}
          >
            <Ionicons
              name={tabIcons[tab] as any}
              size={20}
              color={activeTab === tab ? theme.colors.primary : theme.colors.text.secondary}
              style={styles.tabIcon}
            />
            
            <Text style={[
              styles.tabText,
              activeTab === tab && styles.activeTabText
            ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.primary,
    paddingTop: theme.spacing.sm,
    position: 'relative',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border.primary,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  tabIcon: {
    marginBottom: theme.spacing.xs,
  },
  tabText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    backgroundColor: theme.colors.primary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
});