// FridgeScreen.tsx
import { View, ScrollView, StyleSheet, Text, Pressable, Platform, Animated } from 'react-native';
import { useState, useCallback, useRef, useEffect } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import IngredientCard from '@/components/IngredientCard';
import SearchBar from '@/components/SearchBar';
import { ingredientDb, type Ingredient } from '@/services/database/ingredientDb';
import { WebFridge } from '@/components/WebFridge';
import { theme } from '@/styles/theme';
import { sharedStyles } from '@/styles/sharedStyles';
import SortModal from '@/components/sortModal';

type FilterType = 'all' | 'expiring-soon' | 'expired';
type SortType = 'expiry-asc' | 'expiry-desc' | 'name-asc' | 'name-desc' | 'date-added-newest' | 'date-added-oldest';

export default function FridgeScreen() {
    const { initialFilter } = useLocalSearchParams<{ initialFilter?: FilterType }>();
    const [filter, setFilter] = useState<FilterType>('all');
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string | null>('all');
    const [sortOrder, setSortOrder] = useState<SortType>('expiry-asc');
    const [isSortModalVisible, setIsSortModalVisible] = useState(false);
    const [isFiltersExpanded, setIsFiltersExpanded] = useState(false); // State for expanded/collapsed

    const animation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(animation, {
            toValue: isFiltersExpanded ? 1 : 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [isFiltersExpanded, animation]);

    useFocusEffect(
        useCallback(() => {
            if (!initialFilter) {
                setFilter('all');
            } else if (['all', 'expiring-soon', 'expired'].includes(initialFilter)) {
                setFilter(initialFilter as FilterType);
            }
            setSelectedCategory('all');
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

    const getCategories = useCallback(() => {
        const categories = new Set<string>();
        ingredients.forEach(ingredient => {
            if (ingredient.category) {
                categories.add(ingredient.category);
            }
        });
        return ['all', ...Array.from(categories)];
    }, [ingredients]);

  const filteredIngredients = useCallback(() => {
        const normalizedSearch = searchTerm.toLowerCase().trim();

        let filtered = ingredients.filter(ingredient => {
            const matchesSearch = normalizedSearch === '' ||
                ingredient.name.toLowerCase().includes(normalizedSearch) ||
                ingredient.category?.toLowerCase().includes(normalizedSearch) ||
                ingredient.notes?.toLowerCase().includes(normalizedSearch);

            const matchesCategory = selectedCategory === 'all' || ingredient.category === selectedCategory;

            // Apply filter based on expiry status
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const expiryDate = new Date(ingredient.expiryDate);

            switch (filter) {
                case 'expiring-soon':
                    const daysUntilExpiry = getDaysUntilExpiry(ingredient.expiryDate)
                    return matchesSearch && matchesCategory && daysUntilExpiry <= 5 && daysUntilExpiry >= 0;
                case 'expired':
                    return matchesSearch && matchesCategory && expiryDate < today;
                case 'all':
                default:
                    return matchesSearch && matchesCategory;
            }

        });

        switch (sortOrder) {
            case 'expiry-asc':
                filtered.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
                break;
            case 'expiry-desc':
                filtered.sort((a, b) => new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime());
                break;
            case 'name-asc':
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-desc':
                filtered.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'date-added-newest':
                filtered.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
                break;
            case 'date-added-oldest':
                filtered.sort((a, b) => new Date(a.dateAdded).getTime() - new Date(a.dateAdded).getTime());
                break;
        }
        return filtered;

    }, [ingredients, searchTerm, selectedCategory, sortOrder, filter]);

    const getSortIndicatorText = () => {
        switch (sortOrder) {
            case 'expiry-asc':
                return 'Expiry (Asc)';
            case 'expiry-desc':
                return 'Expiry (Desc)';
            case 'name-asc':
                return 'Name (A-Z)';
            case 'name-desc':
                return 'Name (Z-A)';
            case 'date-added-newest':
                return 'Date (Newest)';
            case 'date-added-oldest':
                return 'Date (Oldest)';
            default:
                return 'Unknown Sort Order';
        }
    };

    if (Platform.OS === 'web') {
        return <WebFridge />;
    }

    const EmptyState = () => (
        <View style={sharedStyles.emptyState}>
            <Ionicons name="nutrition-outline" size={64} color={theme.colors.primary} />
            <Text style={sharedStyles.emptyStateTitle}>Your fridge is empty!</Text>
            <Text style={sharedStyles.emptyStateText}>Start by adding your first ingredient using the + button below</Text>
        </View>
    );

    const NoResults = () => (
        <View style={sharedStyles.emptyState}>
            <Ionicons name="search-outline" size={64} color={theme.colors.primary} />
            <Text style={sharedStyles.emptyStateTitle}>
                {filter === 'expired' ? 'No expired items' : 'No expiring items'}
            </Text>
            <Text style={sharedStyles.emptyStateText}>
                {filter === 'expired'
                    ? 'You have no expired ingredients. Great job managing your fridge!'
                    : 'None of your ingredients are expiring soon. Great job keeping track!'}
            </Text>
             {/* Removed View all ingredients button */}
        </View>
    );

    const NoSearchResults = () => (
        <View style={sharedStyles.emptyState}>
            <Ionicons name="search-outline" size={64} color={theme.colors.primary} />
            <Text style={sharedStyles.emptyStateTitle}>No matching ingredients</Text>
            <Text style={sharedStyles.emptyStateText}>Try adjusting your search term</Text>
            {/* Removed the Clear search Button */}
        </View>
    );

    const heightInterpolate = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 220], // Adjust based on your content's height!
    });

    return (
        <View style={sharedStyles.container}>
            <View style={styles.filtersContainer}>
                <Pressable
                    style={styles.filtersButton}
                    onPress={() => setIsFiltersExpanded(!isFiltersExpanded)}
                >
                    <Text style={styles.filtersButtonText}>Filters</Text>
                    <Ionicons
                        name={isFiltersExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={theme.colors.text.primary}
                    />
                </Pressable>

                <Animated.View style={{ height: heightInterpolate, overflow: 'hidden' }}>
                    <>
                        {/* Expiry Date Filters */}
                        <View style={styles.expiryFilterContainer}>
                            <Pressable
                                style={[sharedStyles.filterButton, filter === 'all' && sharedStyles.filterButtonActive]}
                                onPress={() => setFilter('all')}
                            >
                                <Text
                                    style={[
                                        sharedStyles.filterButtonText,
                                        filter === 'all' && sharedStyles.filterButtonTextActive,
                                    ]}
                                >
                                    All Items
                                </Text>
                            </Pressable>
                            <Pressable
                                style={[
                                    sharedStyles.filterButton,
                                    filter === 'expiring-soon' && sharedStyles.filterButtonActive,
                                ]}
                                onPress={() => setFilter('expiring-soon')}
                            >
                                <Text
                                    style={[
                                        sharedStyles.filterButtonText,
                                        filter === 'expiring-soon' && sharedStyles.filterButtonTextActive,
                                    ]}
                                >
                                    Expiring Soon
                                </Text>
                            </Pressable>
                            <Pressable
                                style={[sharedStyles.filterButton, filter === 'expired' && sharedStyles.filterButtonActive]}
                                onPress={() => setFilter('expired')}
                            >
                                <Text
                                    style={[
                                        sharedStyles.filterButtonText,
                                        filter === 'expired' && sharedStyles.filterButtonTextActive,
                                    ]}
                                >
                                    Expired
                                </Text>
                            </Pressable>
                        </View>

                        {/* Separator Line */}
                        <View style={styles.filterSeparator} />
                         <Text style={styles.categoryLabel}>Category</Text>
                        {/* Category Filters */}
                        <View style={styles.categoryFilterContainer}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {getCategories().map(category => (
                                    <Pressable
                                        key={category}
                                        style={[
                                            sharedStyles.filterButton,
                                            selectedCategory === category && sharedStyles.filterButtonActive,
                                        ]}
                                        onPress={() => setSelectedCategory(category)}
                                    >
                                        <Text
                                            style={[
                                                sharedStyles.filterButtonText,
                                                selectedCategory === category && sharedStyles.filterButtonTextActive,
                                            ]}
                                        >
                                            {category === 'all' ? 'All' : category}
                                        </Text>
                                    </Pressable>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Separator Line */}
                        <View style={styles.filterSeparator} />

                        <SearchBar
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                            onClear={() => setSearchTerm('')}
                            sortIndicatorText={getSortIndicatorText()}
                            onSortPress={() => setIsSortModalVisible(true)}
                        />
                    </>
                </Animated.View>
            </View>

            {isLoading ? (
                <View style={sharedStyles.emptyState}>
                    <Text style={sharedStyles.emptyStateText}>Loading...</Text>
                </View>
            ) : ingredients.length === 0 ? (
                filter === 'all' ? <EmptyState /> : <NoResults />
            ) : filteredIngredients().length === 0 ? (
                <NoSearchResults />
            ) : (
                <ScrollView>
                    <View style={sharedStyles.grid}>
                       {filteredIngredients().map(ingredient => (
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
                                    setIngredients(prevIngredients => prevIngredients.filter(ing => ing.id !== deletedId));
                                }}
                                onUpdate={loadIngredients}
                            />
                        ))}
                    </View>
                </ScrollView>
            )}
             <SortModal
                visible={isSortModalVisible}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                onClose={() => setIsSortModalVisible(false)}
            />
            <Pressable style={sharedStyles.fab} onPress={() => router.push('/ingredient')}>
                <Ionicons name="add" size={32} color={theme.colors.background.primary} />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
     filtersContainer: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        backgroundColor: theme.colors.background.secondary,
        borderBottomLeftRadius: theme.borderRadius.md,
        borderBottomRightRadius: theme.borderRadius.md,
    },
    filtersButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.secondary, // Consistent background
    },
    filtersButtonText: {
        fontSize: theme.fontSize.md,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    expiryFilterContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        paddingVertical: theme.spacing.sm, // Consistent padding
    },
    categoryFilterContainer: {
        paddingVertical: theme.spacing.md, // Consistent padding
    },
    categoryLabel: {
        fontSize: theme.fontSize.lg,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
        paddingHorizontal: theme.spacing.md,
    },
    filterSeparator: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border.primary,
        marginHorizontal: theme.spacing.md,
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