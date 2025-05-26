import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';
import { useSessions } from '@/hooks/useSessions';
import { sessionManager, type EditableFridgeItem } from '@/services/sessionManager';
import { toastStore } from '@/services/toastStore';
import SessionItemEditor from '@/components/sessions/SessionItemEditor';
import { 
  SessionCard, 
  EmptyState, 
  type SessionStatus 
} from '@/components/sessions';
import SharedTabNavigation from '@/components/shared/TabNavigation';
import { TAB_VARIANTS, TAB_ICONS } from '@/config/tabStyles';

export default function SessionsScreen() {
  const {
    sessions,
    approveSession,
    rejectSession,
    dismissNotification
  } = useSessions();

  const [activeFilter, setActiveFilter] = useState<SessionStatus>('pending');
  const [selectedItem, setSelectedItem] = useState<{
    sessionId: string;
    itemIndex: number;
    item: EditableFridgeItem;
  } | null>(null);

  // Initialize state
  useEffect(() => {
    dismissNotification();
  }, []);

  // Handler functions
  const handleClearSessions = (status: SessionStatus) => {
    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
    
    Alert.alert(
      `Clear ${statusLabel} Sessions`,
      `Are you sure you want to clear all ${status} sessions?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await sessionManager.clearSessions(status);
              toastStore.success(`${statusLabel} sessions cleared`);
            } catch (error) {
              console.error('Error clearing sessions:', error);
              toastStore.error('Failed to clear sessions');
            }
          }
        }
      ]
    );
  };

  const handleEditItem = async (
    sessionId: string,
    itemIndex: number,
    updatedItem: EditableFridgeItem
  ) => {
    try {
      await sessionManager.updateSessionItem(sessionId, itemIndex, updatedItem);
      setSelectedItem(null);
      toastStore.success('Item updated successfully');
    } catch (error) {
      console.error('Error updating item:', error);
      toastStore.error('Failed to update item');
    }
  };

  const handleDeleteItem = async (sessionId: string, itemIndex: number, itemName: string) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${itemName}" from this session?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await sessionManager.removeSessionItem(sessionId, itemIndex);
              setSelectedItem(null);
              toastStore.success('Item removed from session');
            } catch (error) {
              console.error('Error removing item:', error);
              toastStore.error('Failed to remove item');
            }
          }
        }
      ]
    );
  };

  const handleEditItemPress = (sessionId: string, itemIndex: number, item: EditableFridgeItem) => {
    setSelectedItem({ sessionId, itemIndex, item });
  };

  const filteredSessions = sessions.filter(session => session.status === activeFilter);

  return (
    <View style={styles.container}>
      <View style={styles.filterHeader}>
        <SharedTabNavigation
          tabs={[
            { id: 'pending', label: 'Pending', icon: TAB_ICONS.pending as any },
            { id: 'approved', label: 'Approved', icon: TAB_ICONS.approved as any },
            { id: 'rejected', label: 'Rejected', icon: TAB_ICONS.rejected as any }
          ]}
          activeTab={activeFilter}
          onChangeTab={(tab) => setActiveFilter(tab as SessionStatus)}
          variant={TAB_VARIANTS.sessions}
        />
        
        {filteredSessions.length > 0 && (
          <Pressable
            style={styles.clearButton}
            onPress={() => handleClearSessions(activeFilter)}
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

      {filteredSessions.length === 0 ? (
        <EmptyState status={activeFilter} />
      ) : (
        <ScrollView style={styles.sessionsList}>
          {filteredSessions.map((session) => (
            <SessionCard
              key={session.sessionId}
              session={{
                ...session,
                items: session.items.map(item => ({
                  ...item,
                  quantity: item.quantity ?? 1
                }))
              }}
              onApprove={approveSession}
              onReject={rejectSession}
              onEditItem={handleEditItemPress}
            />
          ))}
        </ScrollView>
      )}

      {selectedItem && (
        <SessionItemEditor
          visible={true}
          item={selectedItem.item}
          onClose={() => setSelectedItem(null)}
          onSave={(updatedItem) => 
            handleEditItem(selectedItem.sessionId, selectedItem.itemIndex, updatedItem)
          }
          onDelete={() => 
            handleDeleteItem(selectedItem.sessionId, selectedItem.itemIndex, selectedItem.item.name)
          }
          categories={sessionManager.getAvailableCategories()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  sessionsList: {
    flex: 1,
    padding: theme.spacing.md,
  },
  filterHeader: {
    paddingBottom: theme.spacing.sm,
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
    marginRight: theme.spacing.md,
  },
  clearButtonText: {
    color: theme.colors.status.error,
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
  },
});