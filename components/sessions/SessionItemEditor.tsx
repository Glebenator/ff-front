// components/SessionItemEditor.tsx
import React, { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';
import { sharedStyles } from '@/styles/sharedStyles';
import { type EditableFridgeItem } from '@/services/sessionManager';

interface SessionItemEditorProps {
  visible: boolean;
  item: EditableFridgeItem;
  onClose: () => void;
  onSave: (updatedItem: EditableFridgeItem) => void;
  onDelete: () => void;
  categories: string[];
}

export default function SessionItemEditor({
  visible,
  item,
  onClose,
  onSave,
  onDelete,
  categories,
}: SessionItemEditorProps) {
  const [editedItem, setEditedItem] = useState<EditableFridgeItem>(item);

  const handleSave = () => {
    onSave(editedItem);
    onClose();
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
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={sharedStyles.modalTitle}>Edit Item</Text>
              <Pressable onPress={onClose}>
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </Pressable>
            </View>

            {/* Basic Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>

              <View style={styles.field}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={editedItem.name}
                  onChangeText={(text) => setEditedItem(prev => ({ ...prev, name: text }))}
                  placeholder="Item name"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Direction</Text>
                <View style={styles.directionToggle}>
                  <Pressable
                    style={[
                      styles.directionButton,
                      editedItem.direction === 'in' && styles.directionButtonActive
                    ]}
                    onPress={() => setEditedItem(prev => ({ ...prev, direction: 'in' }))}
                  >
                    <Ionicons name="arrow-down" size={20} color={editedItem.direction === 'in' ? theme.colors.background.primary : theme.colors.text.primary} />
                    <Text style={[styles.directionText, editedItem.direction === 'in' && styles.directionTextActive]}>In</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.directionButton,
                      editedItem.direction === 'out' && styles.directionButtonActive
                    ]}
                    onPress={() => setEditedItem(prev => ({ ...prev, direction: 'out' }))}
                  >
                    <Ionicons name="arrow-up" size={20} color={editedItem.direction === 'out' ? theme.colors.background.primary : theme.colors.text.primary} />
                    <Text style={[styles.directionText, editedItem.direction === 'out' && styles.directionTextActive]}>Out</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Quantity</Text>
                <TextInput
                  style={[styles.input, styles.quantityInput]}
                  value={String(editedItem.quantity)}
                  onChangeText={(text) => {
                    const num = parseInt(text);
                    if (!isNaN(num) && num > 0) {
                      setEditedItem(prev => ({ ...prev, quantity: num }));
                    }
                  }}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Additional Details (only for 'in' direction) */}
            {editedItem.direction === 'in' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Additional Details</Text>

                <View style={styles.field}>
                  <Text style={styles.label}>Category</Text>
                  <View style={styles.categoryButtons}>
                    {categories.map(category => (
                      <Pressable
                        key={category}
                        style={[
                          styles.categoryButton,
                          editedItem.category === category && styles.categoryButtonActive
                        ]}
                        onPress={() => setEditedItem(prev => ({ ...prev, category }))}
                      >
                        <Text style={[
                          styles.categoryButtonText,
                          editedItem.category === category && styles.categoryButtonTextActive
                        ]}>
                          {category}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Expiry Date</Text>
                  <Pressable style={styles.dateButton}>
                    <Text style={styles.dateButtonText}>
                      {editedItem.expiryDate || 'Select date'}
                    </Text>
                    <Ionicons name="calendar" size={20} color={theme.colors.text.secondary} />
                  </Pressable>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Notes</Text>
                  <TextInput
                    style={[styles.input, styles.notesInput]}
                    value={editedItem.notes}
                    onChangeText={(text) => setEditedItem(prev => ({ ...prev, notes: text }))}
                    placeholder="Add notes..."
                    multiline
                  />
                </View>
              </View>
            )}

            {/* Action Buttons - Always visible regardless of direction */}
            <View style={styles.actions}>
              <Pressable
                style={styles.deleteButton}
                onPress={onDelete}
              >
                <Ionicons name="trash" size={20} color={theme.colors.status.error} />
                <Text style={styles.deleteButtonText}>Delete Item</Text>
              </Pressable>

              <View style={styles.mainActions}>
                <Pressable
                  style={[styles.button, styles.cancelButton]}
                  onPress={onClose}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>

                <Pressable
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  field: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
  },
  directionToggle: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  directionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
  },
  directionButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  directionText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
  },
  directionTextActive: {
    color: theme.colors.background.primary,
    fontWeight: '600',
  },
  quantityInput: {
    width: 100,
    textAlign: 'center',
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  categoryButton: {
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  categoryButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  categoryButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
  },
  categoryButtonTextActive: {
    color: theme.colors.background.primary,
    fontWeight: '600',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  dateButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  actions: {
    gap: theme.spacing.lg,
  },
  mainActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  button: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.background.secondary,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
  },
  cancelButtonText: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSize.md,
    fontWeight: '500',
  },
  saveButtonText: {
    color: theme.colors.background.primary,
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  deleteButtonText: {
    color: theme.colors.status.error,
    fontSize: theme.fontSize.md,
    fontWeight: '500',
  },
});