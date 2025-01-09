// app/add-ingredient.tsx
import { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Platform, Pressable } from 'react-native';
import { Stack, router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { ingredientDb } from '@/services/database/ingredientDb';

export default function AddIngredientScreen() {
    const [formData, setFormData] = useState({
        name: '',
        quantity: '',
        category: '',
        notes: '',
        expiryDate: new Date()
    });
    const [showDatePicker, setShowDatePicker] = useState(false);

    const handleSubmit = useCallback(async () => {
        console.log('Submit pressed with data:', formData);
        
        // Validate required fields
        if (!formData.name?.trim() || !formData.quantity?.trim()) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            // Create the ingredient data object
            const ingredientData = {
                name: formData.name.trim(),
                quantity: formData.quantity.trim(),
                expiryDate: formData.expiryDate.toISOString().split('T')[0],
                category: formData.category?.trim() || null,
                notes: formData.notes?.trim() || null
            };

            console.log('Submitting ingredient data:', ingredientData);

            // Add to database
            ingredientDb.add(ingredientData);

            // Navigate back - we know it worked if we got here
            router.back();
        } catch (error) {
            console.error('Error in submit:', error);
            if (Platform.OS === 'web') {
                alert('Adding ingredients is not supported on web platform');
            } else {
                alert('Failed to add ingredient. Please try again.');
            }
        }
    }, [formData]);

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setFormData(prev => ({ ...prev, expiryDate: selectedDate }));
        }
    };

    const updateField = (field: string, value: string | Date) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <>
            <Stack.Screen 
                options={{
                    title: 'Add Ingredient',
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

                    <Pressable 
                        style={styles.submitButton}
                        onPress={handleSubmit}
                    >
                        <Text style={styles.submitButtonText}>Add Ingredient</Text>
                    </Pressable>
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
    submitButton: {
        backgroundColor: 'rgb(99, 207, 139)',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 16,
    },
    submitButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: 'rgb(36, 32, 28)',
    },
});