import React, { useRef, useEffect, useState } from 'react';
import { View, Pressable, Text, StyleSheet, Animated, LayoutChangeEvent } from 'react-native';
import { theme } from '@/styles/theme';
import { type FilterType } from '@/types/types';

interface AnimatedExpiryFiltersProps {
  filter: FilterType;
  setFilter: (filter: FilterType) => void;
}

interface TabLayout {
  x: number;
  width: number;
}

export default function AnimatedExpiryFilters({ filter, setFilter }: AnimatedExpiryFiltersProps) {
  const [tabLayouts, setTabLayouts] = useState<{[key in FilterType]?: TabLayout}>({});
  
  // Animation values
  const indicatorPosition = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(0)).current;
  
  // For indicator visibility
  const [indicatorVisible, setIndicatorVisible] = useState(false);
  
  // Handle layout measurement for each tab
  const handleTabLayout = (tabFilter: FilterType) => (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setTabLayouts(prev => ({
      ...prev,
      [tabFilter]: { x, width }
    }));
  };
  
  // Update the indicator position when tab changes or when layouts are measured
  useEffect(() => {
    if (tabLayouts[filter]) {
      const { x, width } = tabLayouts[filter];
      
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
          friction: 7,
          velocity: 1
        }),
        Animated.spring(indicatorWidth, {
          toValue: width,
          useNativeDriver: false,
          tension: 60,
          friction: 7
        })
      ]).start();
    }
  }, [filter, tabLayouts, indicatorPosition, indicatorWidth, indicatorVisible]);

  const filters: { label: string; value: FilterType; }[] = [
    { label: 'All Items', value: 'all' },
    { label: 'Expiring Soon', value: 'expiring-soon' },
    { label: 'Expired', value: 'expired' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        {filters.map((option) => (
          <Pressable
            key={option.value}
            style={styles.tab}
            onPress={() => setFilter(option.value)}
            onLayout={handleTabLayout(option.value)}
          >
            <Text style={[
              styles.tabText,
              filter === option.value && styles.activeTabText
            ]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
        
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    position: 'relative',
    paddingBottom: theme.spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
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
    height: 3,
    backgroundColor: theme.colors.primary,
    borderTopLeftRadius: 1.5,
    borderTopRightRadius: 1.5,
  }
});