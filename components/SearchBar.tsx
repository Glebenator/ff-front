import React, { memo } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
};

const SearchBar = ({ value, onChangeText, onClear }: SearchBarProps) => {
  return (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Ionicons 
          name="search-outline" 
          size={20} 
          color={theme.colors.text.secondary} 
        />
        <TextInput
          style={styles.searchInput}
          value={value}
          onChangeText={onChangeText}
          placeholder="Search ingredients..."
          placeholderTextColor={theme.colors.text.secondary}
          returnKeyType="search"
        />
        {value.length > 0 && (
          <Pressable onPress={onClear}>
            <Ionicons 
              name="close-circle" 
              size={20} 
              color={theme.colors.text.secondary} 
            />
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text.primary,
    fontSize: theme.fontSize.md,
    padding: theme.spacing.xs,
  },
});

export default memo(SearchBar);