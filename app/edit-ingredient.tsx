// app/edit-ingredient.tsx
import { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Platform, Pressable, Alert } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { ingredientDb, type Ingredient } from '@/services/database/ingredientDb';

export default function EditIngredientScreen() {
    const { id } = useLocalSearchParams();
    const [ingredient, setIngredient] = useState<Ingredient | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        quantity: '',
        category: '',
        notes: '',
        expiryDate: new Date()
    });
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Load ingredient data
    useEffect(() => {
        if (!id || Platform.OS === 'web') return;
        
        try {
            const data = ingredientDb.getById(Number(id));
            if (data) {
                setIngredient(data);
                setFormData({
                    name: data.name,
                    quantity: data.quantity,
                    category: data.category || '',
                    notes: data.notes || '',
                    expiryDate: new Date(data.expiryDate)
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
            // Create the ingredient data object
            const updates = {
                name: formData.name.trim(),
                quantity: formData.quantity.trim(),
                expiryDate: formData.expiryDate.toISOString().split('T')[0],
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
            setFormData(prev => ({ ...prev, expiryDate: selectedDate }));
        }
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
                    headerTintColor: 'rgb(247, 233, 233)',
                    headerStyle: {
                        backgroundColor: 'rgb(36, 32, 28)',
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
                            placeholderTextColor="rgb(180, 180, 180)"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Quantity *</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.quantity}
                            onChangeText={(text) => updateField('quantity', text)}
                            placeholder="Enter quantity (e.g., 500g, 2 pieces)"
                            placeholderTextColor="rgb(180, 180, 180)"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Category</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.category}
                            onChangeText={(text) => updateField('category', text)}
                            placeholder="Enter category (optional)"
                            placeholderTextColor="rgb(180, 180, 180)"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Expiry Date *</Text>
                        {Platform.OS === 'ios' ? (
                            <DateTimePicker
                                value={formData.expiryDate}
                                mode="date"
                                display="spinner"
                                onChange={handleDateChange}
                                minimumDate={new Date()}
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
                                    <Ionicons name="calendar-outline" size={24} color="rgb(99, 207, 139)" />
                                </Pressable>

                                {showDatePicker && (
                                    <DateTimePicker
                                        value={formData.expiryDate}
                                        mode="date"
                                        display="default"
                                        onChange={handleDateChange}
                                        minimumDate={new Date()}
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
                            placeholderTextColor="rgb(180, 180, 180)"
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
                            <Ionicons name="trash-outline" size={24} color="rgb(247, 233, 233)" />
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
        backgroundColor: 'rgb(36, 32, 28)',
    },
    form: {
        padding: 16,
        gap: 16,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: 'rgb(247, 233, 233)',
    },
    input: {
        backgroundColor: 'rgb(48, 44, 40)',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: 'rgb(247, 233, 233)',
    },
    textArea: {
        minHeight: 100,
    },
    datePickerIOS: {
        height: 120,
        backgroundColor: 'rgb(48, 44, 40)',
        borderRadius: 8,
    },
    dateButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgb(48, 44, 40)',
        borderRadius: 8,
        padding: 12,
    },
    dateButtonText: {
        fontSize: 16,
        color: 'rgb(247, 233, 233)',
    },
    text: {
        color: 'rgb(247, 233, 233)',
        fontSize: 16,
        textAlign: 'center',
        padding: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    saveButton: {
        flex: 1,
        backgroundColor: 'rgb(99, 207, 139)',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: 'rgb(36, 32, 28)',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgb(180, 32, 32)',
        borderRadius: 8,
        padding: 16,
    },
    deleteButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: 'rgb(247, 233, 233)',
    },
});