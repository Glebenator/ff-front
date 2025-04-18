import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '@/styles/theme';

/**
 * A debug component to show AsyncStorage keys and values
 */
export default function StorageViewer() {
  const [storage, setStorage] = useState<{[key: string]: any}>({});
  const [loading, setLoading] = useState(true);

  // Load all AsyncStorage contents
  const loadStorage = async () => {
    setLoading(true);
    try {
      const keys = await AsyncStorage.getAllKeys();
      const result = await AsyncStorage.multiGet(keys);
      
      const storageData: {[key: string]: any} = {};
      result.forEach(([key, value]) => {
        try {
          storageData[key] = value ? JSON.parse(value) : null;
        } catch (e) {
          storageData[key] = value; // Store as string if not JSON
        }
      });
      
      setStorage(storageData);
    } catch (e) {
      console.error("Failed to load storage:", e);
    } finally {
      setLoading(false);
    }
  };

  // Load storage on mount
  useEffect(() => {
    loadStorage();
  }, []);

  // Clear a specific key
  const clearKey = async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
      await loadStorage();
    } catch (e) {
      console.error(`Failed to clear key ${key}:`, e);
    }
  };
  
  // Clear all storage
  const clearStorage = async () => {
    try {
      await AsyncStorage.clear();
      await loadStorage();
    } catch (e) {
      console.error("Failed to clear storage:", e);
    }
  };

  // Standardize storage keys - clear all conflicting keys and normalize
  const standardizeStorage = async () => {
    setLoading(true);
    try {
      // Get all keys
      const keys = await AsyncStorage.getAllKeys();
      
      // Define our standard keys
      const FAVORITES_KEY = 'fridgefriend_favorites';
      const RECENTS_KEY = 'fridgefriend_recent_recipes';
      
      // 1. Collect all favorites data first
      let allFavorites: any[] = [];
      let allRecents: any[] = [];
      
      // Favorites keys to check (in priority order)
      const favoriteKeys = [
        'fridgefriend_favorites',
        'fridgefriend_favourites', // UK spelling
        '@recipe_favorites'
      ];
      
      // Recent keys to check (in priority order)
      const recentKeys = [
        'fridgefriend_recent_recipes',
        'fridgefriend:recentRecipes',
        '@recent_recipes'
      ];
      
      // Collect favorites
      for (const key of favoriteKeys) {
        if (keys.includes(key)) {
          const data = await AsyncStorage.getItem(key);
          if (data) {
            try {
              const parsed = JSON.parse(data);
              if (Array.isArray(parsed)) {
                allFavorites = [...allFavorites, ...parsed];
                console.log(`Found ${parsed.length} favorites in ${key}`);
              }
            } catch (e) {
              console.error(`Error parsing ${key}:`, e);
            }
          }
        }
      }
      
      // Collect recents
      for (const key of recentKeys) {
        if (keys.includes(key)) {
          const data = await AsyncStorage.getItem(key);
          if (data) {
            try {
              const parsed = JSON.parse(data);
              if (Array.isArray(parsed)) {
                allRecents = [...allRecents, ...parsed];
                console.log(`Found ${parsed.length} recents in ${key}`);
              }
            } catch (e) {
              console.error(`Error parsing ${key}:`, e);
            }
          }
        }
      }
      
      // 2. Clear all conflicting keys
      const keysToRemove = [...favoriteKeys, ...recentKeys];
      for (const key of keysToRemove) {
        if (keys.includes(key)) {
          await AsyncStorage.removeItem(key);
          console.log(`Removed key: ${key}`);
        }
      }
      
      // 3. Deduplicate data by ID
      const uniqueFavorites = removeDuplicates(allFavorites);
      const uniqueRecents = removeDuplicates(allRecents);
      
      // 4. Save to our standard keys
      if (uniqueFavorites.length > 0) {
        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(uniqueFavorites));
        console.log(`Saved ${uniqueFavorites.length} favorites to ${FAVORITES_KEY}`);
      }
      
      if (uniqueRecents.length > 0) {
        await AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(uniqueRecents));
        console.log(`Saved ${uniqueRecents.length} recents to ${RECENTS_KEY}`);
      }
      
      // Refresh the view
      await loadStorage();
    } catch (e) {
      console.error('Error standardizing storage:', e);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper to remove duplicates by id
  const removeDuplicates = (items: any[]) => {
    const seen = new Set<string>();
    return items.filter(item => {
      if (!item || !item.id) return false;
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AsyncStorage Debug</Text>
      <View style={styles.buttonRow}>
        <Button
          title="Refresh"
          onPress={loadStorage}
          color={theme.colors.primary}
        />
        <Button
          title="Standardize Keys"
          onPress={standardizeStorage}
          color={theme.colors.status.warning}
        />
        <Button
          title="Clear All"
          onPress={clearStorage}
          color={theme.colors.status.error}
        />
      </View>
      
      {loading ? (
        <Text>Loading storage...</Text>
      ) : (
        <ScrollView style={styles.scrollView}>
          {Object.keys(storage).length === 0 ? (
            <Text style={styles.emptyText}>No items in AsyncStorage</Text>
          ) : (
            Object.entries(storage).map(([key, value]) => (
              <View key={key} style={styles.storageItem}>
                <View style={styles.keyHeader}>
                  <Text style={styles.keyText}>{key}</Text>
                  <Button
                    title="Clear"
                    onPress={() => clearKey(key)}
                    color={theme.colors.status.error}
                  />
                </View>
                <Text style={styles.valueLabel}>Value:</Text>
                <View style={styles.valueContainer}>
                  <Text style={styles.valueText}>
                    {Array.isArray(value) ? 
                      `Array with ${value.length} items` : 
                      typeof value === 'object' && value !== null ? 
                        'Object' : 
                        String(value)
                    }
                  </Text>
                  {Array.isArray(value) && (
                    <Text style={styles.arrayCount}>{value.length} items</Text>
                  )}
                  {Array.isArray(value) && value.length > 0 && (
                    <View style={styles.arrayItem}>
                      <Text style={styles.arrayItemText}>
                        First item: {JSON.stringify(value[0], null, 2)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: theme.colors.background.primary,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  scrollView: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  storageItem: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 8,
  },
  keyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  keyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  valueLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  valueContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 8,
    borderRadius: 4,
  },
  valueText: {
    fontSize: 14,
  },
  arrayCount: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
    color: theme.colors.text.secondary,
  },
  arrayItem: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
  },
  arrayItemText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 16,
    fontStyle: 'italic',
    color: theme.colors.text.secondary,
  }
});