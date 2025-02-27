// app/ingredient.tsx
import { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Platform, Pressable, Alert, StyleSheet } from 'react-native'; // Import StyleSheet
import { Stack, router, useLocalSearchParams } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { ingredientDb } from '@/services/database/ingredientDb';
import { Ingredient } from '@/types/types'; // Import Ingredient type
import { theme } from '@/styles/theme';
import { sharedStyles } from '@/styles/sharedStyles';
import { sessionManager } from '@/services/sessionManager'; // Import sessionManager

type FormData = {
    name: string;
    quantity: string;
    category: string;
    notes: string;
    expiryDate: Date;
    debugDate?: string; // Only used in development mode for editing
};

export default function IngredientFormScreen() {
    const { id } = useLocalSearchParams();
    const isEditing = Boolean(id);
    const [ingredient, setIngredient] = useState<Ingredient | null>(null);
    const [formData, setFormData] = useState<FormData>({
        name: '',
        quantity: '',
        category: '',
        notes: '',
        expiryDate: new Date(),
    });
    const [showDatePicker, setShowDatePicker] = useState(Platform.OS === 'ios');
    const categories = sessionManager.getAvailableCategories(); // Get categories from sessionManager

    // Load ingredient data when editing
    useEffect(() => {
        if (!isEditing || Platform.OS === 'web') return;

        try {
            const data = ingredientDb.getById(Number(id));
            if (data) {
                setIngredient(data);
                const expDate = new Date(data.expiryDate);
                setFormData({
                    name: data.name,
                    quantity: data.quantity,
                    category: data.category || '',
                    notes: data.notes || '',
                    expiryDate: expDate,
                    debugDate: data.expiryDate
                });
            }
        } catch (error) {
            console.error('Error loading ingredient:', error);
            Alert.alert('Error', 'Failed to load ingredient details');
            router.back();
        }
    }, [id, isEditing]);

    const handleSubmit = useCallback(async () => {
        // Validate required fields
        if (!formData.name?.trim() || !formData.quantity?.trim()) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        try {
            // Use debug date if in dev mode and editing
            const finalExpiryDate = __DEV__ && isEditing && formData.debugDate
                ? formData.debugDate
                : formData.expiryDate.toISOString().split('T')[0];

            // Create the ingredient data object
            const ingredientData = {
                name: formData.name.trim(),
                quantity: formData.quantity.trim(),
                expiryDate: finalExpiryDate,
                category: formData.category?.trim() || undefined,
                notes: formData.notes?.trim() || undefined
            };

            if (isEditing && id) {
                await ingredientDb.update(Number(id), ingredientData);
            } else {
                await ingredientDb.add(ingredientData);
            }

            router.back();
        } catch (error) {
            console.error('Error in submit:', error);
            Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'add'} ingredient`);
        }
    }, [formData, isEditing, id]);

    const handleDelete = useCallback(() => {
        if (!isEditing || !id) return;

        Alert.alert(
            'Delete Ingredient',
            'Are you sure you want to delete this ingredient?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await ingredientDb.delete(Number(id));
                            router.back();
                        } catch (error) {
                            console.error('Error deleting:', error);
                            Alert.alert('Error', 'Failed to delete ingredient');
                        }
                    }
                }
            ]
        );
    }, [id, isEditing]);

    const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }

        if (selectedDate) {
            setFormData(prev => ({
                ...prev,
                expiryDate: selectedDate,
                debugDate: selectedDate.toISOString().split('T')[0]
            }));
        }
    };

    const handleDebugDateChange = (text: string) => {
        setFormData(prev => ({
            ...prev,
            debugDate: text,
            expiryDate: isNaN(Date.parse(text)) ? prev.expiryDate : new Date(text)
        }));
    };

    const updateField = (field: keyof FormData, value: string | Date) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (Platform.OS === 'web') {
        return (
            <View style={sharedStyles.container}>
                <View style={sharedStyles.emptyState}>
                    <Text style={sharedStyles.bodyText}>
                        This feature is not available on web platform
                    </Text>
                </View>
            </View>
        );
    }

    if (isEditing && !ingredient) {
        return (
            <View style={sharedStyles.container}>
                <View style={sharedStyles.emptyState}>
                    <Text style={sharedStyles.bodyText}>Loading...</Text>
                </View>
            </View>
        );
    }

    const formatDate = (date: Date) => {
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <>
            <Stack.Screen
                options={{
                    title: isEditing ? 'Edit Ingredient' : 'Add Ingredient',
                    headerTintColor: theme.colors.text.primary,
                    headerStyle: {
                        backgroundColor: theme.colors.background.primary,
                    },
                }}
            />
            <View style={sharedStyles.container}>
                <ScrollView contentContainerStyle={sharedStyles.form}>
                    <View style={sharedStyles.formContent}>
                    {/* Name Input */}
                    <View style={sharedStyles.inputGroup}>
                        <Text style={sharedStyles.label}>Name *</Text>
                        <TextInput
                            style={sharedStyles.input}
                            value={formData.name}
                            onChangeText={(text) => updateField('name', text)}
                            placeholder="Enter ingredient name"
                            placeholderTextColor={theme.colors.text.secondary}
                        />
                    </View>

                    {/* Quantity Input */}
                    <View style={sharedStyles.inputGroup}>
                        <Text style={sharedStyles.label}>Quantity *</Text>
                        <TextInput
                            style={sharedStyles.input}
                            value={formData.quantity}
                            onChangeText={(text) => updateField('quantity', text)}
                            placeholder="Enter quantity (e.g., 500g, 2 pieces)"
                            placeholderTextColor={theme.colors.text.secondary}
                        />
                    </View>

                    {/* Category Input - Buttons */}
                    <View style={sharedStyles.inputGroup}>
                        <Text style={sharedStyles.label}>Category</Text>
                        <View style={styles.categoryButtons}>
                            {categories.map(category => (
                                <Pressable
                                    key={category}
                                    style={[
                                        styles.categoryButton,
                                        formData.category === category && styles.categoryButtonActive
                                    ]}
                                    onPress={() => updateField('category', category)}
                                >
                                    <Text style={[
                                        styles.categoryButtonText,
                                        formData.category === category && styles.categoryButtonTextActive
                                    ]}>
                                        {category}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {/* Debug Date Input - Development Mode Only */}
                    {__DEV__ && isEditing && (
                        <View style={sharedStyles.inputGroup}>
                            <Text style={sharedStyles.label}>Debug: Manual Date (YYYY-MM-DD) *</Text>
                            <TextInput
                                style={sharedStyles.input}
                                value={formData.debugDate}
                                onChangeText={handleDebugDateChange}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={theme.colors.text.secondary}
                            />
                        </View>
                    )}

                    {/* Date Picker */}
                    <View style={sharedStyles.inputGroup}>
                        <Text style={sharedStyles.label}>Expiry Date *</Text>
                        {Platform.OS === 'ios' ? (
                            <View style={sharedStyles.datePickerIOS}>
                                <DateTimePicker
                                    value={formData.expiryDate}
                                    mode="date"
                                    display="spinner"
                                    onChange={handleDateChange}
                                    minimumDate={!isEditing ? new Date() : undefined}
                                    textColor={theme.colors.text.primary}
                                    themeVariant="dark"
                                />
                            </View>
                        ) : (
                            <>
                                <Pressable
                                    style={sharedStyles.dateButton}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Text style={sharedStyles.dateButtonText}>
                                        {formatDate(formData.expiryDate)}
                                    </Text>
                                    <Ionicons
                                        name="calendar-outline"
                                        size={24}
                                        color={theme.colors.primary}
                                    />
                                </Pressable>

                                {showDatePicker && (
                                    <DateTimePicker
                                        value={formData.expiryDate}
                                        mode="date"
                                        display="default"
                                        onChange={handleDateChange}
                                        minimumDate={!isEditing ? new Date() : undefined}
                                    />
                                )}
                            </>
                        )}
                    </View>

                    {/* Notes Input */}
                    <View style={sharedStyles.inputGroup}>
                        <Text style={sharedStyles.label}>Notes</Text>
                        <TextInput
                            style={[sharedStyles.input, sharedStyles.textArea]}
                            value={formData.notes}
                            onChangeText={(text) => updateField('notes', text)}
                            placeholder="Add any additional notes (optional)"
                            placeholderTextColor={theme.colors.text.secondary}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>

                    </View>
                    {/* Action Buttons */}
                    <View style={sharedStyles.formActions}>
                        {isEditing ? (
                            <View style={sharedStyles.buttonContainer}>
                                <Pressable
                                    style={[sharedStyles.button, { backgroundColor: theme.colors.status.error }]}
                                    onPress={handleDelete}
                                >
                                    <Ionicons name="trash-outline" size={24} color="white" />
                                    <Text style={[sharedStyles.buttonText, { color: 'white' }]}>
                                        Delete
                                    </Text>
                                </Pressable>
                                <Pressable
                                    style={[sharedStyles.button, { flex: 1 }]}
                                    onPress={handleSubmit}
                                >
                                    <Text style={sharedStyles.buttonText}>Save Changes</Text>
                                </Pressable>
                            </View>
                        ) : (
                            <Pressable
                                style={[sharedStyles.button, { width: '100%' }]}
                                onPress={handleSubmit}
                            >
                                <Text style={sharedStyles.buttonText}>Add Ingredient</Text>
                            </Pressable>
                        )}
                    </View>
                </ScrollView>
            </View>
        </>
    );
}


const styles = StyleSheet.create({
    categoryButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },
    categoryButton: {
        backgroundColor: theme.colors.background.secondary,
        padding: theme.spacing.sm,
        borderRadius: theme.borderRadius.md,
    },
    categoryButtonActive: {
        backgroundColor: theme.colors.primary,
    },
    categoryButtonText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.primary,
    },
    categoryButtonTextActive: {
        color: theme.colors.background.primary,
        fontWeight: '600',
    },
});