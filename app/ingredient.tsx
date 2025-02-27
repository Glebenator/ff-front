import { useState, useCallback, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    ScrollView, 
    Platform, 
    Alert, 
    ActivityIndicator, 
    StyleSheet, 
    KeyboardAvoidingView,
    Keyboard,
    TextInput
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ingredientDb } from '@/services/database/ingredientDb';
import { Ingredient, IngredientFormData } from '@/types/types';
import { theme } from '@/styles/theme';
import { sharedStyles } from '@/styles/sharedStyles';
import { sessionManager } from '@/services/sessionManager';
import { 
  FormField,
  CategorySelector,
  DateSelector,
  NotesField,
  FormActions
} from '@/components/ingredient/FormComponents';
import { validateIngredientForm } from '@/utils/validation';

export default function IngredientFormScreen() {
    const { id } = useLocalSearchParams();
    const isEditing = Boolean(id);
    const [isLoading, setIsLoading] = useState(isEditing);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [ingredient, setIngredient] = useState<Ingredient | null>(null);
    const [formData, setFormData] = useState<IngredientFormData>({
        name: '',
        quantity: '',
        category: '',
        notes: '',
        expiryDate: new Date(),
    });
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof IngredientFormData, string>>>({});
    const categories = sessionManager.getAvailableCategories();
    const scrollViewRef = useRef<ScrollView>(null);
    const notesInputRef = useRef<TextInput>(null);

    // Load ingredient data when editing
    useEffect(() => {
        if (!isEditing || Platform.OS === 'web') {
            setIsLoading(false);
            return;
        }

        const loadIngredient = async () => {
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
            } finally {
                setIsLoading(false);
            }
        };

        loadIngredient();
    }, [id, isEditing]);

    const updateField = useCallback((field: keyof IngredientFormData, value: string | Date) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when field is updated
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: undefined }));
        }
    }, [formErrors]);

    const handleSubmit = useCallback(async () => {
        // Validate form
        const errors = validateIngredientForm(formData);
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setIsSubmitting(true);
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

            // Add new category to available categories if it's new
            if (formData.category && !categories.includes(formData.category)) {
                sessionManager.addCategory(formData.category);
            }

            if (isEditing && id) {
                await ingredientDb.update(Number(id), ingredientData);
            } else {
                await ingredientDb.add(ingredientData);
            }

            router.back();
        } catch (error) {
            console.error('Error in submit:', error);
            Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'add'} ingredient`);
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, isEditing, id, categories]);

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
                        setIsSubmitting(true);
                        try {
                            await ingredientDb.delete(Number(id));
                            router.back();
                        } catch (error) {
                            console.error('Error deleting:', error);
                            Alert.alert('Error', 'Failed to delete ingredient');
                        } finally {
                            setIsSubmitting(false);
                        }
                    }
                }
            ]
        );
    }, [id, isEditing]);

    // Handle automatic scrolling when notes field is focused
    const handleNotesFieldFocus = () => {
        // Allow layout to update before scrolling
        setTimeout(() => {
            notesInputRef.current?.measure((_fx, _fy, _width, _height, _px, py) => {
                scrollViewRef.current?.scrollTo({
                    y: py,
                    animated: true
                });
            });
        }, 100);
    };

    // Handle "Done" button press on keyboard for notes field
    const handleNotesSubmit = () => {
        Keyboard.dismiss();
        // If form is valid and not submitting, trigger submit
        if (!isSubmitting && Object.keys(validateIngredientForm(formData)).length === 0) {
            handleSubmit();
        }
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

    if (isLoading) {
        return (
            <View style={[sharedStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[sharedStyles.bodyText, { marginTop: theme.spacing.md }]}>Loading...</Text>
            </View>
        );
    }

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
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
            >
                <ScrollView 
                    ref={scrollViewRef}
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollViewContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={true}
                    keyboardDismissMode="interactive"
                >
                    <View style={sharedStyles.formContent}>
                        <FormField
                            label="Name *"
                            value={formData.name}
                            onChangeText={(text) => updateField('name', text)}
                            placeholder="Enter ingredient name"
                            error={formErrors.name}
                            returnKeyType="next"
                        />

                        <FormField
                            label="Quantity *"
                            value={formData.quantity}
                            onChangeText={(text) => updateField('quantity', text)}
                            placeholder="Enter quantity (e.g., 500g, 2 pieces)"
                            error={formErrors.quantity}
                            returnKeyType="next"
                        />

                        <CategorySelector
                            categories={categories}
                            selectedCategory={formData.category}
                            onSelectCategory={(category) => updateField('category', category)}
                            error={formErrors.category}
                        />

                        {__DEV__ && isEditing && (
                            <FormField
                                label="Debug: Manual Date (YYYY-MM-DD) *"
                                value={formData.debugDate}
                                onChangeText={(text) => {
                                    updateField('debugDate', text);
                                    if (!isNaN(Date.parse(text))) {
                                        updateField('expiryDate', new Date(text));
                                    }
                                }}
                                placeholder="YYYY-MM-DD"
                                error={formErrors.debugDate}
                            />
                        )}

                        <DateSelector
                            date={formData.expiryDate}
                            onDateChange={(date) => {
                                updateField('expiryDate', date);
                                updateField('debugDate', date.toISOString().split('T')[0]);
                            }}
                            minimumDate={!isEditing ? new Date() : undefined}
                            error={formErrors.expiryDate}
                            isEditing={isEditing}
                        />

                        <View ref={notesInputRef} collapsable={false}>
                            <NotesField
                                value={formData.notes}
                                onChangeText={(text) => updateField('notes', text)}
                                onFocus={handleNotesFieldFocus}
                                onSubmitEditing={handleNotesSubmit}
                            />
                        </View>
                    </View>

                    <View style={styles.actionContainer}>
                        <FormActions
                            isEditing={isEditing}
                            isSubmitting={isSubmitting}
                            onSubmit={handleSubmit}
                            onDelete={handleDelete}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        flexGrow: 1,
        padding: theme.spacing.lg,
        paddingBottom: Platform.OS === 'ios' ? 120 : theme.spacing.xl * 2, // Extra padding at bottom for keyboard
    },
    actionContainer: {
        marginTop: theme.spacing.xl,
        marginBottom: Platform.OS === 'ios' ? theme.spacing.xl * 2 : theme.spacing.xl,
    }
});