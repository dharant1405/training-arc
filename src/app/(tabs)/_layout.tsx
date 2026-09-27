import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '../../theme';

const ICONS: Record<string, string> = {
  home: '⌂',
  arena: '⚔',
  progress: '◈',
  profile: '☖',
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.crimson,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.panel,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.5,
        },
        tabBarIcon: ({ color }) => (
          <Text style={{ color, fontSize: 20 }}>{ICONS[route.name] ?? '•'}</Text>
        ),
      })}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="arena" options={{ title: 'Arena' }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
