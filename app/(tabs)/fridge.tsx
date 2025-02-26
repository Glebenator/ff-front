import { View, ScrollView, StyleSheet, Pressable, Platform } from 'react-native';
import { useState, useCallback } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import IngredientCard from '@/components/IngredientCard';
import { ingredientDb } from '@/services/database/ingredientDb';
import { WebFridge } from '@/components/WebFridge';
import { theme } from '@/styles/theme';
import { sharedStyles } from '@/styles/sharedStyles';
import SortModal from '@/components/sortModal';
import { type Ingredient, type FilterType, type SortType } from '@/types/types';
import { EmptyFridge, NoFilteredResults, NoSearchResults, LoadingState } from '@/components/fridge/EmptyStates';
import FiltersSection from '@/components/fridge/FiltersSection';

export default function FridgeScreen() {
    const { initialFilter } = useLocalSearchParams<{ initialFilter?: FilterType }>();
    const [filter, setFilter] = useState<FilterType>('all');
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string | null>('all');
    const [sortOrder, setSortOrder] = useState<SortType>('expiry-asc');
    const [isSortModalVisible, setIsSortModalVisible] = useState(false);

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
                filtered.sort((a, b) => new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime());
                break;
        }
        return filtered;
    }, [ingredients, searchTerm, selectedCategory, sortOrder, filter]);

    if (Platform.OS === 'web') {
        return <WebFridge />;
    }

    return (
        <View style={sharedStyles.container}>
            <FiltersSection
                filter={filter}
                setFilter={setFilter}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                categories={getCategories()}
                sortOrder={sortOrder}
                onSortPress={() => setIsSortModalVisible(true)}
            />

            {isLoading ? (
                <LoadingState />
            ) : ingredients.length === 0 ? (
                filter === 'all' ? <EmptyFridge /> : <NoFilteredResults filter={filter as 'expired' | 'expiring-soon'} />
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