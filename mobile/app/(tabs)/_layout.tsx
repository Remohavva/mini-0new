import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: "#16a34a",
      tabBarInactiveTintColor: "#9ca3af",
      tabBarStyle: { borderTopColor: "#f3f4f6", paddingBottom: 4 },
      tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
    }}>
      <Tabs.Screen name="dashboard" options={{ title: "Home", tabBarIcon: ({ color }) => <TabIcon emoji="🏠" color={color} /> }} />
      <Tabs.Screen name="rides" options={{ title: "Rides", tabBarIcon: ({ color }) => <TabIcon emoji="🛣️" color={color} /> }} />
      <Tabs.Screen name="offer" options={{ title: "Offer", tabBarIcon: ({ color }) => <TabIcon emoji="➕" color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color }) => <TabIcon emoji="👤" color={color} /> }} />
      <Tabs.Screen name="notifications" options={{ title: "Notifications", tabBarIcon: ({ color }) => <TabIcon emoji="🔔" color={color} /> }} />
    </Tabs>
  );
}

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  const { Text } = require("react-native");
  return <Text style={{ fontSize: 20, opacity: color === "#16a34a" ? 1 : 0.5 }}>{emoji}</Text>;
}
