import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet } from 'react-native';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: 'rgb(99, 207, 139)',
                headerStyle: {
                    backgroundColor: 'rgb(36, 32, 28)',
                },
                headerStatusBarHeight: Platform.select({ ios: 44, android: 0 }),
                headerShadowVisible: false,
                headerTintColor: 'rgb(247, 233, 233)',
                tabBarStyle: {
                    backgroundColor: 'rgb(36, 32, 28)',
                    // Position tab bar at top for web, bottom for mobile
                    position: Platform.select({
                        web: 'absolute',
                        default: undefined,
                    }),
                    top: Platform.select({
                        web: 0,
                        default: undefined,
                    }),
                    // Platform-specific border styling
                    borderTopWidth: Platform.select({
                        web: 0,
                        default: StyleSheet.hairlineWidth,
                    }),
                    borderBottomWidth: Platform.select({
                        web: StyleSheet.hairlineWidth,
                        default: 0,
                    }),
                    borderColor: 'rgb(247, 233, 233)',
                },
                // Hide the header on web since we're showing tabs at the top
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
                        <Ionicons
                            name={focused ? 'home-sharp' : 'home-outline'}
                            size={30}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="fridge"
                options={{
                    title: 'My Fridge',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? 'restaurant' : 'restaurant-outline'}
                            size={30}
                            color={color}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}