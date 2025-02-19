// SearchBar.tsx (Corrected - Prioritize TextInput)
import React, {useState, useRef, useCallback, useEffect} from 'react';
import { View, TextInput, Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';

interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    onClear: () => void;
    sortIndicatorText?: string;
    onSortPress?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChangeText, onClear, sortIndicatorText, onSortPress }) => {
    const [clearButtonWidth, setClearButtonWidth] = useState(0);
    const [sortButtonWidth, setSortButtonWidth] = useState(0);
    const clearButtonRef = useRef<Pressable>(null);
    const sortButtonRef = useRef<Pressable>(null);

      const measureClearButton = useCallback(() => {
        if (clearButtonRef.current) {
          clearButtonRef.current.measure((x, y, width, height, pageX, pageY) => {
            setClearButtonWidth(width);
          });
        }
    }, []);

      const measureSortButton = useCallback(() => {
        if (sortButtonRef.current) {
          sortButtonRef.current.measure((x, y, width, height, pageX, pageY) => {
            setSortButtonWidth(width);
          });
        }
    }, []);

     useEffect(()=>{
        measureClearButton();
        measureSortButton();
    }, [value, sortIndicatorText, measureClearButton, measureSortButton])

    return (
        <View style={styles.searchBarContainer}>
            <Ionicons name="search" size={20} color={theme.colors.text.tertiary} style={styles.searchIcon} />
            <TextInput
                style={[styles.searchInput, {paddingRight: clearButtonWidth + sortButtonWidth + theme.spacing.md}]} // Dynamic padding
                placeholder="Search ingredients..."
                placeholderTextColor={theme.colors.text.tertiary}
                value={value}
                onChangeText={onChangeText}
            />
            {value && ( // Conditionally render the clear button
                <Pressable ref={clearButtonRef} onPress={onClear} style={styles.clearButton} onLayout={measureClearButton}>
                    <Ionicons name="close-circle" size={20} color={theme.colors.text.tertiary} />
                </Pressable>
            )}
            {sortIndicatorText && onSortPress && (
                 <Pressable ref={sortButtonRef} style={styles.sortIndicatorContainer} onPress={onSortPress} onLayout={measureSortButton}>
                    <Text style={styles.sortIndicatorText}>{sortIndicatorText}</Text>
                </Pressable>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    searchBarContainer: {
        position: 'relative', //  Make the container relative for absolute positioning
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.borderRadius.lg,
        height: 44,
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: theme.spacing.xl * 2, //  Consistent padding for the search icon
    },
    searchInput: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text.primary,
        flexShrink: 1,  // Allow shrinking
        flexGrow: 1,    // Allow growing, and take up most space
        width: 0,       //  Essential for flexShrink/flexGrow to work correctly
        paddingRight: theme.spacing.md, // Space for clear/sort buttons
    },
    searchIcon: {
        position: 'absolute',  // Position absolutely
        left: theme.spacing.lg, //  Position from the left
        top: '50%',
        transform: [{ translateY: -10 }],
        zIndex: 1,
    },
    clearButton: {
        position: 'absolute', // Position absolutely
        right: 0, // Position from the right
        top: '50%',
        paddingHorizontal: theme.spacing.md,
        transform: [{ translateY: -10 }],
        zIndex: 1, // Ensure it's above the TextInput

    },
      sortIndicatorContainer: {
        position: 'absolute', // Position abosolutely
        right: 0,
        top: 0,
        height: '100%',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.sm,
        zIndex: 1, // Ensure it's above the TextInput
    },
    sortIndicatorText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.secondary,
    },
});

export default SearchBar;