// components/recipes/sort/RecipeSortModal.tsx
import React from 'react';
import { View, Text, Pressable, Modal, StyleSheet, FlatList } from 'react-native';
import { theme } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { type RecipeSortType } from '@/types/types';

interface SortOption {
  label: string;
  value: RecipeSortType;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  description: string;
}

interface RecipeSortModalProps {
  visible: boolean;
  sortOrder: RecipeSortType;
  setSortOrder: (order: RecipeSortType) => void;
  onClose: () => void;
}

const RecipeSortModal: React.FC<RecipeSortModalProps> = ({ visible, sortOrder, setSortOrder, onClose }) => {
  const sortOptions: SortOption[] = [
    { 
      label: "Name (A-Z)", 
      value: "name-asc", 
      icon: "text-outline",
      description: "Alphabetical order"
    },
    { 
      label: "Name (Z-A)", 
      value: "name-desc", 
      icon: "text-outline",
      description: "Reverse alphabetical order"
    },
    { 
      label: "Generated (Newest)", 
      value: "date-generated-newest", 
      icon: "time-outline",
      description: "Recently generated recipes first"
    },
    { 
      label: "Generated (Oldest)", 
      value: "date-generated-oldest", 
      icon: "hourglass-outline",
      description: "Oldest recipes first"
    },
    { 
      label: "Ingredients (Few to Many)", 
      value: "ingredients-asc", 
      icon: "list-outline",
      description: "Recipes with fewer ingredients first"
    },
    { 
      label: "Ingredients (Many to Few)", 
      value: "ingredients-desc", 
      icon: "list-outline",
      description: "Recipes with more ingredients first"
    }
  ];

  const renderOption = ({ item }: { item: SortOption }) => (
    <Pressable
      style={[styles.option, sortOrder === item.value && styles.optionSelected]}
      onPress={() => {
        setSortOrder(item.value);
        onClose();
      }}
    >
      <View style={styles.optionContent}>
        <View style={styles.optionIconContainer}>
          <Ionicons 
            name={item.icon} 
            size={20} 
            color={sortOrder === item.value ? theme.colors.background.primary : theme.colors.text.primary} 
          />
        </View>
        <View style={styles.optionTextContainer}>
          <Text style={[styles.optionLabel, sortOrder === item.value && styles.optionLabelSelected]}>
            {item.label}
          </Text>
          {item.description && (
            <Text style={[styles.optionDescription, sortOrder === item.value && styles.optionDescriptionSelected]}>
              {item.description}
            </Text>
          )}
        </View>
      </View>
      
      {sortOrder === item.value && (
        <Ionicons name="checkmark" size={24} color={theme.colors.background.primary} />
      )}
    </Pressable>
  );

  return (
    <Modal 
      animationType="slide" 
      transparent={true} 
      visible={visible} 
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sort Recipes By</Text>
            <Pressable style={styles.closeIconButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </Pressable>
          </View>
          
          <View style={styles.divider} />
          
          <FlatList
            data={sortOptions}
            renderItem={renderOption}
            keyExtractor={(item) => item.value}
            style={styles.optionsList}
            showsVerticalScrollIndicator={false}
          />
          
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end', // Position modal from bottom
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: theme.colors.background.primary,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: '70%', // Limit height of the modal
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  closeIconButton: {
    padding: theme.spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border.primary,
    marginBottom: theme.spacing.lg,
  },
  optionsList: {
    marginBottom: theme.spacing.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
  },
  optionSelected: {
    backgroundColor: theme.colors.primary,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  optionLabelSelected: {
    color: theme.colors.background.primary,
  },
  optionDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  optionDescriptionSelected: {
    color: theme.colors.background.primary,
    opacity: 0.9,
  },
  closeButton: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  closeButtonText: {
    color: theme.colors.text.primary,
    fontWeight: '600',
    fontSize: theme.fontSize.md,
  }
});

export default RecipeSortModal;