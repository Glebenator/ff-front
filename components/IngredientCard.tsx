import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { theme } from '@/styles/theme';

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
    daysUntilExpiry,
    category,
    notes 
}: IngredientCardProps) {
    // Determine color based on expiry days
    const getExpiryColor = () => {
        if (daysUntilExpiry <= 0) return theme.colors.status.danger;  // Red for expired/today
        if (daysUntilExpiry <= 3) return theme.colors.status.warning;  // Orange for very soon
        if (daysUntilExpiry <= 7) return theme.colors.status.success;  // Green for within a week
        return '#63cf8b';  // Green for safe
    };

    const handlePress = () => {
        if (Platform.OS !== 'web') {
            router.push(`/edit-ingredient?id=${id}`);
        }
    };

    const getExpiryText = () => {
        if (daysUntilExpiry === 0) return 'Expires today';
        if (daysUntilExpiry === 1) return 'Expires tomorrow';
        if (daysUntilExpiry < 0) return `Expired ${Math.abs(daysUntilExpiry)} days ago`;
        return `${daysUntilExpiry} days left`;
    };

    return (
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
                    {Platform.OS !== 'web' && (
                        <Ionicons 
                            name="chevron-forward" 
                            size={20} 
                            color="rgb(180, 180, 180)" 
                        />
                    )}
                </View>

                <Text style={styles.category}>{category}</Text>
                <Text style={styles.quantity}>{quantity}</Text>
                {notes && <Text style={styles.notes} numberOfLines={1}>{notes}</Text>}

                <Text style={[styles.expiryText, { color: getExpiryColor() }]}>
                    {getExpiryText()}
                </Text>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.background.tertiary,
        borderRadius: 16,
        margin: 8,
        width: Platform.select({ 
            web: 'calc(20% - 16px)',  // 5 cards per row on web
            default: 160  // fixed width on mobile
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
        paddingLeft: theme.spacing.md,
        height: '100%',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
    },
    name: {
        color: theme.colors.text.primary,
        fontSize: theme.fontSize.lg,
        fontWeight: 'bold',
        flex: 1,
    },
    category: {
        color: theme.colors.text.tertiary,
        fontSize: theme.fontSize.sm,
        marginBottom: 2,
    },
    quantity: {
        color: theme.colors.text.secondary,
        fontSize: theme.fontSize.md,
        marginBottom: 2,
    },
    notes: {
        color: theme.colors.text.tertiary,
        fontSize: theme.fontSize.sm,
        fontStyle: 'italic',
        marginBottom: 2,
    },
    expiryText: {
        fontSize: theme.fontSize.sm,
        fontWeight: '500',
        position: 'absolute',
        bottom: theme.spacing.md,
        left: theme.spacing.md,
    },
});