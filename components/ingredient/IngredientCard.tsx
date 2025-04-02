import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { theme } from '@/styles/theme'; // [cite: code folder/styles/theme.ts]
import { sharedStyles } from '@/styles/sharedStyles'; // [cite: code folder/styles/sharedStyles.ts]
import { ingredientDb } from '@/services/database/ingredientDb'; // [cite: code folder/services/database/ingredientDb.ts]
import { type Ingredient } from '@/types/types'; // [cite: code folder/types/types.ts]

// --- Configuration for short notes ---
const NOTE_MAX_LENGTH = 50; // Adjust as needed

type IngredientCardProps = {
    id: number;
    name: string;
    quantity: string;
    expiryDate: string;
    daysUntilExpiry: number;
    category?: string;
    notes?: string; // Notes field from your props
    onDelete?: (id: number) => void;
    onUpdate?: () => void;
};

export default function IngredientCard({
    id,
    name,
    quantity,
    expiryDate,
    daysUntilExpiry,
    category,
    notes, // Receive notes prop
    onDelete,
    onUpdate
}: IngredientCardProps) {
    const [showModal, setShowModal] = useState(false);

    const getExpiryColor = () => {
        if (daysUntilExpiry <= 0) return theme.colors.status.danger;
        if (daysUntilExpiry <= 3) return theme.colors.status.warning;
        if (daysUntilExpiry <= 7) return theme.colors.status.success;
        return theme.colors.primary;
    };

    const handlePress = () => {
        if (Platform.OS === 'web') return;

        // Always navigate, don't show modal on press anymore based on expiry
        // The modal logic is now separate for expired items' actions
        // If you still want the modal on press for expired, revert this:
        router.push(`/ingredient?id=${id}`)

        // Original logic that showed modal on press if expired:
        // if (daysUntilExpiry < 0) {
        //     setShowModal(true);
        // } else {
        //     router.push(`/ingredient?id=${id}`)
        // }
    };

    const handleStateUpdate = async (action: () => Promise<void>) => {
        try {
            await action();
            if (onUpdate) {
                onUpdate();
            }
        } catch (error) {
            console.error('Error updating ingredient:', error);
            Alert.alert('Error', 'Failed to update ingredient');
        }
    };

     const handleExtendExpiry = async (days: number) => {
        await handleStateUpdate(async () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const newDate = new Date(today);
            newDate.setDate(newDate.getDate() + days);
            
            await ingredientDb.update(id, {
                expiryDate: newDate.toISOString().split('T')[0]
            });
            setShowModal(false); // Close modal after extending
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
                        setShowModal(false); // Close modal after deleting
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

    // Action button specifically for expired items
    const handleExpiredItemAction = () => {
        setShowModal(true);
    }

    return (
        <>
            <Pressable
                style={({ pressed }) => [
                    sharedStyles.ingredientCard,
                    pressed && sharedStyles.cardPressed
                ]}
                onPress={handlePress} // Navigate on press
            >
                <View style={[styles.expiryIndicator, { backgroundColor: getExpiryColor() }]} />

                <View style={sharedStyles.cardContentContainer}>
                    <View style={sharedStyles.spaceBetween}>
                        <Text style={[sharedStyles.cardTitle, styles.name]} numberOfLines={2}>
                            {name}
                        </Text>
                        <View style={sharedStyles.iconRow}>
                             {/* Keep the notes icon indicator */}
                            {notes && (
                                <Ionicons
                                    name="document-text-outline"
                                    size={16}
                                    color={theme.colors.text.tertiary}
                                    style={styles.iconSpacing} // Added margin
                                />
                            )}
                            {/* Show expired action button instead of chevron if item is expired */}
                            {daysUntilExpiry < 0 ? (
                                <Pressable onPress={handleExpiredItemAction} hitSlop={10}>
                                     <Ionicons
                                        name="ellipsis-horizontal-circle-outline"
                                        size={22}
                                        color={theme.colors.status.danger}
                                    />
                                </Pressable>
                            ) : (
                                Platform.OS !== 'web' && (
                                     <Ionicons
                                        name="chevron-forward"
                                        size={20}
                                        color={theme.colors.text.tertiary}
                                    />
                                )
                            )}
                        </View>
                    </View>

                    <View style={styles.detailsContainer}>
                        {/* Category Row */}
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
                         {/* Quantity Row */}
                        <View style={sharedStyles.detailsRow}>
                            <Ionicons
                                name="cube-outline"
                                size={14}
                                color={theme.colors.text.secondary}
                            />
                            <Text style={styles.quantity}>{quantity}</Text>
                        </View>
                    </View>

                    {/* Expiry Row */}
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

                    {/* --- Add Short Notes Display Here --- */}
                    {notes && notes.length > 0 && notes.length <= NOTE_MAX_LENGTH && (
                        <View style={styles.notesContainer}>
                            <Text style={styles.notesText} numberOfLines={2} ellipsizeMode="tail">
                                {notes}
                            </Text>
                        </View>
                    )}
                    {/* --- End Short Notes Display --- */}

                </View>
            </Pressable>

            {/* Keep your existing Modal */}
            <Modal
                visible={showModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowModal(false)}
            >
                <Pressable
                    style={sharedStyles.modalOverlay}
                    onPress={() => setShowModal(false)} // Close on overlay press
                >
                    {/* Ensure clicks inside modal don't close it */}
                     <Pressable style={sharedStyles.modalContent} onPress={() => {}}>
                        <Text style={sharedStyles.modalTitle}>Expired Item</Text>
                        <Text style={sharedStyles.modalSubtitle}>{name}</Text>

                        <View style={sharedStyles.modalActions}>
                            <Text style={[sharedStyles.bodyText, styles.modalSectionTitle]}>
                                Extend expiry from today by:
                            </Text>
                            <View style={styles.extendButtonsRow}>
                                {[1, 2, 3].map((days) => (
                                    <Pressable
                                        key={days}
                                        style={({ pressed }) => [styles.extendButton, pressed && sharedStyles.buttonPressed]}
                                        onPress={() => handleExtendExpiry(days)}
                                    >
                                        <Text style={styles.extendButtonText}>
                                            +{days}d
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>

                            <Pressable
                                style={({ pressed }) => [styles.dangerButton, pressed && sharedStyles.buttonPressed]}
                                onPress={handleRemoveItem}
                            >
                                <Ionicons name="trash-outline" size={20} color="white" />
                                <Text style={styles.buttonText}>Remove Item</Text>
                            </Pressable>

                            <Pressable
                                style={({ pressed }) => [styles.cancelButton, pressed && sharedStyles.buttonPressed]}
                                onPress={() => setShowModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </Pressable>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
}

// --- Styles (Including new styles for notes) ---
const styles = StyleSheet.create({
    expiryIndicator: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 4,
        height: '100%',
        borderTopLeftRadius: theme.borderRadius.md, // Match card radius
        borderBottomLeftRadius: theme.borderRadius.md,
    },
    name: {
        flex: 1, // Allow name to take space
        marginRight: theme.spacing.xs, // Space between name and icons
    },
    iconSpacing: { // Added style for margin between icons if needed
        marginRight: theme.spacing.sm,
    },
    detailsContainer: {
        flexDirection: 'row', // Arrange Category and Quantity side-by-side
        justifyContent: 'space-between', // Space them out
        alignItems: 'center',
        marginTop: theme.spacing.xs,
        marginBottom: theme.spacing.xs,
        height: 24, // Give consistent height
    },
    categorySpace: {
        flex: 1, // Allow category to take available space
        justifyContent: 'center',
        marginRight: theme.spacing.sm, // Add space before quantity
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
    // --- New styles for notes ---
    notesContainer: {
        marginTop: theme.spacing.sm, // Space above the note
        paddingTop: theme.spacing.xs,
        borderTopWidth: StyleSheet.hairlineWidth, // Subtle separator
        borderTopColor: theme.colors.border.primary,
    },
    notesText: {
        fontSize: theme.fontSize.sm, // Consistent small size
        color: theme.colors.text.secondary, // Use secondary color
        fontStyle: 'italic', // Make notes italic
    },
    // --- Modal styles (mostly unchanged) ---
    modalSectionTitle: {
        fontWeight: '500',
        marginBottom: theme.spacing.md,
        textAlign: 'center',
    },
    extendButtonsRow: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.lg,
    },
    extendButton: {
        flex: 1,
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.sm, // Adjust padding
        paddingHorizontal: theme.spacing.sm,
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
        backgroundColor: theme.colors.status.error, // Ensure it uses error color
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
        fontWeight: '500', // Slightly less bold than action buttons
    },
});