import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, LayoutChangeEvent } from 'react-native';
import { theme } from '@/styles/theme';

type TabType = 'suggested' | 'favorites' | 'recent';

interface AnimatedTabNavigationProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

interface TabLayout {
  x: number;
  width: number;
}

export default function AnimatedTabNavigation({ activeTab, onChangeTab }: AnimatedTabNavigationProps) {
  const [tabLayouts, setTabLayouts] = useState<{[key in TabType]?: TabLayout}>({});
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Animation values
  const indicatorPosition = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(0)).current;
  
  // For debugging
  const [indicatorVisible, setIndicatorVisible] = useState(false);
  
  // Handle layout measurement of the container
  const onContainerLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };
  
  // Handle layout measurement for each tab
  const handleTabLayout = (tab: TabType) => (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setTabLayouts(prev => ({
      ...prev,
      [tab]: { x, width }
    }));
  };
  
  // Update the indicator position when tab changes or when layouts are measured
  useEffect(() => {
    if (tabLayouts[activeTab]) {
      const { x, width } = tabLayouts[activeTab];
      
      // Make indicator visible once we have measurements
      if (!indicatorVisible) {
        setIndicatorVisible(true);
      }
      
      // Animate the indicator to the active tab position
      Animated.parallel([
        Animated.spring(indicatorPosition, {
          toValue: x,
          useNativeDriver: false,
          tension: 60,
          friction: 7,    // Lower friction for more bouncy effect
          velocity: 1     // Add some initial velocity
        }),
        Animated.spring(indicatorWidth, {
          toValue: width,
          useNativeDriver: false,
          tension: 60,
          friction: 7
        })
      ]).start();
    }
  }, [activeTab, tabLayouts, indicatorPosition, indicatorWidth, indicatorVisible]);

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer} onLayout={onContainerLayout}>
        {(['suggested', 'favorites', 'recent'] as TabType[]).map((tab) => (
          <Pressable
            key={tab}
            style={styles.tab}
            onPress={() => onChangeTab(tab)}
            onLayout={handleTabLayout(tab)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab && styles.activeTabText
            ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>
      
      {indicatorVisible && (
        <Animated.View 
          style={[
            styles.indicator,
            {
              left: indicatorPosition,
              width: indicatorWidth
            }
          ]} 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border.primary,
    position: 'relative',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
  },
  tab: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    alignItems: 'center',
    flex: 1,
  },
  tabText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 4,
    backgroundColor: theme.colors.primary,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
});