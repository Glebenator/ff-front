// components/SortModal.tsx
import React from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { theme } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';

type SortType = 'expiry-asc' | 'expiry-desc' | 'name-asc' | 'name-desc' | 'date-added-newest' | 'date-added-oldest';

interface SortModalProps {
    visible: boolean;
    sortOrder: SortType;
    setSortOrder: (order: SortType) => void;
    onClose: () => void;
}

const SortModal: React.FC<SortModalProps> = ({ visible, sortOrder, setSortOrder, onClose }) => {
     const SortOption = ({ label, value }: { label: string, value: SortType }) => (
        <Pressable
            style={[styles.option, sortOrder === value && styles.optionSelected]}
            onPress={() => {
                setSortOrder(value);
                onClose();
            }}
        >
          <Text style={[styles.optionText, sortOrder === value && styles.optionTextSelected]}>
                {label}
            </Text>
           {sortOrder === value && <Ionicons name="checkmark" size={24} color={theme.colors.background.primary} />}
        </Pressable>
    );

    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <Text style={styles.modalTitle}>Sort By</Text>
                    <SortOption label="Expiry (Soonest)" value="expiry-asc" />
                    <SortOption label="Expiry (Furthest)" value="expiry-desc" />
                    <SortOption label="Name (A-Z)" value="name-asc" />
                    <SortOption label="Name (Z-A)" value="name-desc" />
                    <SortOption label="Added (Newest)" value="date-added-newest" />
                    <SortOption label="Added (Oldest)" value="date-added-oldest" />
                    <Pressable style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        backgroundColor: theme.colors.background.primary,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        width: '80%',
        alignItems: 'stretch',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: theme.fontSize.xl,
        fontWeight: 'bold',
        marginBottom: theme.spacing.md,
        textAlign: 'center',
    },
      option: {
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.primary,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
      optionSelected: {
        backgroundColor: theme.colors.primary,
    },
     optionText: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text.primary
    },
    optionTextSelected: {
      color: theme.colors.background.primary,
      fontWeight: '600'
    },
    closeButton: {
        marginTop: theme.spacing.md,
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center'
    },
    closeButtonText: {
      color: theme.colors.text.primary,
      fontWeight: '600'
    }
});

export default SortModal;