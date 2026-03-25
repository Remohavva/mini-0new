import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch } from "@/lib/api";

const RATE_PER_KM = 4;
const MIN_FARE = 20;

async function geocodeIndia(query: string) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=in`;
  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  const data = await res.json();
  return data[0] ? { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) } : null;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function OfferScreen() {
  const router = useRouter();
  const [form, setForm] = useState({ origin: "", destination: "", departure_time: "", available_seats: "1", bike_model: "", notes: "" });
  const [fare, setFare] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  function set(key: string, val: string) { setForm((f) => ({ ...f, [key]: val })); }

  async function calculateFare() {
    if (!form.origin || !form.destination) return;
    setCalculating(true);
    const [o, d] = await Promise.all([geocodeIndia(form.origin), geocodeIndia(form.destination)]);
    if (o && d) {
      const km = haversineKm(o.lat, o.lon, d.lat, d.lon);
      setFare(Math.max(Math.round(km * RATE_PER_KM), MIN_FARE));
    }
    setCalculating(false);
  }

  async function handleSubmit() {
    if (!form.origin || !form.destination || !form.departure_time) {
      Alert.alert("Missing fields", "Please fill in origin, destination and departure time.");
      return;
    }
    setLoading(true);
    try {
      const [o, d] = await Promise.all([geocodeIndia(form.origin), geocodeIndia(form.destination)]);
      await apiFetch("/rides/", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          available_seats: parseInt(form.available_seats),
          departure_time: new Date(form.departure_time).toISOString(),
          suggested_fare: fare,
          origin_lat: o?.lat,
          origin_lon: o?.lon,
          destination_lat: d?.lat,
          destination_lon: d?.lon,
        }),
      });
      Alert.alert("Ride posted!", "Your ride is now live.", [{ text: "OK", onPress: () => router.push("/(tabs)/rides") }]);
    } catch (err: unknown) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to post ride");
    }
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Offer a Ride</Text>

        <Text style={styles.label}>From</Text>
        <TextInput style={styles.input} placeholder="e.g. Koramangala, Bangalore" placeholderTextColor="#9ca3af"
          value={form.origin} onChangeText={(v) => { set("origin", v); setFare(null); }} />

        <Text style={styles.label}>To</Text>
        <TextInput style={styles.input} placeholder="e.g. Whitefield, Bangalore" placeholderTextColor="#9ca3af"
          value={form.destination} onChangeText={(v) => { set("destination", v); setFare(null); }} />

        <TouchableOpacity style={styles.fareBtn} onPress={calculateFare} disabled={calculating}>
          {calculating ? <ActivityIndicator color="#16a34a" /> :
            <Text style={styles.fareBtnText}>📍 Calculate Fare</Text>}
        </TouchableOpacity>

        {fare !== null && (
          <View style={styles.fareBox}>
            <Text style={styles.fareLabel}>Suggested Fare</Text>
            <Text style={styles.fareValue}>₹{fare}</Text>
            <Text style={styles.fareNote}>Based on ₹{RATE_PER_KM}/km · Negotiable with passenger</Text>
          </View>
        )}

        <Text style={styles.label}>Departure (YYYY-MM-DDTHH:MM)</Text>
        <TextInput style={styles.input} placeholder="2026-03-25T08:30" placeholderTextColor="#9ca3af"
          value={form.departure_time} onChangeText={(v) => set("departure_time", v)} />

        <Text style={styles.label}>Available Seats (1–3)</Text>
        <TextInput style={styles.input} placeholder="1" placeholderTextColor="#9ca3af" keyboardType="numeric"
          value={form.available_seats} onChangeText={(v) => set("available_seats", v)} />

        <Text style={styles.label}>Bike Model (optional)</Text>
        <TextInput style={styles.input} placeholder="e.g. Royal Enfield Classic 350" placeholderTextColor="#9ca3af"
          value={form.bike_model} onChangeText={(v) => set("bike_model", v)} />

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput style={[styles.input, { height: 80, textAlignVertical: "top" }]} placeholder="Any additional info..."
          placeholderTextColor="#9ca3af" multiline value={form.notes} onChangeText={(v) => set("notes", v)} />

        <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Post Ride</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f9fafb" },
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, marginBottom: 14, color: "#111827" },
  fareBtn: { borderWidth: 1, borderColor: "#16a34a", borderRadius: 12, paddingVertical: 12, alignItems: "center", marginBottom: 14 },
  fareBtnText: { color: "#16a34a", fontWeight: "600", fontSize: 14 },
  fareBox: { backgroundColor: "#f0fdf4", borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#bbf7d0", alignItems: "center" },
  fareLabel: { fontSize: 12, color: "#16a34a", fontWeight: "600", marginBottom: 4 },
  fareValue: { fontSize: 32, fontWeight: "800", color: "#15803d" },
  fareNote: { fontSize: 11, color: "#6b7280", marginTop: 4, textAlign: "center" },
  btn: { backgroundColor: "#16a34a", borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 8 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
