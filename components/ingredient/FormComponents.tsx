import { useState } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    Pressable, 
    Platform, 
    StyleSheet,
    ActivityIndicator
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';
import { sharedStyles } from '@/styles/sharedStyles';

export function FormField({ 
    label, 
    value, 
    onChangeText, 
    placeholder, 
    multiline = false,
    numberOfLines = 1,
    error
}: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    multiline?: boolean;
    numberOfLines?: number;
    error?: string;
}) {
    return (
        <View style={sharedStyles.inputGroup}>
            <Text style={sharedStyles.label}>{label}</Text>
            <TextInput
                style={[
                    sharedStyles.input, 
                    multiline && sharedStyles.textArea,
                    error && styles.inputError
                ]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={theme.colors.text.secondary}
                multiline={multiline}
                numberOfLines={numberOfLines}
                textAlignVertical={multiline ? "top" : "center"}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

export function CategorySelector({
    categories,
    selectedCategory,
    onSelectCategory,
    error
}: {
    categories: string[];
    selectedCategory: string;
    onSelectCategory: (category: string) => void;
    error?: string;
}) {
    const [isAdding, setIsAdding] = useState(false);
    const [customCategory, setCustomCategory] = useState('');
    
    const handleAddCustomCategory = () => {
        if (customCategory.trim()) {
            onSelectCategory(customCategory.trim());
            setCustomCategory('');
        }
        setIsAdding(false);
    };

    return (
        <View style={sharedStyles.inputGroup}>
            <Text style={sharedStyles.label}>Category</Text>
            <View style={styles.categoryButtons}>
                {categories.map(category => (
                    <Pressable
                        key={category}
                        style={[
                            styles.categoryButton,
                            selectedCategory === category && styles.categoryButtonActive
                        ]}
                        onPress={() => onSelectCategory(category)}
                    >
                        <Text style={[
                            styles.categoryButtonText,
                            selectedCategory === category && styles.categoryButtonTextActive
                        ]}>
                            {category}
                        </Text>
                    </Pressable>
                ))}
                
                {!isAdding && (
                    <Pressable
                        style={styles.addCategoryButton}
                        onPress={() => setIsAdding(true)}
                    >
                        <Ionicons name="add" size={16} color={theme.colors.primary} />
                        <Text style={styles.addCategoryText}>Add Custom</Text>
                    </Pressable>
                )}
            </View>
            
            {isAdding && (
                <View style={styles.customCategoryContainer}>
                    <TextInput
                        style={[sharedStyles.input, styles.customCategoryInput]}
                        value={customCategory}
                        onChangeText={setCustomCategory}
                        placeholder="Enter custom category"
                        placeholderTextColor={theme.colors.text.secondary}
                        autoFocus
                    />
                    <View style={styles.customCategoryActions}>
                        <Pressable 
                            style={styles.customCategoryButton}
                            onPress={() => setIsAdding(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </Pressable>
                        <Pressable 
                            style={[styles.customCategoryButton, styles.addButton]}
                            onPress={handleAddCustomCategory}
                        >
                            <Text style={styles.addButtonText}>Add</Text>
                        </Pressable>
                    </View>
                </View>
            )}
            
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

export function DateSelector({
    date,
    onDateChange,
    minimumDate,
    error,
    isEditing
}: {
    date: Date;
    onDateChange: (date: Date) => void;
    minimumDate?: Date;
    error?: string;
    isEditing: boolean;
}) {
    const [showDatePicker, setShowDatePicker] = useState(Platform.OS === 'ios');

    const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }

        if (selectedDate) {
            onDateChange(selectedDate);
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <View style={sharedStyles.inputGroup}>
            <Text style={sharedStyles.label}>Expiry Date *</Text>
            {Platform.OS === 'ios' ? (
                <View style={sharedStyles.datePickerIOS}>
                    <DateTimePicker
                        value={date}
                        mode="date"
                        display="spinner"
                        onChange={handleDateChange}
                        minimumDate={minimumDate}
                        textColor={theme.colors.text.primary}
                        themeVariant="dark"
                    />
                </View>
            ) : (
                <>
                    <Pressable
                        style={[sharedStyles.dateButton, error && styles.inputError]}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text style={sharedStyles.dateButtonText}>
                            {formatDate(date)}
                        </Text>
                        <Ionicons
                            name="calendar-outline"
                            size={24}
                            color={theme.colors.primary}
                        />
                    </Pressable>

                    {showDatePicker && (
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display="default"
                            onChange={handleDateChange}
                            minimumDate={minimumDate}
                        />
                    )}
                </>
            )}
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

export function NotesField({
    value,
    onChangeText
}: {
    value: string;
    onChangeText: (text: string) => void;
}) {
    return (
        <FormField
            label="Notes"
            value={value}
            onChangeText={onChangeText}
            placeholder="Add any additional notes (optional)"
            multiline
            numberOfLines={4}
        />
    );
}

export function FormActions({
    isEditing,
    isSubmitting,
    onSubmit,
    onDelete
}: {
    isEditing: boolean;
    isSubmitting: boolean;
    onSubmit: () => void;
    onDelete: () => void;
}) {
    return (
        <View style={sharedStyles.formActions}>
            {isEditing ? (
                <View style={sharedStyles.buttonContainer}>
                    <Pressable
                        style={[
                            sharedStyles.button, 
                            { backgroundColor: theme.colors.status.error },
                            isSubmitting && styles.disabledButton
                        ]}
                        onPress={onDelete}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <>
                                <Ionicons name="trash-outline" size={24} color="white" />
                                <Text style={[sharedStyles.buttonText, { color: 'white' }]}>
                                    Delete
                                </Text>
                            </>
                        )}
                    </Pressable>
                    <Pressable
                        style={[
                            sharedStyles.button, 
                            { flex: 1 },
                            isSubmitting && styles.disabledButton
                        ]}
                        onPress={onSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <Text style={sharedStyles.buttonText}>Save Changes</Text>
                        )}
                    </Pressable>
                </View>
            ) : (
                <Pressable
                    style={[
                        sharedStyles.button, 
                        { width: '100%' },
                        isSubmitting && styles.disabledButton
                    ]}
                    onPress={onSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="white" size="small" />
                    ) : (
                        <Text style={sharedStyles.buttonText}>Add Ingredient</Text>
                    )}
                </Pressable>
            )}
        </View>
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
    addCategoryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: theme.colors.primary,
        padding: theme.spacing.sm,
        borderRadius: theme.borderRadius.md,
    },
    addCategoryText: {
        color: theme.colors.primary,
        fontSize: theme.fontSize.sm,
        marginLeft: 4,
    },
    customCategoryContainer: {
        marginTop: theme.spacing.sm,
    },
    customCategoryInput: {
        marginBottom: theme.spacing.sm,
    },
    customCategoryActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: theme.spacing.sm,
    },
    customCategoryButton: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
    },
    addButton: {
        backgroundColor: theme.colors.primary,
    },
    addButtonText: {
        color: 'white',
        fontWeight: '600',
    },
    cancelButtonText: {
        color: theme.colors.text.primary,
    },
    errorText: {
        color: theme.colors.status.error,
        fontSize: theme.fontSize.sm,
        marginTop: 4,
    },
    inputError: {
        borderColor: theme.colors.status.error,
    },
    disabledButton: {
        opacity: 0.7,
    },
});
