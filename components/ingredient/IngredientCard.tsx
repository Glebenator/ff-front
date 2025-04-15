import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { theme } from '@/styles/theme';
import { sharedStyles } from '@/styles/sharedStyles';
import { ingredientDb } from '@/services/database/ingredientDb';
import { type Ingredient } from '@/types/types';

type IngredientCardProps = {
    id: number;
    name: string;
    quantity: string;
    expiryDate: string;
    daysUntilExpiry: number;
    category?: string;
    notes?: string;
    onDelete?: (id: number) => void;
    onUpdate?: () => void;  // New callback for updates
};

export default function IngredientCard({ 
    id, 
    name, 
    quantity, 
    expiryDate,
    daysUntilExpiry,
    category,
    notes,
    onDelete,
    onUpdate 
}: IngredientCardProps) {
    const [showModal, setShowModal] = useState(false);
    const MAX_NOTE_LENGTH = 50; // Maximum length for displaying notes directly
    const isShortNote = notes && notes.length <= MAX_NOTE_LENGTH;

    const getExpiryColor = () => {
        if (daysUntilExpiry <= 0) return theme.colors.status.danger;
        if (daysUntilExpiry <= 3) return theme.colors.status.warning;
        if (daysUntilExpiry <= 7) return theme.colors.status.success;
        return theme.colors.primary;
    };

    const handlePress = () => {
        if (Platform.OS === 'web') return;
        
        if (daysUntilExpiry < 0) {
            setShowModal(true);
        } else {
            router.push(`/ingredient?id=${id}`)
        }
    };

    const handleStateUpdate = async (action: () => Promise<void>) => {
        try {
            await action();
            if (onUpdate) {
                onUpdate(); // Trigger parent refresh
            }
        } catch (error) {
            console.error('Error updating ingredient:', error);
            Alert.alert('Error', 'Failed to update ingredient');
        }
    };

    const handleExtendExpiry = async (days: number) => {
        await handleStateUpdate(async () => {
            // Start from today's date
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Reset time to start of day
            const newDate = new Date(today);
            newDate.setDate(newDate.getDate() + days);
            
            // Update the expiry date
            await ingredientDb.update(id, {
                expiryDate: newDate.toISOString().split('T')[0]
            });
            
            // Close the modal after successful update
            setShowModal(false);
        });
    };

    const handleRemoveItem = () => {
        Alert.alert(
            'Delete Item',
            'Are you sure you want to delete this item?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => handleStateUpdate(async () => {
                        await ingredientDb.delete(id);
                        if (onDelete) {
                            onDelete(id);
                        }
                        setShowModal(false);
                    })
                }
            ]
        );
    };

    const getExpiryText = () => {
        if (daysUntilExpiry === 0) return 'Expires today';
        if (daysUntilExpiry === 1) return '1 day left';
        if (daysUntilExpiry < 0) return `Expired (${Math.abs(daysUntilExpiry)}d)`;
        return `${daysUntilExpiry}d left`;
    };

    return (
        <>
            <Pressable 
                style={({ pressed }) => [
                    sharedStyles.ingredientCard,
                    pressed && sharedStyles.cardPressed
                ]}
                onPress={handlePress}
            >
                <View style={[styles.expiryIndicator, { backgroundColor: getExpiryColor() }]} />
                
                <View style={sharedStyles.cardContentContainer}>
                    <View style={sharedStyles.spaceBetween}>
                        <Text style={[sharedStyles.cardTitle, styles.name]} numberOfLines={2}>
                            {name}
                        </Text>
                        <View style={sharedStyles.iconRow}>
                            {notes && !isShortNote && (
                                <Ionicons 
                                    name="document-text-outline" 
                                    size={16} 
                                    color={theme.colors.text.tertiary}
                                />
                            )}
                            {Platform.OS !== 'web' && (
                                <Ionicons 
                                    name="chevron-forward" 
                                    size={20} 
                                    color={theme.colors.text.tertiary}
                                />
                            )}
                        </View>
                    </View>

                    <View style={styles.detailsContainer}>
                        <View style={styles.categorySpace}>
                            {category && (
                                <View style={sharedStyles.detailsRow}>
                                    <Ionicons 
                                        name="pricetag-outline" 
                                        size={14} 
                                        color={theme.colors.text.tertiary}
                                    />
                                    <Text style={styles.category}>{category}</Text>
                                </View>
                            )}
                        </View>
                        <View style={sharedStyles.detailsRow}>
                            <Ionicons 
                                name="cube-outline" 
                                size={14} 
                                color={theme.colors.text.secondary}
                            />
                            <Text style={styles.quantity}>{quantity}</Text>
                        </View>
                    </View>

                    {isShortNote && (
                        <View style={sharedStyles.detailsRow}>
                            <Ionicons 
                                name="document-text-outline" 
                                size={14} 
                                color={theme.colors.text.tertiary}
                            />
                            <Text style={styles.noteText} numberOfLines={1}>
                                {notes}
                            </Text>
                        </View>
                    )}

                    <View style={sharedStyles.detailsRow}>
                        <Ionicons 
                            name="time-outline" 
                            size={14} 
                            color={getExpiryColor()}
                        />
                        <Text style={[styles.expiryText, { color: getExpiryColor() }]}>
                            {getExpiryText()}
                        </Text>
                    </View>
                </View>
            </Pressable>

            <Modal
                visible={showModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowModal(false)}
            >
                <Pressable 
                    style={sharedStyles.modalOverlay}
                    onPress={() => setShowModal(false)}
                >
                    <View style={sharedStyles.modalContent}>
                        <Text style={sharedStyles.modalTitle}>Expired Item</Text>
                        <Text style={sharedStyles.modalSubtitle}>{name}</Text>
                        
                        <View style={sharedStyles.modalActions}>
                            <Text style={[sharedStyles.bodyText, styles.modalSectionTitle]}>
                                Extend expiry by:
                            </Text>
                            <View style={styles.extendButtonsRow}>
                                {[1, 2, 3].map((days) => (
                                    <Pressable
                                        key={days}
                                        style={styles.extendButton}
                                        onPress={() => handleExtendExpiry(days)}
                                    >
                                        <Text style={styles.extendButtonText}>
                                            {days} {days === 1 ? 'day' : 'days'}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                            
                            <Pressable 
                                style={styles.dangerButton}
                                onPress={handleRemoveItem}
                            >
                                <Ionicons name="trash-outline" size={20} color="white" />
                                <Text style={styles.buttonText}>Remove Item</Text>
                            </Pressable>
                            
                            <Pressable 
                                style={styles.cancelButton}
                                onPress={() => setShowModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </Pressable>
                        </View>
                    </View>
                </Pressable>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    expiryIndicator: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 4,
        height: '100%',
    },
    name: {
        flex: 1,
        marginRight: theme.spacing.xs,
    },
    detailsContainer: {
        height: 52,
        justifyContent: 'flex-start',
    },
    categorySpace: {
        height: 24,
        justifyContent: 'center',
    },
    category: {
        color: theme.colors.text.tertiary,
        fontSize: theme.fontSize.sm,
    },
    quantity: {
        color: theme.colors.text.secondary,
        fontSize: theme.fontSize.md,
    },
    expiryText: {
        fontSize: theme.fontSize.sm,
        fontWeight: '500',
    },
    modalSectionTitle: {
        fontWeight: '500',
        marginBottom: theme.spacing.md,
    },
    extendButtonsRow: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.lg,
    },
    extendButton: {
        flex: 1,
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    extendButtonText: {
        color: theme.colors.background.primary,
        fontSize: theme.fontSize.md,
        fontWeight: '600',
    },
    dangerButton: {
        backgroundColor: theme.colors.status.error,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.md,
    },
    cancelButton: {
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: theme.fontSize.md,
        fontWeight: '600',
    },
    cancelButtonText: {
        color: theme.colors.text.secondary,
        fontSize: theme.fontSize.md,
    },
    noteText: {
        color: theme.colors.text.tertiary,
        fontSize: theme.fontSize.sm,
        flex: 1,
    },
});