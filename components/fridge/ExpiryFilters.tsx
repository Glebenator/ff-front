import { View, Pressable, Text, StyleSheet } from 'react-native';
import { theme } from '@/styles/theme';
import { sharedStyles } from '@/styles/sharedStyles';
import { type FilterType } from '@/types/types';

interface ExpiryFiltersProps {
  filter: FilterType;
  setFilter: (filter: FilterType) => void;
}

export default function ExpiryFilters({ filter, setFilter }: ExpiryFiltersProps) {
  return (
    <View style={styles.expiryFilterContainer}>
      <Pressable
        style={[sharedStyles.filterButton, filter === 'all' && sharedStyles.filterButtonActive as any]}
        onPress={() => setFilter('all')}
      >
        <Text
          style={[
            sharedStyles.filterButtonText,
            filter === 'all' && sharedStyles.filterButtonTextActive as any,
          ]}
        >
          All Items
        </Text>
      </Pressable>
      <Pressable
        style={[
          sharedStyles.filterButton,
          filter === 'expiring-soon' && sharedStyles.filterButtonActive as any,
        ]}
        onPress={() => setFilter('expiring-soon')}
      >
        <Text
          style={[
            sharedStyles.filterButtonText,
            filter === 'expiring-soon' && sharedStyles.filterButtonTextActive as any,
          ]}
        >
          Expiring Soon
        </Text>
      </Pressable>
      <Pressable
        style={[sharedStyles.filterButton, filter === 'expired' && sharedStyles.filterButtonActive as any]}
        onPress={() => setFilter('expired')}
      >
        <Text
          style={[
            sharedStyles.filterButtonText,
            filter === 'expired' && sharedStyles.filterButtonTextActive as any,
          ]}
        >
          Expired
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  expiryFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
});
