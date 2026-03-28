import { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch } from "@/lib/api";

interface Ride {
  id: string;
  origin: string;
  destination: string;
  departure_time: string;
  available_seats: number;
  status: string;
  bike_model?: string;
  suggested_fare?: number;
}

export default function RidesScreen() {
  const router = useRouter();
  const [rides, setRides] = useState<Ride[]>([]);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchRides() {
    setLoading(true);
    const params = new URLSearchParams({ status: "open", match_suggestions: "true" });
    if (origin) params.set("origin", origin);
    if (destination) params.set("destination", destination);
    const data = await apiFetch<Ride[]>(`/rides/?${params}`).catch(() => []);
    setRides(data);
    setLoading(false);
  }

  useEffect(() => { fetchRides(); }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Available Rides</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput style={[styles.input, { flex: 1 }]} placeholder="From..." placeholderTextColor="#9ca3af"
          value={origin} onChangeText={setOrigin} />
        <TextInput style={[styles.input, { flex: 1 }]} placeholder="To..." placeholderTextColor="#9ca3af"
          value={destination} onChangeText={setDestination} />
        <TouchableOpacity style={styles.searchBtn} onPress={fetchRides}>
          <Text style={styles.searchBtnText}>Go</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#16a34a" style={{ marginTop: 40 }} />
      ) : (
        <>
          {rides.length > 0 && !origin && !destination && (
            <Text style={styles.smartBadge}>✨ Smart Matches (by Campus & Location)</Text>
          )}
          <FlatList
            data={rides}
            keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No rides found.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`/ride/${item.id}` as never)}>
              <View style={styles.cardTop}>
                <Text style={styles.route}>{item.origin} → {item.destination}</Text>
                <View style={styles.badge}><Text style={styles.badgeText}>{item.status}</Text></View>
              </View>
              <Text style={styles.meta}>🕐 {new Date(item.departure_time).toLocaleString("en-IN")}</Text>
              <Text style={styles.meta}>💺 {item.available_seats} seat{item.available_seats !== 1 ? "s" : ""}
                {item.bike_model ? `  ·  🏍️ ${item.bike_model}` : ""}
              </Text>
              {item.suggested_fare ? <Text style={styles.fare}>💰 Suggested fare: ₹{item.suggested_fare}</Text> : null}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f9fafb" },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: "700", color: "#111827" },
  searchRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#111827" },
  searchBtn: { backgroundColor: "#16a34a", borderRadius: 10, paddingHorizontal: 16, justifyContent: "center" },
  searchBtnText: { color: "#fff", fontWeight: "700" },
  smartBadge: { fontSize: 12, color: "#16a34a", paddingHorizontal: 20, marginBottom: 8, fontWeight: "600" },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  empty: { textAlign: "center", color: "#9ca3af", marginTop: 40 },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#f3f4f6" },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  route: { fontSize: 15, fontWeight: "600", color: "#111827", flex: 1, marginRight: 8 },
  badge: { backgroundColor: "#dcfce7", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: "#16a34a", fontSize: 11, fontWeight: "700" },
  meta: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  fare: { fontSize: 13, color: "#16a34a", fontWeight: "600", marginTop: 6 },
});
