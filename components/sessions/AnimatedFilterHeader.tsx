import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';
import { sharedStyles } from '@/styles/sharedStyles';

export type SessionStatus = 'pending' | 'approved' | 'rejected';

export const FILTER_OPTIONS: { label: string; value: SessionStatus; }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

interface AnimatedFilterHeaderProps {
  activeFilter: SessionStatus;
  setActiveFilter: (filter: SessionStatus) => void;
  onClear: () => void;
  hasItems: boolean;
}

interface TabLayout {
  x: number;
  width: number;
}

export const AnimatedFilterHeader: React.FC<AnimatedFilterHeaderProps> = ({ 
  activeFilter, 
  setActiveFilter, 
  onClear, 
  hasItems 
}) => {
  const [tabLayouts, setTabLayouts] = useState<{[key in SessionStatus]?: TabLayout}>({});
  
  // Animation values
  const indicatorPosition = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(0)).current;
  
  // For indicator visibility
  const [indicatorVisible, setIndicatorVisible] = useState(false);
  
  // Handle layout measurement for each tab
  const handleTabLayout = (tab: SessionStatus) => (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setTabLayouts(prev => ({
      ...prev,
      [tab]: { x, width }
    }));
  };
  
  // Update the indicator position when tab changes or when layouts are measured
  useEffect(() => {
    if (tabLayouts[activeFilter]) {
      const { x, width } = tabLayouts[activeFilter];
      
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
  }, [activeFilter, tabLayouts, indicatorPosition, indicatorWidth, indicatorVisible]);

  return (
    <View style={styles.filterHeader}>
      <View style={styles.tabContainer}>
        {FILTER_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            style={styles.tab}
            onPress={() => setActiveFilter(option.value)}
            onLayout={handleTabLayout(option.value)}
          >
            <Text style={[
              styles.tabText,
              activeFilter === option.value && styles.activeTabText
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
      
      {hasItems && (
        <Pressable
          style={styles.clearButton}
          onPress={onClear}
        >
          <Ionicons 
            name="trash-outline" 
            size={18} 
            color={theme.colors.status.error} 
          />
          <Text style={styles.clearButtonText}>
            Clear {activeFilter}
          </Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  filterHeader: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border.primary,
    gap: theme.spacing.md,
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
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: theme.spacing.xs,
    padding: theme.spacing.sm,
  },
  clearButtonText: {
    color: theme.colors.status.error,
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
  },
});

export default AnimatedFilterHeader;