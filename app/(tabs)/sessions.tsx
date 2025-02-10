// app/(tabs)/sessions.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';
import { sharedStyles } from '@/styles/sharedStyles';
import { useSessions } from '@/hooks/useSessions';
import { sessionManager, type EditableFridgeItem } from '@/services/sessionManager';
import { toastStore } from '@/services/toastStore';
import SessionItemEditor from '@/components/SessionItemEditor';

type SessionStatus = 'pending' | 'approved' | 'rejected';

const FILTER_OPTIONS: { label: string; value: SessionStatus; }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

// FilterHeader Component
interface FilterHeaderProps {
  activeFilter: SessionStatus;
  setActiveFilter: (filter: SessionStatus) => void;
  onClear: () => void;
  hasItems: boolean;
}

const FilterHeader = ({ 
  activeFilter, 
  setActiveFilter, 
  onClear, 
  hasItems 
}: FilterHeaderProps) => (
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

// Main Component
export default function SessionsScreen() {
  const {
    sessions,
    approveSession,
    rejectSession,
    dismissNotification
  } = useSessions();

  const [activeFilter, setActiveFilter] = useState<SessionStatus>('pending');
  const [expandedSessions, setExpandedSessions] = useState<{ [key: string]: boolean }>({});
  const [selectedItem, setSelectedItem] = useState<{
    sessionId: string;
    itemIndex: number;
    item: EditableFridgeItem;
  } | null>(null);

  // Initialize state
  useEffect(() => {
    dismissNotification();
    const initialExpanded = sessions.reduce((acc, session) => ({
      ...acc,
      [session.sessionId]: false
    }), {});
    setExpandedSessions(initialExpanded);
  }, []);

  // Handler functions
  const handleClearSessions = (status: SessionStatus) => {
    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
    
    Alert.alert(
      `Clear ${statusLabel} Sessions`,
      `Are you sure you want to clear all ${status} sessions?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
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

  const toggleSession = (sessionId: string) => {
    setExpandedSessions(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
  };

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

  const renderEmptyState = () => {
    const emptyStateContent = {
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
    }[activeFilter];

    return (
      <View style={sharedStyles.emptyState}>
        <Ionicons 
          name={emptyStateContent.icon as any}
          size={theme.fontSize.hero} 
          color={theme.colors.text.secondary}
        />
        <Text style={sharedStyles.emptyStateTitle}>{emptyStateContent.title}</Text>
        <Text style={sharedStyles.emptyStateText}>{emptyStateContent.message}</Text>
      </View>
    );
  };

  const filteredSessions = sessions.filter(session => session.status === activeFilter);

  return (
    <View style={styles.container}>
      <FilterHeader 
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        onClear={() => handleClearSessions(activeFilter)}
        hasItems={filteredSessions.length > 0}
      />

      {filteredSessions.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView style={styles.sessionsList}>
          {filteredSessions.map((session) => (
            <Pressable 
              key={session.sessionId} 
              style={styles.sessionCard}
              onPress={() => toggleSession(session.sessionId)}
            >
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Ionicons
                    name={expandedSessions[session.sessionId] ? "chevron-down" : "chevron-forward"}
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

              {expandedSessions[session.sessionId] && (
                <>
                  <View style={styles.itemsList}>
                    {session.items.map((item, index) => (
                      <View key={index} style={styles.itemRow}>
                        <View style={styles.itemInfo}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <Text style={[
                            styles.confidence,
                            { color: item.confidence >= 0.8 
                              ? theme.colors.status.success 
                              : item.confidence >= 0.6 
                              ? theme.colors.status.warning 
                              : theme.colors.status.error 
                            }
                          ]}>
                            {Math.round(item.confidence * 100)}% confident
                          </Text>
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
                          
                          {session.status === 'pending' && (
                            <Pressable
                              style={styles.editButton}
                              onPress={() => setSelectedItem({ 
                                sessionId: session.sessionId, 
                                itemIndex: index, 
                                item 
                              })}
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
                    ))}
                  </View>

                  {session.status === 'pending' && (
                    <View style={styles.actions}>
                      <Pressable
                        style={[styles.button, styles.approveButton]}
                        onPress={() => approveSession(session.sessionId, session.items)}
                      >
                        <Ionicons name="checkmark" size={20} color={theme.colors.background.primary} />
                        <Text style={styles.buttonText}>Approve</Text>
                      </Pressable>

                      <Pressable
                        style={[styles.button, styles.rejectButton]}
                        onPress={() => rejectSession(session.sessionId)}
                      >
                        <Ionicons name="close" size={20} color={theme.colors.background.primary} />
                        <Text style={styles.buttonText}>Reject</Text>
                      </Pressable>
                    </View>
                  )}
                </>
              )}
            </Pressable>
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
  sessionsList: {
    flex: 1,
    padding: theme.spacing.md,
  },
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
  confidence: {
    fontSize: theme.fontSize.sm,
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