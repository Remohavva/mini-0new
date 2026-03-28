import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";
import RatingStars from "@/components/RatingStars";

interface Ride { id: string; rider_id: string; origin: string; destination: string; departure_time: string; available_seats: number; status: string; bike_model?: string; notes?: string; suggested_fare?: number; current_lat?: number; current_lon?: number; }
interface RideRequest { id: string; requester_id: string; requester_name?: string; status: string; message?: string; suggested_fare?: number; offered_fare?: number; agreed_fare?: number; }
interface RatingMine {
  id: string;
  ride_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface RideMessage {
  id: string;
  ride_id: string;
  sender_id: string;
  sender_name?: string | null;
  message: string;
  created_at: string;
}

export default function RideDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [ride, setRide] = useState<Ride | null>(null);
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [myRequest, setMyRequest] = useState<RideRequest | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [offerFare, setOfferFare] = useState("");
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [myRating, setMyRating] = useState<RatingMine | null>(null);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<RideMessage[]>([]);
  const [chatText, setChatText] = useState("");
  const [chatSending, setChatSending] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id ?? null);
      const r = await apiFetch<Ride>(`/rides/${id}`).catch(() => null);
      setRide(r);
      if (r && data.user?.id === r.rider_id) {
        const reqs = await apiFetch<RideRequest[]>(`/rides/${id}/requests`).catch(() => []);
        setRequests(reqs);
      } else if (r && data.user?.id) {
        const mine = await apiFetch<RideRequest | null>(`/rides/${id}/requests/mine`).catch(() => null);
        setMyRequest(mine);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  useEffect(() => {
    // Real-time listener for Live Location Tracking
    if (!ride || ride.status !== "started") return;

    const channel = supabase
      .channel(`ride_location_${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rides", filter: `id=eq.${id}` },
        (payload) => {
          if (payload.new && payload.new.current_lat && payload.new.current_lon) {
            setRide((prev) => prev ? { ...prev, current_lat: payload.new.current_lat, current_lon: payload.new.current_lon } : prev);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ride?.status, id]);

  const [broadcasting, setBroadcasting] = useState(false);
  useEffect(() => {
    // Simulated GPS broadcaster for riders
    const owner = !!ride && !!currentUserId && currentUserId === ride.rider_id;
    if (!broadcasting || !owner || ride?.status !== "started") return;
    let lat = ride?.current_lat || 12.9716;
    let lon = ride?.current_lon || 77.5946;

    const interval = setInterval(async () => {
      lat += 0.0001; // simulate movement
      lon += 0.0001;
      await supabase.from("rides").update({ current_lat: lat, current_lon: lon }).eq("id", id);
    }, 5000);

    return () => clearInterval(interval);
  }, [broadcasting, currentUserId, ride?.rider_id, ride?.status, id]);

  useEffect(() => {
    // Only fetch rating after ride is completed so the backend allows rating.
    async function loadMyRatingIfNeeded() {
      if (!ride || ride.status !== "completed") return;
      setRatingLoading(true);
      const existing = await apiFetch<RatingMine | null>(`/ratings/ride/${id}/mine`).catch(() => null);
      setMyRating(existing);
      setRatingSubmitted(!!existing);
      setRatingLoading(false);
    }
    loadMyRatingIfNeeded();
  }, [ride, id]);

  async function refreshRide() {
    const r = await apiFetch<Ride>(`/rides/${id}`).catch(() => null);
    setRide(r);
  }

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

  async function handleStart() {
    try {
      await apiFetch(`/rides/${id}/start`, { method: "PATCH" });
      Alert.alert("Ride started", "Passenger(s) have been notified.");
      await refreshRide();
    } catch (err: unknown) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to start ride");
    }
  }

  async function handleComplete() {
    try {
      await apiFetch(`/rides/${id}/complete`, { method: "PATCH" });
      Alert.alert("Ride completed", "You can now rate your rider/passenger.");
      await refreshRide();
    } catch (err: unknown) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to complete ride");
    }
  }

  async function handleRate() {
    if (!ride || !currentUserId) return;
    try {
      // If I'm the rider, rate the accepted passenger; otherwise rate the rider.
      let revieweeId = ride.rider_id;
      if (currentUserId === ride.rider_id) {
        const accepted = requests.find((r) => r.status === "accepted");
        revieweeId = accepted?.requester_id ?? "";
      }
      if (!revieweeId) {
        Alert.alert("Cannot rate yet", "No accepted passenger found to rate.");
        return;
      }

      await apiFetch(`/ratings/`, {
        method: "POST",
        body: JSON.stringify({
          ride_id: id,
          reviewee_id: revieweeId,
          rating: ratingValue,
          comment: ratingComment ? ratingComment : undefined,
        }),
      });

      setMyRating({
        id: "local",
        ride_id: id,
        reviewer_id: currentUserId,
        reviewee_id: revieweeId,
        rating: ratingValue,
        comment: ratingComment ? ratingComment : null,
        created_at: new Date().toISOString(),
      });
      setRatingSubmitted(true);
      Alert.alert("Rating submitted", "Thanks for your feedback!");
    } catch (err: unknown) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to submit rating");
    }
  }

  const isOwner = !!ride && !!currentUserId && currentUserId === ride.rider_id;
  const canChat = isOwner ? requests.some((r) => r.status === "accepted") : myRequest?.status === "accepted";

  async function loadMessages() {
    const data = await apiFetch<RideMessage[]>(`/rides/${id}/messages`).catch(() => []);
    setMessages(data);
  }

  useEffect(() => {
    if (!canChat) return;
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canChat, id]);

  // Passenger must refresh their request status so chat unlocks immediately after acceptance.
  useEffect(() => {
    if (isOwner) return;
    if (!ride || !currentUserId) return;
    let cancelled = false;

    async function refreshMyRequest() {
      const mine = await apiFetch<RideRequest | null>(`/rides/${id}/requests/mine`).catch(() => null);
      if (!cancelled) setMyRequest(mine);
    }

    refreshMyRequest();
    const interval = setInterval(refreshMyRequest, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, id, ride, currentUserId]);

  async function handleSendChat() {
    if (!canChat) return;
    const trimmed = chatText.trim();
    if (!trimmed) return;
    setChatSending(true);
    try {
      await apiFetch(`/rides/${id}/messages`, { method: "POST", body: JSON.stringify({ message: trimmed }) });
      setChatText("");
      await loadMessages();
    } finally {
      setChatSending(false);
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color="#16a34a" /></View>;
  if (!ride) return <View style={styles.center}><Text>Ride not found.</Text></View>;

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
            <View style={[
              styles.badge,
              ride.status === "open" && { backgroundColor: "#dcfce7" },
              ride.status === "full" && { backgroundColor: "#fef9c3" },
              ride.status === "started" && { backgroundColor: "#dbeafe" },
              ride.status === "completed" && { backgroundColor: "#ede9fe" },
              ride.status === "cancelled" && { backgroundColor: "#f3f4f6" },
            ]}>
              <Text style={[
                styles.badgeText,
                ride.status === "open" && { color: "#16a34a" },
                ride.status === "full" && { color: "#a16207" },
                ride.status === "started" && { color: "#2563eb" },
                ride.status === "completed" && { color: "#6d28d9" },
                ride.status === "cancelled" && { color: "#6b7280" },
              ]}>{ride.status}</Text>
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

          {ride.status === "started" && (ride.current_lat || ride.current_lon) && !isOwner && (
            <View style={styles.liveLocationBox}>
              <Text style={styles.liveLocationTitle}>📍 Live Location Tracking</Text>
              <Text style={styles.liveLocationData}>Current Lat: {ride.current_lat?.toFixed(5)}</Text>
              <Text style={styles.liveLocationData}>Current Lon: {ride.current_lon?.toFixed(5)}</Text>
              <Text style={styles.liveLocationNote}>Map view requires native 'react-native-maps'</Text>
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
                <TouchableOpacity onPress={() => router.push(`/user/${req.requester_id}` as never)}>
                  <Text style={styles.requesterName}>{req.requester_name ?? req.requester_id.slice(0, 8) + "..."}</Text>
                  <Text style={styles.viewProfile}>View Profile →</Text>
                </TouchableOpacity>
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

        {/* Owner actions */}
        {isOwner && (
          <View style={styles.card}>
            {(ride.status === "open" || ride.status === "full") && (
              <TouchableOpacity style={styles.primaryBtn} onPress={handleStart}>
                <Text style={styles.primaryBtnText}>🚀 Start Ride</Text>
              </TouchableOpacity>
            )}
            {ride.status === "started" && (
              <>
                <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: broadcasting ? "#fee2e2" : "#dbeafe", borderWidth: 1, borderColor: broadcasting ? "#f87171" : "#60a5fa" }]} onPress={() => setBroadcasting(!broadcasting)}>
                  <Text style={[styles.primaryBtnText, { color: broadcasting ? "#ef4444" : "#2563eb" }]}>
                    {broadcasting ? "🛑 Stop Location Broadcast" : "📡 Broadcast Live Location"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryBtn} onPress={handleComplete}>
                  <Text style={styles.primaryBtnText}>✅ Complete Ride</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Chat */}
        {canChat && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Chat</Text>

            <View style={styles.chatList}>
              {messages.length === 0 ? (
                <Text style={styles.chatEmpty}>No messages yet.</Text>
              ) : (
                messages.slice(-30).map((m) => {
                  const isMe = m.sender_id === currentUserId;
                  return (
                    <View
                      key={m.id}
                      style={[styles.bubbleRow, isMe ? styles.bubbleRowMe : styles.bubbleRowThem]}
                    >
                      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                        <Text style={styles.bubbleText}>{m.message}</Text>
                        <Text style={[styles.bubbleTime, isMe ? styles.bubbleTimeMe : styles.bubbleTimeThem]}>
                          {new Date(m.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            <View style={styles.chatComposer}>
              <TextInput
                style={styles.chatInput}
                placeholder="Type a message..."
                placeholderTextColor="#9ca3af"
                value={chatText}
                onChangeText={setChatText}
              />
              <TouchableOpacity
                style={[styles.chatSendBtn, chatSending && { opacity: 0.75 }]}
                onPress={handleSendChat}
                disabled={chatSending || !chatText.trim()}
              >
                <Text style={styles.chatSendBtnText}>{chatSending ? "Sending..." : "Send"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Rating section */}
        {ride.status === "completed" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Rate this ride</Text>
            {ratingLoading ? (
              <ActivityIndicator color="#16a34a" />
            ) : myRating || ratingSubmitted ? (
              <View>
                <RatingStars value={myRating?.rating ?? ratingValue} readonly size="lg" />
                {!!(myRating?.comment) && <Text style={styles.meta}>💬 {myRating?.comment}</Text>}
                {!myRating?.comment && <Text style={styles.meta}>Thanks for your feedback!</Text>}
              </View>
            ) : (
              <View>
                <RatingStars value={ratingValue} onChange={setRatingValue} size="lg" />
                <TextInput
                  style={styles.input}
                  placeholder="Optional comment..."
                  placeholderTextColor="#9ca3af"
                  value={ratingComment}
                  onChangeText={setRatingComment}
                  multiline
                />
                <TouchableOpacity style={styles.primaryBtn} onPress={handleRate}>
                  <Text style={styles.primaryBtnText}>Submit Rating</Text>
                </TouchableOpacity>
              </View>
            )}
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
  liveLocationBox: { backgroundColor: "#eff6ff", padding: 12, borderRadius: 10, marginTop: 12, borderWidth: 1, borderColor: "#bfdbfe" },
  liveLocationTitle: { fontSize: 13, fontWeight: "700", color: "#1e3a8a", marginBottom: 4 },
  liveLocationData: { fontSize: 13, color: "#2563eb", fontFamily: "monospace" },
  liveLocationNote: { fontSize: 10, color: "#93c5fd", marginTop: 4, fontStyle: "italic" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 10 },
  label: { fontSize: 12, fontWeight: "600", color: "#374151", marginBottom: 4 },
  input: { backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, marginBottom: 10, color: "#111827" },
  btn: { backgroundColor: "#16a34a", borderRadius: 10, paddingVertical: 13, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  reqRow: { borderTopWidth: 1, borderTopColor: "#f3f4f6", paddingTop: 10, marginTop: 10 },
  requesterName: { fontSize: 14, fontWeight: "700", color: "#111827" },
  viewProfile: { fontSize: 12, color: "#16a34a", fontWeight: "600", marginTop: 2, marginBottom: 6 },
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
  primaryBtn: { backgroundColor: "#16a34a", borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 10 },
  primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },

  chatList: { backgroundColor: "#f3f4f6", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", padding: 10, marginBottom: 12 },
  chatEmpty: { color: "#6b7280", textAlign: "center" },
  chatComposer: { flexDirection: "row", gap: 10, alignItems: "center" },
  chatInput: { flex: 1, backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: "#111827" },
  chatSendBtn: { backgroundColor: "#2563eb", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, alignItems: "center" },
  chatSendBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },

  bubbleRow: { marginBottom: 8, flexDirection: "row" },
  bubbleRowMe: { justifyContent: "flex-end" },
  bubbleRowThem: { justifyContent: "flex-start" },
  bubble: { maxWidth: "85%", borderRadius: 14, padding: 10, borderWidth: 1 },
  bubbleMe: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  bubbleThem: { backgroundColor: "#fff", borderColor: "#e5e7eb" },
  bubbleText: { color: "#111827" },
  bubbleTime: { marginTop: 6, fontSize: 11, color: "#6b7280" },
  bubbleTimeMe: { color: "#dbeafe" },
  bubbleTimeThem: { color: "#9ca3af" },
});
