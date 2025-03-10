// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { theme } from '@/styles/theme';
import { useSessions } from '@/hooks/useSessions';

function TabIcon({ name, focused, color }: { 
  name: React.ComponentProps<typeof Ionicons>['name']; 
  focused: boolean;
  color: string;
}) {
  return (
    <Ionicons
      name={focused ? name.replace('-outline', '') as React.ComponentProps<typeof Ionicons>['name'] : name}
      size={24}
      color={color}
    />
  );
}

export default function TabLayout() {
    const { pendingSessions } = useSessions();
    const pendingCount = pendingSessions.length;

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: theme.colors.primary,
                headerStyle: {
                    backgroundColor: theme.colors.background.primary,
                },
                headerStatusBarHeight: Platform.select({ ios: 44, android: 0 }),
                headerShadowVisible: false,
                headerTintColor: theme.colors.text.primary,
                tabBarStyle: {
                    backgroundColor: theme.colors.background.primary,
                    position: Platform.select({
                        web: 'absolute',
                        default: undefined,
                    }),
                    top: Platform.select({
                        web: 0,
                        default: undefined,
                    }),
                    borderTopWidth: Platform.select({
                        web: 0,
                        default: StyleSheet.hairlineWidth,
                    }),
                    borderBottomWidth: Platform.select({
                        web: StyleSheet.hairlineWidth,
                        default: 0,
                    }),
                    borderColor: theme.colors.text.primary,
                },
                headerShown: Platform.select({
                    web: true,
                    default: true,
                }),
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="home-outline" focused={focused} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="fridge"
                options={{
                    title: 'My Fridge',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="restaurant-outline" focused={focused} color={color} />
                    ),
                    href: {
                        pathname: "/fridge",
                        params: { initialFilter: 'all' }
                    }
                }}
            />
            <Tabs.Screen
                name="sessions"
                options={{
                    title: 'Sessions',
                    tabBarIcon: ({ color, focused }) => (
                        <View>
                            <TabIcon name="scan-outline" focused={focused} color={color} />
                            {pendingCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>
                                        {pendingCount > 99 ? '99+' : pendingCount}
                                    </Text>
                                </View>
                            )}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="recipes"
                options={{
                    title: 'Recipes',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="book-outline" focused={focused} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="mqtt"
                options={{
                    title: 'MQTT Test',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="pulse-outline" focused={focused} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    badge: {
        position: 'absolute',
        right: -6,
        top: -4,
        backgroundColor: theme.colors.status.error,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
});