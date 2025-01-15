// app/edit-ingredient.tsx
import { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Platform, Pressable, Alert } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { ingredientDb, type Ingredient } from '@/services/database/ingredientDb';
import { theme } from '@/styles/theme';

export default function EditIngredientScreen() {
    const { id } = useLocalSearchParams();
    const [ingredient, setIngredient] = useState<Ingredient | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        quantity: '',
        category: '',
        notes: '',
        expiryDate: new Date(),
        debugDate: '' // Added for debug purposes
    });
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Load ingredient data
    useEffect(() => {
        if (!id || Platform.OS === 'web') return;
        
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
                    debugDate: data.expiryDate // Store the raw date string
                });
            }
        } catch (error) {
            console.error('Error loading ingredient:', error);
            Alert.alert('Error', 'Failed to load ingredient details');
            router.back();
        }
    }, [id]);

    const handleSave = useCallback(async () => {
        if (!id || !ingredient) return;
        
        // Validate required fields
        if (!formData.name?.trim() || !formData.quantity?.trim()) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        try {
            // Use debug date if in dev mode and it's set
            const finalExpiryDate = __DEV__ && formData.debugDate 
                ? formData.debugDate 
                : formData.expiryDate.toISOString().split('T')[0];

            // Create the ingredient data object
            const updates = {
                name: formData.name.trim(),
                quantity: formData.quantity.trim(),
                expiryDate: finalExpiryDate,
                category: formData.category?.trim() || null,
                notes: formData.notes?.trim() || null
            };

            // Update in database
            await ingredientDb.update(Number(id), updates);
            router.back();
        } catch (error) {
            console.error('Error in save:', error);
            Alert.alert('Error', 'Failed to update ingredient');
        }
    }, [id, ingredient, formData]);

    const handleDelete = useCallback(() => {
        if (!id) return;

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
    }, [id]);

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
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
            // Only update the date object if the input is a valid date
            expiryDate: isNaN(Date.parse(text)) ? prev.expiryDate : new Date(text)
        }));
    };

    const updateField = (field: string, value: string | Date) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (Platform.OS === 'web') {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>Editing is not available on web platform</Text>
            </View>
        );
    }

    if (!ingredient) {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>Loading...</Text>
            </View>
        );
    }

    return (
        <>
            <Stack.Screen 
                options={{
                    title: 'Edit Ingredient',
                    headerTintColor: theme.colors.text.primary,
                    headerStyle: {
                        backgroundColor: theme.colors.background.primary,
                    },
                }}
            />
            <ScrollView style={styles.container}>
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Name *</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.name}
                            onChangeText={(text) => updateField('name', text)}
                            placeholder="Enter ingredient name"
                            placeholderTextColor={theme.colors.text.secondary}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Quantity *</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.quantity}
                            onChangeText={(text) => updateField('quantity', text)}
                            placeholder="Enter quantity (e.g., 500g, 2 pieces)"
                            placeholderTextColor={theme.colors.text.secondary}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Category</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.category}
                            onChangeText={(text) => updateField('category', text)}
                            placeholder="Enter category (optional)"
                            placeholderTextColor={theme.colors.text.secondary}
                        />
                    </View>

                    {/* Debug date input - only visible in development */}
                    {__DEV__ && (
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Debug: Manual Date (YYYY-MM-DD) *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.debugDate}
                                onChangeText={handleDebugDateChange}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={theme.colors.text.secondary}
                            />
                        </View>
                    )}

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Expiry Date *</Text>
                        {Platform.OS === 'ios' ? (
                            <DateTimePicker
                                value={formData.expiryDate}
                                mode="date"
                                display="spinner"
                                onChange={handleDateChange}
                                style={styles.datePickerIOS}
                            />
                        ) : (
                            <>
                                <Pressable
                                    style={styles.dateButton}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Text style={styles.dateButtonText}>
                                        {formData.expiryDate.toLocaleDateString()}
                                    </Text>
                                    <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
                                </Pressable>

                                {showDatePicker && (
                                    <DateTimePicker
                                        value={formData.expiryDate}
                                        mode="date"
                                        display="default"
                                        onChange={handleDateChange}
                                    />
                                )}
                            </>
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Notes</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={formData.notes}
                            onChangeText={(text) => updateField('notes', text)}
                            placeholder="Add any additional notes (optional)"
                            placeholderTextColor={theme.colors.text.secondary}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>

                    <View style={styles.buttonContainer}>
                        <Pressable 
                            style={styles.deleteButton}
                            onPress={handleDelete}
                        >
                            <Ionicons name="trash-outline" size={24} color="white" />
                            <Text style={styles.deleteButtonText}>Delete</Text>
                        </Pressable>

                        <Pressable 
                            style={styles.saveButton}
                            onPress={handleSave}
                        >
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        </Pressable>
                    </View>
                </View>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    form: {
        padding: theme.spacing.md,
        gap: theme.spacing.md,
    },
    inputGroup: {
        gap: theme.spacing.sm,
    },
    label: {
        fontSize: theme.fontSize.md,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    input: {
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        fontSize: theme.fontSize.md,
        color: theme.colors.text.primary,
    },
    textArea: {
        minHeight: 100,
    },
    datePickerIOS: {
        height: 120,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.borderRadius.md,
    },
    dateButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
    },
    dateButtonText: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text.primary,
    },
    text: {
        color: theme.colors.text.primary,
        fontSize: theme.fontSize.md,
        textAlign: 'center',
        padding: theme.spacing.xl,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.md,
    },
    saveButton: {
        flex: 1,
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: theme.fontSize.lg,
        fontWeight: '600',
        color: theme.colors.background.primary,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        backgroundColor: theme.colors.status.error,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
    },
    deleteButtonText: {
        fontSize: theme.fontSize.lg,
        fontWeight: '600',
        color: 'white',
    },
});