import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';
import { type EditableFridgeItem } from '@/services/sessionManager';
import { SessionStatus } from './FilterHeader';

interface SessionItemProps {
  item: EditableFridgeItem;
  index: number;
  sessionStatus: SessionStatus;
  onEdit?: (index: number) => void;
}

const SessionItem: React.FC<SessionItemProps> = ({ 
  item, 
  index, 
  sessionStatus, 
  onEdit 
}) => {
  return (
    <View style={styles.itemRow}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
      </View>

      <View style={styles.itemDetails}>
        <Ionicons
          name={item.direction === 'in' ? 'arrow-down' : 'arrow-up'}
          size={20}
          color={theme.colors.text.primary}
        />
        <Text style={styles.direction}>
          {item.direction === 'in' ? 'In' : 'Out'}
        </Text>
        {item.quantity && item.direction === 'in' && (
          <Text style={styles.quantity}>× {item.quantity}</Text>
        )}
        
        {sessionStatus === 'pending' && onEdit && (
          <Pressable
            style={styles.editButton}
            onPress={() => onEdit(index)}
          >
            <Ionicons
              name="pencil"
              size={16}
              color={theme.colors.text.secondary}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: theme.fontSize.md,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  direction: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
  },
  quantity: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  editButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
});

export default SessionItem;
