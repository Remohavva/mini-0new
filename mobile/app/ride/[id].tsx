import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";

interface Ride { id: string; rider_id: string; origin: string; destination: string; departure_time: string; available_seats: number; status: string; bike_model?: string; notes?: string; suggested_fare?: number; }
interface RideRequest { id: string; requester_id: string; status: string; message?: string; suggested_fare?: number; offered_fare?: number; agreed_fare?: number; }

export default function RideDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [ride, setRide] = useState<Ride | null>(null);
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [myRequest, setMyRequest] = useState<RideRequest | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [offerFare, setOfferFare] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id ?? null);
      const r = await apiFetch<Ride>(`/rides/${id}`).catch(() => null);
      setRide(r);
      if (r && data.user?.id === r.rider_id) {
        const reqs = await apiFetch<RideRequest[]>(`/rides/${id}/requests`).catch(() => []);
        setRequests(reqs);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleRequest() {
    try {
      const req = await apiFetch<RideRequest>(`/rides/${id}/requests`, {
        method: "POST",
        body: JSON.stringify({ ride_id: id, message, offered_fare: offerFare ? parseInt(offerFare) : undefined }),
      });
      setMyRequest(req);
      Alert.alert("Request sent!", "The rider will review your request.");
    } catch (err: unknown) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed");
    }
  }

  async function handleRespond(requestId: string, action: "accept" | "reject") {
    await apiFetch(`/rides/${id}/requests/${requestId}?action=${action}`, { method: "PATCH" });
    setRequests((prev) => prev.map((r) => r.id === requestId ? { ...r, status: action + "ed" } : r));
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color="#16a34a" /></View>;
  if (!ride) return <View style={styles.center}><Text>Ride not found.</Text></View>;

  const isOwner = currentUserId === ride.rider_id;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Ride info */}
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.route}>{ride.origin} → {ride.destination}</Text>
            <View style={[styles.badge, ride.status !== "open" && styles.badgeGray]}>
              <Text style={[styles.badgeText, ride.status !== "open" && { color: "#6b7280" }]}>{ride.status}</Text>
            </View>
          </View>
          <Text style={styles.meta}>🕐 {new Date(ride.departure_time).toLocaleString("en-IN")}</Text>
          <Text style={styles.meta}>💺 {ride.available_seats} seat{ride.available_seats !== 1 ? "s" : ""}</Text>
          {ride.bike_model && <Text style={styles.meta}>🏍️ {ride.bike_model}</Text>}
          {ride.notes && <Text style={styles.meta}>📝 {ride.notes}</Text>}
          {ride.suggested_fare && (
            <View style={styles.fareBox}>
              <Text style={styles.fareLabel}>Suggested Fare</Text>
              <Text style={styles.fareValue}>₹{ride.suggested_fare}</Text>
              <Text style={styles.fareNote}>Negotiable between rider and passenger</Text>
            </View>
          )}
        </View>

        {/* Passenger: request form */}
        {!isOwner && ride.status === "open" && !myRequest && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Request this ride</Text>
            <TextInput style={styles.input} placeholder="Message to rider (optional)" placeholderTextColor="#9ca3af"
              value={message} onChangeText={setMessage} multiline />
            {ride.suggested_fare && (
              <>
                <Text style={styles.label}>Counter-offer fare (₹)</Text>
                <TextInput style={styles.input} placeholder={`Suggested: ₹${ride.suggested_fare}`} placeholderTextColor="#9ca3af"
                  value={offerFare} onChangeText={setOfferFare} keyboardType="numeric" />
              </>
            )}
            <TouchableOpacity style={styles.btn} onPress={handleRequest}>
              <Text style={styles.btnText}>Send Request</Text>
            </TouchableOpacity>
          </View>
        )}

        {myRequest && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Your Request</Text>
            <Text style={styles.meta}>Status: <Text style={{ color: "#16a34a", fontWeight: "700" }}>{myRequest.status}</Text></Text>
            {myRequest.offered_fare && <Text style={styles.meta}>Your offer: ₹{myRequest.offered_fare}</Text>}
            {myRequest.agreed_fare && <Text style={[styles.meta, { color: "#16a34a", fontWeight: "700" }]}>✅ Agreed fare: ₹{myRequest.agreed_fare}</Text>}
          </View>
        )}

        {/* Rider: requests list */}
        {isOwner && requests.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Ride Requests ({requests.length})</Text>
            {requests.map((req) => (
              <View key={req.id} style={styles.reqRow}>
                <Text style={styles.meta}>User: {req.requester_id.slice(0, 8)}...</Text>
                {req.message && <Text style={styles.meta}>"{req.message}"</Text>}
                {req.offered_fare && <Text style={styles.meta}>💰 Offered: ₹{req.offered_fare} {req.suggested_fare ? `(suggested ₹${req.suggested_fare})` : ""}</Text>}
                {req.agreed_fare && <Text style={[styles.meta, { color: "#16a34a", fontWeight: "700" }]}>✅ Agreed: ₹{req.agreed_fare}</Text>}
                <View style={styles.reqActions}>
                  <View style={[styles.statusBadge, req.status === "accepted" ? styles.statusGreen : req.status === "rejected" ? styles.statusRed : styles.statusYellow]}>
                    <Text style={styles.statusText}>{req.status}</Text>
                  </View>
                  {req.status === "pending" && (
                    <>
                      <TouchableOpacity style={styles.acceptBtn} onPress={() => handleRespond(req.id, "accept")}>
                        <Text style={styles.acceptText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.rejectBtn} onPress={() => handleRespond(req.id, "reject")}>
                        <Text style={styles.rejectText}>Reject</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { padding: 16, paddingBottom: 40 },
  back: { marginBottom: 12 },
  backText: { color: "#16a34a", fontWeight: "600", fontSize: 15 },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "#f3f4f6" },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  route: { fontSize: 17, fontWeight: "700", color: "#111827", flex: 1, marginRight: 8 },
  badge: { backgroundColor: "#dcfce7", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  badgeGray: { backgroundColor: "#f3f4f6" },
  badgeText: { color: "#16a34a", fontSize: 11, fontWeight: "700" },
  meta: { fontSize: 13, color: "#6b7280", marginTop: 3 },
  fareBox: { backgroundColor: "#f0fdf4", borderRadius: 10, padding: 12, marginTop: 12, alignItems: "center", borderWidth: 1, borderColor: "#bbf7d0" },
  fareLabel: { fontSize: 11, color: "#16a34a", fontWeight: "600" },
  fareValue: { fontSize: 28, fontWeight: "800", color: "#15803d" },
  fareNote: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 10 },
  label: { fontSize: 12, fontWeight: "600", color: "#374151", marginBottom: 4 },
  input: { backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, marginBottom: 10, color: "#111827" },
  btn: { backgroundColor: "#16a34a", borderRadius: 10, paddingVertical: 13, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  reqRow: { borderTopWidth: 1, borderTopColor: "#f3f4f6", paddingTop: 10, marginTop: 10 },
  reqActions: { flexDirection: "row", gap: 8, marginTop: 8, alignItems: "center" },
  statusBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  statusGreen: { backgroundColor: "#dcfce7" },
  statusRed: { backgroundColor: "#fee2e2" },
  statusYellow: { backgroundColor: "#fef9c3" },
  statusText: { fontSize: 11, fontWeight: "700", color: "#374151" },
  acceptBtn: { backgroundColor: "#16a34a", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  acceptText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  rejectBtn: { backgroundColor: "#fee2e2", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  rejectText: { color: "#ef4444", fontWeight: "700", fontSize: 12 },
});
