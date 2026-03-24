import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";

export default function DashboardScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  const actions = [
    { emoji: "➕", label: "Offer a Ride", sub: "Share your bike seat", route: "/(tabs)/offer", bg: "#16a34a", text: "#fff" },
    { emoji: "🔍", label: "Find a Ride", sub: "Browse available rides", route: "/(tabs)/rides", bg: "#fff", text: "#111827" },
    { emoji: "👤", label: "My Profile", sub: "View rides & details", route: "/(tabs)/profile", bg: "#fff", text: "#111827" },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.greeting}>Welcome back 👋</Text>
        <Text style={styles.email}>{email}</Text>

        <View style={styles.grid}>
          {actions.map((a) => (
            <TouchableOpacity key={a.label} style={[styles.card, { backgroundColor: a.bg, borderColor: a.bg === "#fff" ? "#e5e7eb" : a.bg }]}
              onPress={() => router.push(a.route as never)}>
              <Text style={styles.cardEmoji}>{a.emoji}</Text>
              <Text style={[styles.cardLabel, { color: a.text }]}>{a.label}</Text>
              <Text style={[styles.cardSub, { color: a.bg === "#16a34a" ? "rgba(255,255,255,0.8)" : "#6b7280" }]}>{a.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f9fafb" },
  container: { padding: 20 },
  greeting: { fontSize: 24, fontWeight: "700", color: "#111827", marginBottom: 4 },
  email: { fontSize: 14, color: "#6b7280", marginBottom: 28 },
  grid: { gap: 12 },
  card: { borderRadius: 16, padding: 20, borderWidth: 1 },
  cardEmoji: { fontSize: 28, marginBottom: 8 },
  cardLabel: { fontSize: 17, fontWeight: "700", marginBottom: 4 },
  cardSub: { fontSize: 13 },
});
