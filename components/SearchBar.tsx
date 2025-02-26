// SearchBar.tsx (Integrated with compact sort control)
import React from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';

interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    onClear: () => void;
    sortIndicatorText?: string;
    onSortPress?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
    value, 
    onChangeText, 
    onClear, 
    sortIndicatorText, 
    onSortPress 
}) => {
    return (
        <View style={styles.searchBarContainer}>
            {/* Left side: Sort button (icon only) */}
            {onSortPress && (
                <Pressable 
                    style={styles.sortButton} 
                    onPress={onSortPress}
                >
                    <Ionicons 
                        name="options-outline" 
                        size={20} 
                        color={theme.colors.text.tertiary} 
                    />
                </Pressable>
            )}
            
            {/* Middle: Search icon and input */}
            <View style={styles.searchSection}>
                <Ionicons 
                    name="search" 
                    size={20} 
                    color={theme.colors.text.tertiary} 
                    style={styles.searchIcon} 
                />
                
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search ingredients..."
                    placeholderTextColor={theme.colors.text.tertiary}
                    value={value}
                    onChangeText={onChangeText}
                />
            </View>
            
            {/* Right side: Clear button (when there's text) */}
            {value.length > 0 && (
                <Pressable 
                    onPress={onClear} 
                    style={styles.clearButton}
                >
                    <Ionicons 
                        name="close-circle" 
                        size={20} 
                        color={theme.colors.text.tertiary} 
                    />
                </Pressable>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.borderRadius.lg,
        height: 44,
        paddingHorizontal: theme.spacing.sm,
    },
    sortButton: {
        padding: theme.spacing.sm,
        marginRight: 4,
    },
    searchSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    searchIcon: {
        marginLeft: 4,
    },
    searchInput: {
        flex: 1,
        fontSize: theme.fontSize.md,
        color: theme.colors.text.primary,
        height: '100%',
        paddingLeft: theme.spacing.sm,
    },
    clearButton: {
        padding: theme.spacing.sm,
        marginLeft: 4,
    },
});

export default SearchBar;