// components/SessionReviewModal.tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';
import { sharedStyles } from '@/styles/sharedStyles';
import { type FridgeSession, type FridgeItem } from '@/services/mqtt/mockMqttService';

const DEFAULT_QUANTITY = 1;

interface SessionReviewModalProps {
  session: FridgeSession;
  visible: boolean;
  onClose: () => void;
  onApprove: (items: FridgeItem[]) => void;
  onReject: () => void;
}

export default function SessionReviewModal({
  session,
  visible,
  onClose,
  onApprove,
  onReject
}: SessionReviewModalProps) {
  const [items, setItems] = useState(session.items.map(item => ({
    ...item,
    quantity: DEFAULT_QUANTITY,
    editingName: false,
    editingQuantity: false
  })));

  const handleNameChange = (index: number, name: string) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      name: name
    };
    setItems(newItems);
  };

  const handleQuantityChange = (index: number, quantity: string) => {
    // Only allow numbers and empty string
    if (quantity !== '' && !/^\d+$/.test(quantity)) {
      return;
    }
    
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      quantity: quantity === '' ? '' : parseInt(quantity)
    };
    setItems(newItems);
  };

  const handleDirectionToggle = (index: number) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      direction: newItems[index].direction === 'in' ? 'out' : 'in'
    };
    setItems(newItems);
  };

  const handleApprove = () => {
    const summary = {
      added: items.filter(item => item.direction === 'in').length,
      removed: items.filter(item => item.direction === 'out').length
    };
    
    // Remove any temporary UI state before passing to database
    const cleanedItems = items.map(({ editingName, editingQuantity, ...item }) => ({
      ...item,
      quantity: item.quantity || DEFAULT_QUANTITY // Ensure quantity has a value before saving
    }));
    onApprove(cleanedItems);
    
    Alert.alert(
      'Session Approved',
      `Added ${summary.added} items\nRemoved ${summary.removed} items`,
      [{ text: 'OK', onPress: onClose }]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={sharedStyles.modalOverlay}>
        <View style={[sharedStyles.modalContent, styles.content]}>
          <Text style={sharedStyles.modalTitle}>Review Detected Items</Text>
          <Text style={styles.timestamp}>
            {new Date(session.timestamp).toLocaleString()}
          </Text>

          {/* Items List wrapped in ScrollView */}
          <ScrollView style={styles.itemsList} contentContainerStyle={{ paddingBottom: theme.spacing.lg }}>
            {items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                {/* Item Name and Confidence */}
                <View style={styles.itemInfo}>
                  <Pressable 
                    style={styles.nameContainer}
                    onPress={() => {
                      const newItems = [...items];
                      newItems[index] = {
                        ...newItems[index],
                        editingName: true
                      };
                      setItems(newItems);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit name for ${item.name}`}
                  >
                    {item.editingName ? (
                      <TextInput
                        style={styles.nameInput}
                        value={item.name}
                        onChangeText={(text) => handleNameChange(index, text)}
                        onBlur={() => {
                          const newItems = [...items];
                          newItems[index] = {
                            ...newItems[index],
                            editingName: false
                          };
                          setItems(newItems);
                        }}
                        autoFocus
                        accessibilityLabel="Item name input"
                      />
                    ) : (
                      <Text style={styles.itemName}>
                        {item.name}
                        <Ionicons 
                          name="pencil" 
                          size={12} 
                          color={theme.colors.text.secondary}
                          style={styles.editIcon}
                        />
                      </Text>
                    )}
                  </Pressable>
                  <Text style={[
                    styles.confidence,
                    item.confidence >= 0.8 ? styles.highConfidence :
                    item.confidence >= 0.6 ? styles.mediumConfidence :
                    styles.lowConfidence
                  ]}>
                    {Math.round(item.confidence * 100)}% confident
                  </Text>
                </View>

                {/* Direction Toggle */}
                <Pressable
                  style={styles.directionButton}
                  onPress={() => handleDirectionToggle(index)}
                  accessibilityRole="button"
                  accessibilityLabel={`Toggle direction for ${item.name} to ${item.direction === 'in' ? 'out' : 'in'}`}
                >
                  <Ionicons
                    name={item.direction === 'in' ? 'arrow-down' : 'arrow-up'}
                    size={20}
                    color={theme.colors.text.primary}
                  />
                  <Text style={styles.directionText}>
                    {item.direction === 'in' ? 'In' : 'Out'}
                  </Text>
                </Pressable>

                {/* Quantity Input */}
                {item.direction === 'in' && (
                  <View style={styles.quantityContainer}>
                    <Text style={styles.quantityLabel}>Qty:</Text>
                    <TextInput
                      style={styles.quantityInput}
                      value={item.editingQuantity ? (item.quantity?.toString() || '') : (item.quantity?.toString() || DEFAULT_QUANTITY.toString())}
                      onChangeText={(text) => handleQuantityChange(index, text)}
                      onFocus={() => {
                        const newItems = [...items];
                        newItems[index] = {
                          ...newItems[index],
                          editingQuantity: true
                        };
                        setItems(newItems);
                      }}
                      onBlur={() => {
                        const newItems = [...items];
                        newItems[index] = {
                          ...newItems[index],
                          editingQuantity: false,
                          quantity: newItems[index].quantity || DEFAULT_QUANTITY // Only apply default on blur
                        };
                        setItems(newItems);
                      }}
                      keyboardType="numeric"
                      maxLength={2}
                      selectTextOnFocus={true}
                      accessibilityLabel={`Quantity input for ${item.name}`}
                    />
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Pressable
              style={[styles.button, styles.approveButton]}
              onPress={handleApprove}
              accessibilityRole="button"
              accessibilityLabel="Approve session"
            >
              <Ionicons name="checkmark" size={20} color={theme.colors.background.primary} />
              <Text style={styles.buttonText}>Approve</Text>
            </Pressable>

            <Pressable
              style={[styles.button, styles.rejectButton]}
              onPress={onReject}
              accessibilityRole="button"
              accessibilityLabel="Reject session"
            >
              <Ionicons name="close" size={20} color={theme.colors.background.primary} />
              <Text style={styles.buttonText}>Reject</Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.closeButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close modal"
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    maxHeight: '80%',
  },
  timestamp: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
  },
  itemsList: {
    // If desired, you can also add padding here
    // paddingHorizontal: theme.spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  itemInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemName: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  nameInput: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background.tertiary,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    flex: 1,
  },
  editIcon: {
    marginLeft: theme.spacing.xs,
  },
  confidence: {
    fontSize: theme.fontSize.sm,
  },
  highConfidence: {
    color: theme.colors.status.success,
  },
  mediumConfidence: {
    color: theme.colors.status.warning,
  },
  lowConfidence: {
    color: theme.colors.status.error,
  },
  directionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.background.tertiary,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  directionText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  quantityLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  quantityInput: {
    backgroundColor: theme.colors.background.tertiary,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    width: 50,
    textAlign: 'center',
    color: theme.colors.text.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl,
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
  closeButton: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  closeButtonText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSize.md,
  },
});
