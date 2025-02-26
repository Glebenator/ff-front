import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';
import { type EditableFridgeItem } from '@/services/sessionManager';
import SessionItem from './SessionItem';
import { SessionStatus } from './FilterHeader';

interface Session {
  sessionId: string;
  status: SessionStatus;
  timestamp: number;
  items: EditableFridgeItem[];
}

interface SessionCardProps {
  session: Session;
  onApprove?: (sessionId: string, items: EditableFridgeItem[]) => void;
  onReject?: (sessionId: string) => void;
  onEditItem?: (sessionId: string, itemIndex: number, item: EditableFridgeItem) => void;
}

const SessionCard: React.FC<SessionCardProps> = ({ 
  session, 
  onApprove, 
  onReject, 
  onEditItem 
}) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => setExpanded(!expanded);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return theme.colors.status.warning;
      case 'approved':
        return theme.colors.status.success;
      case 'rejected':
        return theme.colors.status.error;
      default:
        return theme.colors.text.secondary;
    }
  };

  const handleEditItem = (itemIndex: number) => {
    if (onEditItem) {
      onEditItem(session.sessionId, itemIndex, session.items[itemIndex]);
    }
  };

  return (
    <Pressable 
      style={styles.sessionCard}
      onPress={toggleExpanded}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons
            name={expanded ? "chevron-down" : "chevron-forward"}
            size={20}
            color={theme.colors.text.secondary}
          />
          <Text style={styles.timestamp}>
            {new Date(session.timestamp).toLocaleString()}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(session.status) }
        ]}>
          <Text style={styles.statusText}>
            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
          </Text>
        </View>
      </View>

      {expanded && (
        <>
          <View style={styles.itemsList}>
            {session.items.map((item, index) => (
              <SessionItem
                key={index}
                item={item}
                index={index}
                sessionStatus={session.status}
                onEdit={onEditItem ? handleEditItem : undefined}
              />
            ))}
          </View>

          {session.status === 'pending' && onApprove && onReject && (
            <View style={styles.actions}>
              <Pressable
                style={[styles.button, styles.approveButton]}
                onPress={() => onApprove(session.sessionId, session.items)}
              >
                <Ionicons name="checkmark" size={20} color={theme.colors.background.primary} />
                <Text style={styles.buttonText}>Approve</Text>
              </Pressable>

              <Pressable
                style={[styles.button, styles.rejectButton]}
                onPress={() => onReject(session.sessionId)}
              >
                <Ionicons name="close" size={20} color={theme.colors.background.primary} />
                <Text style={styles.buttonText}>Reject</Text>
              </Pressable>
            </View>
          )}
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  sessionCard: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  timestamp: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.background.primary,
    fontWeight: '500',
  },
  itemsList: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  approveButton: {
    backgroundColor: theme.colors.status.success,
  },
  rejectButton: {
    backgroundColor: theme.colors.status.error,
  },
  buttonText: {
    color: theme.colors.background.primary,
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
});

export default SessionCard;
