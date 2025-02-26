import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';
import { sharedStyles } from '@/styles/sharedStyles';

export const EmptyFridge = () => (
  <View style={sharedStyles.emptyState}>
    <Ionicons name="nutrition-outline" size={64} color={theme.colors.primary} />
    <Text style={sharedStyles.emptyStateTitle}>Your fridge is empty!</Text>
    <Text style={sharedStyles.emptyStateText}>Start by adding your first ingredient using the + button below</Text>
  </View>
);

export const NoFilteredResults = ({ filter }: { filter: 'expired' | 'expiring-soon' }) => (
  <View style={sharedStyles.emptyState}>
    <Ionicons name="search-outline" size={64} color={theme.colors.primary} />
    <Text style={sharedStyles.emptyStateTitle}>
      {filter === 'expired' ? 'No expired items' : 'No expiring items'}
    </Text>
    <Text style={sharedStyles.emptyStateText}>
      {filter === 'expired'
        ? 'You have no expired ingredients. Great job managing your fridge!'
        : 'None of your ingredients are expiring soon. Great job keeping track!'}
    </Text>
  </View>
);

export const NoSearchResults = () => (
  <View style={sharedStyles.emptyState}>
    <Ionicons name="search-outline" size={64} color={theme.colors.primary} />
    <Text style={sharedStyles.emptyStateTitle}>No matching ingredients</Text>
    <Text style={sharedStyles.emptyStateText}>Try adjusting your search term</Text>
  </View>
);

export const LoadingState = () => (
  <View style={sharedStyles.emptyState}>
    <Text style={sharedStyles.emptyStateText}>Loading...</Text>
  </View>
);
