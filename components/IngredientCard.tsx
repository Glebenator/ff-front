import { View, Text, StyleSheet, Pressable, Platform, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { theme } from '@/styles/theme';
import { ingredientDb } from '@/services/database/ingredientDb';

type IngredientCardProps = {
    id: number;
    name: string;
    quantity: string;
    expiryDate: string;
    daysUntilExpiry: number;
    category?: string;
    notes?: string;
};

export default function IngredientCard({ 
    id, 
    name, 
    quantity, 
    expiryDate,
    daysUntilExpiry,
    category,
    notes 
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
        
        if (daysUntilExpiry < 0) {
            setShowModal(true);
        } else {
            router.push(`/edit-ingredient?id=${id}`);
        }
    };

    const handleExtendExpiry = async (days: number) => {
        try {
            // Start from today's date
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Reset time to start of day
            
            // Add the specified number of days
            today.setDate(today.getDate() + days);
            const newExpiryDate = today.toISOString().split('T')[0];
            
            await ingredientDb.update(id, { expiryDate: newExpiryDate });
            // Just close the modal - the parent's refresh mechanism will handle the update
            setShowModal(false);
        } catch (error) {
            console.error('Error extending expiry:', error);
            Alert.alert('Error', 'Failed to update expiry date');
        }
        setShowModal(false);
    };

    const handleRemoveItem = async () => {
        try {
            await ingredientDb.delete(id);
            // Just close the modal - the parent's refresh mechanism will handle the update
            setShowModal(false);
        } catch (error) {
            console.error('Error removing item:', error);
            Alert.alert('Error', 'Failed to remove item');
        }
        setShowModal(false);
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
                    styles.card,
                    pressed && styles.cardPressed
                ]}
                onPress={handlePress}
            >
                <View style={[styles.expiryIndicator, { backgroundColor: getExpiryColor() }]} />
                
                <View style={styles.contentContainer}>
                    <View style={styles.headerRow}>
                        <Text style={styles.name} numberOfLines={1}>{name}</Text>
                        <View style={styles.headerIcons}>
                            {notes && (
                                <Ionicons 
                                    name="document-text-outline" 
                                    size={16} 
                                    color={theme.colors.text.tertiary}
                                    style={styles.noteIcon}
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
                                <View style={styles.textWithIcon}>
                                    <Ionicons 
                                        name="pricetag-outline" 
                                        size={14} 
                                        color={theme.colors.text.tertiary}
                                        style={styles.detailIcon}
                                    />
                                    <Text style={styles.category}>{category}</Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.textWithIcon}>
                            <Ionicons 
                                name="cube-outline" 
                                size={14} 
                                color={theme.colors.text.secondary}
                                style={styles.detailIcon}
                            />
                            <Text style={styles.quantity}>{quantity}</Text>
                        </View>
                    </View>

                    <View style={styles.expiryContainer}>
                        <View style={styles.textWithIcon}>
                            <Ionicons 
                                name="time-outline" 
                                size={14} 
                                color={getExpiryColor()}
                                style={styles.detailIcon}
                            />
                            <Text style={[styles.expiryText, { color: getExpiryColor() }]}>
                                {getExpiryText()}
                            </Text>
                        </View>
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
                    style={styles.modalOverlay}
                    onPress={() => setShowModal(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Expired Item</Text>
                        <Text style={styles.modalSubtitle}>{name}</Text>
                        
                        <View style={styles.modalButtons}>
                            <Text style={styles.modalSectionTitle}>Extend expiry by:</Text>
                            <View style={styles.extendButtons}>
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
                                style={styles.removeButton}
                                onPress={handleRemoveItem}
                            >
                                <Ionicons name="trash-outline" size={20} color="white" />
                                <Text style={styles.removeButtonText}>Remove Item</Text>
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
    card: {
        backgroundColor: theme.colors.background.tertiary,
        borderRadius: 16,
        margin: 8,
        width: Platform.select({ 
            web: 'calc(20% - 16px)',
            default: 160
        }),
        minWidth: 160,
        height: 150,
        overflow: 'hidden',
        position: 'relative',
    },
    cardPressed: {
        opacity: 0.7,
    },
    expiryIndicator: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 4,
        height: '100%',
    },
    contentContainer: {
        flex: 1,
        padding: theme.spacing.md,
        paddingLeft: theme.spacing.lg,
        height: '100%',
        justifyContent: 'space-between',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
        height: 28,
    },
    headerIcons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    noteIcon: {
        marginRight: theme.spacing.xs,
    },
    name: {
        color: theme.colors.text.primary,
        fontSize: theme.fontSize.lg,
        fontWeight: 'bold',
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
    textWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailIcon: {
        marginRight: 4,
    },
    category: {
        color: theme.colors.text.tertiary,
        fontSize: theme.fontSize.sm,
    },
    quantity: {
        color: theme.colors.text.secondary,
        fontSize: theme.fontSize.md,
    },
    expiryContainer: {
        height: 24,
        justifyContent: 'center',
    },
    expiryText: {
        fontSize: theme.fontSize.sm,
        fontWeight: '500',
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: theme.colors.background.primary,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.xl,
        width: '90%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: theme.fontSize.xl,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    modalSubtitle: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xl,
    },
    modalButtons: {
        gap: theme.spacing.md,
    },
    modalSectionTitle: {
        fontSize: theme.fontSize.md,
        fontWeight: '500',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    extendButtons: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.md,
    },
    extendButton: {
        flex: 1,
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
    },
    extendButtonText: {
        color: theme.colors.background.primary,
        fontSize: theme.fontSize.md,
        fontWeight: '600',
    },
    removeButton: {
        backgroundColor: theme.colors.status.error,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
    },
    removeButtonText: {
        color: 'white',
        fontSize: theme.fontSize.md,
        fontWeight: '600',
    },
    cancelButton: {
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: theme.colors.text.secondary,
        fontSize: theme.fontSize.md,
    },
});