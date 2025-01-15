import { View, ScrollView, StyleSheet, Text, Pressable, Platform } from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import IngredientCard from '@/components/IngredientCard';
import { ingredientDb, type Ingredient } from '@/services/database/ingredientDb';
import { theme } from '@/styles/theme';

type FilterType = 'all' | 'expiring-soon' | 'expired';

export default function FridgeScreen() {
    const [filter, setFilter] = useState<FilterType>('all');
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const loadIngredients = useCallback(() => {
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
                    // Get all ingredients and filter for expired ones
                    data = ingredientDb.getAll().filter(ingredient => {
                        const expiryDate = new Date(ingredient.expiryDate);
                        const today = new Date();
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
            if (Platform.OS !== 'web') {
                console.log('Loading ingredients on focus...');
                loadIngredients();
                const refreshInterval = setInterval(() => {
                    setRefreshTrigger(prev => prev + 1);
                }, 1000);
    
                return () => clearInterval(refreshInterval);
            } else {
                setIsLoading(false);
            }
        }, [loadIngredients])
    );

    useEffect(() => {
        if (Platform.OS !== 'web') {
            loadIngredients();
        }
    }, [refreshTrigger, filter]);

    const getDaysUntilExpiry = (expiryDate: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(expiryDate);
        expiry.setHours(0, 0, 0, 0);
        const diffTime = expiry.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    // Web platform message component
    const WebPlatformMessage = () => (
        <View style={styles.emptyStateContainer}>
            <Ionicons 
                name="phone-portrait-outline" 
                size={theme.fontSize.hero} 
                color={theme.colors.primary}
            />
            <Text style={styles.emptyStateTitle}>
                Mobile Only Feature
            </Text>
            <Text style={styles.emptyStateText}>
                The Fridge Friend app is currently available only on mobile devices.
                Please use our mobile app to access all features.
            </Text>
            <View style={styles.bulletPoints}>
                <Text style={styles.bulletPoint}>• Track your ingredients</Text>
                <Text style={styles.bulletPoint}>• Get expiry notifications</Text>
                <Text style={styles.bulletPoint}>• Manage your fridge efficiently</Text>
            </View>
        </View>
    );

    // Empty state component
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

    // No results state component
    const NoResultsState = () => (
        <View style={styles.emptyStateContainer}>
            <Ionicons 
                name="search-outline" 
                size={64} 
                color="rgb(99, 207, 139)"
            />
            <Text style={styles.emptyStateTitle}>
                {filter === 'expired' ? 'No expired items' : 'No expiring items'}
            </Text>
            <Text style={styles.emptyStateText}>
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

    // If we're on web platform, show the mobile-only message
    if (Platform.OS === 'web') {
        return (
            <View style={styles.container}>
                <WebPlatformMessage />
            </View>
        );
    }

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
                        <Pressable 
                            style={[styles.filterButton, filter === 'expired' && styles.activeFilter]}
                            onPress={() => setFilter('expired')}
                        >
                            <Text style={[
                                styles.filterText,
                                filter === 'expired' && styles.activeFilterText
                            ]}>
                                Expired
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
                filter === 'all' ? <EmptyState /> : <NoResultsState />
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.grid}>
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
                            />
                        ))}
                    </View>
                </ScrollView>
            )}

            <Pressable 
                style={styles.addButton}
                onPress={() => router.push('/add-ingredient')}
            >
                <Ionicons name="add" size={32} color="rgb(36, 32, 28)" />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    header: {
        padding: theme.spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border.primary,
    },
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: theme.spacing.sm,
    },
    filterButton: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        backgroundColor: theme.colors.background.secondary,
    },
    activeFilter: {
        backgroundColor: theme.colors.primary,
    },
    filterText: {
        color: theme.colors.text.primary,
        fontSize: theme.fontSize.md,
    },
    activeFilterText: {
        color: theme.colors.background.primary,
        fontWeight: '600',
    },
    scrollContent: {
        flexGrow: 1,
        padding: theme.spacing.sm,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        maxWidth: Platform.select({ web: 1200, default: '100%' }),
        alignSelf: 'center',
        width: '100%',
        paddingHorizontal: Platform.OS === 'web' ? theme.spacing.md : theme.spacing.sm,
    },
    addButton: {
        position: 'absolute',
        right: theme.spacing.xl,
        bottom: theme.spacing.xl,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: theme.colors.primary,
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
        padding: theme.spacing.xl,
    },
    emptyStateTitle: {
        fontSize: theme.fontSize.xxl,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.sm,
    },
    emptyStateText: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
        maxWidth: 400,
    },
    bulletPoints: {
        alignItems: 'flex-start',
        marginTop: theme.spacing.md,
    },
    bulletPoint: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text.secondary,
        marginVertical: theme.spacing.xs,
    },
    viewAllButton: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.xl,
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.lg,
    },
    viewAllButtonText: {
        color: theme.colors.background.primary,
        fontSize: theme.fontSize.md,
        fontWeight: '600',
    },
});