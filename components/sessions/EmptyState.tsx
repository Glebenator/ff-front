import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';
import { sharedStyles } from '@/styles/sharedStyles';
import { SessionStatus } from './FilterHeader';

interface EmptyStateProps {
  status: SessionStatus;
}

const EMPTY_STATE_CONTENT = {
  pending: {
    icon: 'time-outline',
    title: 'No Pending Sessions',
    message: 'No sessions currently need your review'
  },
  approved: {
    icon: 'checkmark-circle-outline',
    title: 'No Approved Sessions',
    message: 'Sessions you approve will appear here'
  },
  rejected: {
    icon: 'close-circle-outline',
    title: 'No Rejected Sessions',
    message: 'Sessions you reject will appear here'
  }
};

const EmptyState: React.FC<EmptyStateProps> = ({ status }) => {
  const content = EMPTY_STATE_CONTENT[status];

  return (
    <View style={sharedStyles.emptyState}>
      <Ionicons 
        name={content.icon as any}
        size={theme.fontSize.hero} 
        color={theme.colors.text.secondary}
      />
      <Text style={sharedStyles.emptyStateTitle}>{content.title}</Text>
      <Text style={sharedStyles.emptyStateText}>{content.message}</Text>
    </View>
  );
};

export default EmptyState;
