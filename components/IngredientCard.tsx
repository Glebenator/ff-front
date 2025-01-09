import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type IngredientCardProps = {
    name: string;
    quantity: string;
    expiryDate: string;
    daysUntilExpiry: number;
};

export default function IngredientCard({ name, quantity, expiryDate, daysUntilExpiry }: IngredientCardProps) {
    // Determine color based on expiry days
    const getExpiryColor = () => {
        if (daysUntilExpiry <= 2) return '#ff4444';  // Red for close to expiry
        if (daysUntilExpiry <= 5) return '#ffaa33';  // Orange for warning
        return '#63cf8b';  // Green for safe
    };

    return (
        <Pressable 
            style={styles.card}
            onPress={() => {/* Handle press */}}
        >
            <View style={[styles.expiryIndicator, { backgroundColor: getExpiryColor() }]} />
            <View style={styles.content}>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.quantity}>{quantity}</Text>
                <View style={styles.expiryContainer}>
                    <Ionicons name="time-outline" size={16} color="rgb(247, 233, 233)" />
                    <Text style={styles.expiryDate}>{expiryDate}</Text>
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'rgb(48, 44, 40)',
        borderRadius: 15,
        margin: 8,
        width: Platform.select({ 
            web: 'calc(20% - 16px)',  // 5 cards per row on web, accounting for margins
            default: 160  // fixed width on mobile
        }),
        minWidth: 160, // ensures cards don't get too small
        height: 140,
        overflow: 'hidden',
        position: 'relative',
    },
    expiryIndicator: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 4,
        height: '100%',
    },
    content: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    name: {
        color: 'rgb(247, 233, 233)',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    quantity: {
        color: 'rgb(180, 180, 180)',
        fontSize: 16,
    },
    expiryContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    expiryDate: {
        color: 'rgb(247, 233, 233)',
        marginLeft: 4,
        fontSize: 14,
    },
});