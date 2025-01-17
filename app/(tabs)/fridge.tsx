import { View, ScrollView, StyleSheet, Text, Pressable, Platform } from 'react-native';
import { useState, useCallback } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import IngredientCard from '@/components/IngredientCard';
import { ingredientDb, type Ingredient } from '@/services/database/ingredientDb';
import { WebFridge } from '@/components/WebFridge';
import { theme } from '@/styles/theme';
import { sharedStyles } from '@/styles/sharedStyles';

type FilterType = 'all' | 'expiring-soon' | 'expired';

export default function FridgeScreen() {
    const { initialFilter } = useLocalSearchParams<{ initialFilter?: FilterType }>();
    const [filter, setFilter] = useState<FilterType>('all');
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Set initial filter if provided
    useFocusEffect(
        useCallback(() => {
            if (!initialFilter) {
                setFilter('all');
            } else if (['all', 'expiring-soon', 'expired'].includes(initialFilter)) {
                setFilter(initialFilter as FilterType);
            }
        }, [initialFilter])
    );

    const loadIngredients = useCallback(() => {
        if (Platform.OS === 'web') {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            let data: Ingredient[] = [];
            
            switch (filter) {
                case 'all':
                    data = ingredientDb.getAll();
                    break;
                case 'expiring-soon':
                    data = ingredientDb.getExpiringSoon(5);
                    break;
                case 'expired':
                    data = ingredientDb.getAll().filter(ingredient => {
                        const expiryDate = new Date(ingredient.expiryDate);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return expiryDate < today;
                    });
                    break;
            }
            
            setIngredients(data);
        } catch (error) {
            console.error('Failed to load ingredients:', error);
        } finally {
            setIsLoading(false);
        }
    }, [filter]);

    useFocusEffect(
        useCallback(() => {
            if (Platform.OS === 'web') return;
            loadIngredients();
        }, [loadIngredients])
    );

    const getDaysUntilExpiry = (expiryDate: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(expiryDate);
        expiry.setHours(0, 0, 0, 0);
        const diffTime = expiry.getTime() - today.getTime();
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    };

    // If we're on web platform, show the mobile-only message
    if (Platform.OS === 'web') {
        return <WebFridge />;
    }

    const EmptyState = () => (
        <View style={sharedStyles.emptyState}>
            <Ionicons 
                name="nutrition-outline" 
                size={64} 
                color={theme.colors.primary}
            />
            <Text style={sharedStyles.emptyStateTitle}>
                Your fridge is empty!
            </Text>
            <Text style={sharedStyles.emptyStateText}>
                Start by adding your first ingredient using the + button below
            </Text>
        </View>
    );

    const NoResults = () => (
        <View style={sharedStyles.emptyState}>
            <Ionicons 
                name="search-outline" 
                size={64} 
                color={theme.colors.primary}
            />
            <Text style={sharedStyles.emptyStateTitle}>
                {filter === 'expired' ? 'No expired items' : 'No expiring items'}
            </Text>
            <Text style={sharedStyles.emptyStateText}>
                {filter === 'expired' 
                    ? 'You have no expired ingredients. Great job managing your fridge!'
                    : 'None of your ingredients are expiring soon. Great job keeping track!'}
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
        <View style={sharedStyles.container}>
            {ingredients.length > 0 && (
                <View style={styles.header}>
                    <View style={sharedStyles.filterContainer}>
                        <Pressable 
                            style={[
                                sharedStyles.filterButton,
                                filter === 'all' && sharedStyles.filterButtonActive
                            ]}
                            onPress={() => setFilter('all')}
                        >
                            <Text style={[
                                sharedStyles.filterButtonText,
                                filter === 'all' && sharedStyles.filterButtonTextActive
                            ]}>
                                All Items
                            </Text>
                        </Pressable>
                        <Pressable 
                            style={[
                                sharedStyles.filterButton,
                                filter === 'expiring-soon' && sharedStyles.filterButtonActive
                            ]}
                            onPress={() => setFilter('expiring-soon')}
                        >
                            <Text style={[
                                sharedStyles.filterButtonText,
                                filter === 'expiring-soon' && sharedStyles.filterButtonTextActive
                            ]}>
                                Expiring Soon
                            </Text>
                        </Pressable>
                        <Pressable 
                            style={[
                                sharedStyles.filterButton,
                                filter === 'expired' && sharedStyles.filterButtonActive
                            ]}
                            onPress={() => setFilter('expired')}
                        >
                            <Text style={[
                                sharedStyles.filterButtonText,
                                filter === 'expired' && sharedStyles.filterButtonTextActive
                            ]}>
                                Expired
                            </Text>
                        </Pressable>
                    </View>
                </View>
            )}

            {isLoading ? (
                <View style={sharedStyles.emptyState}>
                    <Text style={sharedStyles.emptyStateText}>Loading...</Text>
                </View>
            ) : ingredients.length === 0 ? (
                filter === 'all' ? <EmptyState /> : <NoResults />
            ) : (
                <ScrollView>
                    <View style={sharedStyles.grid}>
                        {ingredients.map(ingredient => (
                            <IngredientCard
                                key={ingredient.id}
                                id={ingredient.id!}
                                name={ingredient.name}
                                quantity={ingredient.quantity}
                                expiryDate={ingredient.expiryDate}
                                daysUntilExpiry={getDaysUntilExpiry(ingredient.expiryDate)}
                                category={ingredient.category}
                                notes={ingredient.notes}
                                onDelete={(deletedId) => {
                                    setIngredients(prevIngredients => 
                                        prevIngredients.filter(ing => ing.id !== deletedId)
                                    );
                                }}
                            />
                        ))}
                    </View>
                </ScrollView>
            )}

            <Pressable 
                style={sharedStyles.fab}
                onPress={() => router.push('/ingredient')}
            >
                <Ionicons name="add" size={32} color={theme.colors.background.primary} />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        padding: theme.spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border.primary,
    },
    viewAllButton: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.xl,
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.lg,
        marginTop: theme.spacing.md,
    },
    viewAllButtonText: {
        color: theme.colors.background.primary,
        fontSize: theme.fontSize.md,
        fontWeight: '600',
    },
});