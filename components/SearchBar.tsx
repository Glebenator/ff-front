import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  sortIndicatorText: string;
  onSortPress: () => void;
}

export default function SearchBar({
  value,
  onChangeText,
  onClear,
  sortIndicatorText,
  onSortPress,
}: SearchBarProps) {
  return (
    <View style={styles.searchContainer}>
      <View style={styles.inputContainer}>
        <Ionicons
          name="search"
          size={18}
          color={theme.colors.text.secondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Search..."
          placeholderTextColor={theme.colors.text.secondary}
          value={value}
          onChangeText={onChangeText}
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={onClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity onPress={onSortPress} style={styles.sortButton}>
        <Text style={styles.sortText}>{sortIndicatorText}</Text>
        <Ionicons name="swap-vertical" size={18} color={theme.colors.text.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    height: 40,
  },
  searchIcon: {
    marginRight: theme.spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary, // This ensures input text is black/primary
    height: '100%',
  },
  clearButton: {
    padding: theme.spacing.xs,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
    padding: theme.spacing.xs,
  },
  sortText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
    marginRight: theme.spacing.xs,
  },
});