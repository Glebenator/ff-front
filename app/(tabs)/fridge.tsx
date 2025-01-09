import { View, ScrollView, StyleSheet, Text, Pressable, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import IngredientCard from '@/components/IngredientCard';
import { ingredientDb, type Ingredient } from '@/services/database/ingredientDb';

export default function FridgeScreen() {
    const [filter, setFilter] = useState<'all' | 'expiring-soon'>('all');
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadIngredients();
    }, [filter]);

    const loadIngredients = () => {
        try {
            setIsLoading(true);
            const data = filter === 'all' 
                ? ingredientDb.getAll()
                : ingredientDb.getExpiringSoon(5);
            setIngredients(data);
        } catch (error) {
            console.error('Failed to load ingredients:', error);
            // You might want to show an error message to the user here
        } finally {
            setIsLoading(false);
        }
    };

    const getDaysUntilExpiry = (expiryDate: string) => {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const EmptyState = () => (
        <View style={styles.emptyStateContainer}>
            <Ionicons 
                name="nutrition-outline" 
                size={64} 
                color="rgb(99, 207, 139)"
            />
            <Text style={styles.emptyStateTitle}>
                Your fridge is empty!
            </Text>
            <Text style={styles.emptyStateText}>
                Start by adding your first ingredient using the + button below
            </Text>
        </View>
    );

    const NoResultsState = () => (
        <View style={styles.emptyStateContainer}>
            <Ionicons 
                name="search-outline" 
                size={64} 
                color="rgb(99, 207, 139)"
            />
            <Text style={styles.emptyStateTitle}>
                No expiring items
            </Text>
            <Text style={styles.emptyStateText}>
                None of your ingredients are expiring soon. Great job keeping track!
            </Text>
            <Pressable 
                style={styles.viewAllButton}
                onPress={() => setFilter('all')}
            >
                <Text style={styles.viewAllButtonText}>View all ingredients</Text>
            </Pressable>
        </View>
    );

    return (
        <View style={styles.container}>
            {ingredients.length > 0 && (
                <View style={styles.header}>
                    <View style={styles.filterContainer}>
                        <Pressable 
                            style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
                            onPress={() => setFilter('all')}
                        >
                            <Text style={[
                                styles.filterText,
                                filter === 'all' && styles.activeFilterText
                            ]}>
                                All Items
                            </Text>
                        </Pressable>
                        <Pressable 
                            style={[styles.filterButton, filter === 'expiring-soon' && styles.activeFilter]}
                            onPress={() => setFilter('expiring-soon')}
                        >
                            <Text style={[
                                styles.filterText,
                                filter === 'expiring-soon' && styles.activeFilterText
                            ]}>
                                Expiring Soon
                            </Text>
                        </Pressable>
                    </View>
                </View>
            )}

            {isLoading ? (
                <View style={styles.emptyStateContainer}>
                    <Text style={styles.emptyStateText}>Loading...</Text>
                </View>
            ) : ingredients.length === 0 ? (
                filter === 'expiring-soon' ? <NoResultsState /> : <EmptyState />
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.grid}>
                        {ingredients.map(ingredient => (
                            <IngredientCard
                                key={ingredient.id}
                                name={ingredient.name}
                                quantity={ingredient.quantity}
                                expiryDate={ingredient.expiryDate}
                                daysUntilExpiry={getDaysUntilExpiry(ingredient.expiryDate)}
                            />
                        ))}
                    </View>
                </ScrollView>
            )}

            <Pressable 
                style={styles.addButton}
                onPress={() => {
                    // TODO: Navigate to Add Ingredient screen
                    console.log('Navigate to add ingredient screen');
                }}
            >
                <Ionicons name="add" size={32} color="rgb(36, 32, 28)" />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgb(36, 32, 28)',
    },
    header: {
        padding: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgb(60, 56, 52)',
    },
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
    },
    filterButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: 'rgb(48, 44, 40)',
    },
    activeFilter: {
        backgroundColor: 'rgb(99, 207, 139)',
    },
    filterText: {
        color: 'rgb(247, 233, 233)',
        fontSize: 16,
    },
    activeFilterText: {
        color: 'rgb(36, 32, 28)',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 8,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        maxWidth: Platform.select({ web: 1200, default: '100%' }),
        alignSelf: 'center',
        width: '100%',
        paddingHorizontal: Platform.OS === 'web' ? 16 : 8,
    },
    addButton: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgb(99, 207, 139)',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyStateTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'rgb(247, 233, 233)',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 16,
        color: 'rgb(180, 180, 180)',
        textAlign: 'center',
        marginBottom: 24,
    },
    viewAllButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: 'rgb(99, 207, 139)',
        borderRadius: 25,
    },
    viewAllButtonText: {
        color: 'rgb(36, 32, 28)',
        fontSize: 16,
        fontWeight: '600',
    },
});