import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';
import { sharedStyles } from '@/styles/sharedStyles';

export type SessionStatus = 'pending' | 'approved' | 'rejected';

export const FILTER_OPTIONS: { label: string; value: SessionStatus; }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

interface FilterHeaderProps {
  activeFilter: SessionStatus;
  setActiveFilter: (filter: SessionStatus) => void;
  onClear: () => void;
  hasItems: boolean;
}

export const FilterHeader: React.FC<FilterHeaderProps> = ({ 
  activeFilter, 
  setActiveFilter, 
  onClear, 
  hasItems 
}) => (
  <View style={styles.filterHeader}>
    <View style={sharedStyles.filterContainer}>
      {FILTER_OPTIONS.map((option) => (
        <Pressable
          key={option.value}
          style={[
            sharedStyles.filterButton,
            activeFilter === option.value && sharedStyles.filterButtonActive
          ]}
          onPress={() => setActiveFilter(option.value)}
        >
          <Text style={[
            sharedStyles.filterButtonText,
            activeFilter === option.value && sharedStyles.filterButtonTextActive
          ]}>
            {option.label}
          </Text>
        </Pressable>
      ))}
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

const styles = StyleSheet.create({
  filterHeader: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border.primary,
    gap: theme.spacing.md,
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

export default FilterHeader;
