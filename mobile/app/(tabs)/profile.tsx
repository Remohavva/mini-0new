import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";

interface Profile { id: string; email: string; full_name: string; user_type: string; college_or_company: string; phone?: string; }
interface Ride { id: string; origin: string; destination: string; departure_time: string; available_seats: number; status: string; suggested_fare?: number; }

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { router.replace("/(auth)/login"); return; }
      const meta = data.user.user_metadata;
      const fallback: Profile = { id: data.user.id, email: data.user.email ?? "", full_name: meta?.full_name ?? "User", user_type: meta?.user_type ?? "student", college_or_company: meta?.college_or_company ?? "" };
      try {
        const p = await apiFetch<Profile>("/users/me");
        setProfile(p);
      } catch { setProfile(fallback); }
      const r = await apiFetch<Ride[]>("/rides/my").catch(() => []);
      setRides(r);
      setLoading(false);
    }
    load();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/(auth)/login");
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color="#16a34a" /></View>;

  const initials = profile?.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
          <Text style={styles.name}>{profile?.full_name}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{profile?.user_type === "student" ? "🎓 Student" : "💼 Corporate"}</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          {[
            { icon: "✉️", val: profile?.email },
            { icon: profile?.user_type === "student" ? "🏫" : "🏢", val: profile?.college_or_company },
            { icon: "📞", val: profile?.phone || "No phone added" },
          ].map((row, i) => (
            <View key={i} style={[styles.infoRow, i < 2 && styles.infoRowBorder]}>
              <Text style={styles.infoIcon}>{row.icon}</Text>
              <Text style={styles.infoVal}>{row.val}</Text>
            </View>
          ))}
        </View>

        {/* My Rides */}
        <Text style={styles.sectionTitle}>My Rides</Text>
        {rides.length === 0 ? (
          <Text style={styles.empty}>No rides yet.</Text>
        ) : (
          rides.map((ride) => (
            <TouchableOpacity key={ride.id} style={styles.rideCard} onPress={() => router.push(`/ride/${ride.id}` as never)}>
              <View style={styles.rideTop}>
                <Text style={styles.rideRoute}>{ride.origin} → {ride.destination}</Text>
                <View style={[styles.rideBadge, ride.status !== "open" && styles.rideBadgeGray]}>
                  <Text style={[styles.rideBadgeText, ride.status !== "open" && { color: "#6b7280" }]}>{ride.status}</Text>
                </View>
              </View>
              <Text style={styles.rideMeta}>🕐 {new Date(ride.departure_time).toLocaleString("en-IN")}</Text>
              {ride.suggested_fare ? <Text style={styles.rideFare}>💰 ₹{ride.suggested_fare}</Text> : null}
            </TouchableOpacity>
          ))
        )}

        <TouchableOpacity style={styles.logoutBtn} onPress={() => Alert.alert("Logout", "Are you sure?", [{ text: "Cancel" }, { text: "Logout", style: "destructive", onPress: handleLogout }])}>
          <Text style={styles.logoutText}>🚪 Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { padding: 20, paddingBottom: 40 },
  avatarWrap: { alignItems: "center", marginBottom: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#16a34a", justifyContent: "center", alignItems: "center", marginBottom: 10 },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "700" },
  name: { fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 6 },
  badge: { backgroundColor: "#f0fdf4", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  badgeText: { color: "#16a34a", fontSize: 13, fontWeight: "600" },
  infoCard: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#f3f4f6", marginBottom: 24 },
  infoRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  infoIcon: { fontSize: 18 },
  infoVal: { fontSize: 14, color: "#374151", flex: 1 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#111827", marginBottom: 12 },
  empty: { color: "#9ca3af", fontSize: 14, marginBottom: 20 },
  rideCard: { backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#f3f4f6" },
  rideTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  rideRoute: { fontSize: 14, fontWeight: "600", color: "#111827", flex: 1, marginRight: 8 },
  rideBadge: { backgroundColor: "#dcfce7", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  rideBadgeGray: { backgroundColor: "#f3f4f6" },
  rideBadgeText: { color: "#16a34a", fontSize: 11, fontWeight: "700" },
  rideMeta: { fontSize: 12, color: "#6b7280" },
  rideFare: { fontSize: 13, color: "#16a34a", fontWeight: "600", marginTop: 4 },
  logoutBtn: { marginTop: 24, borderWidth: 1, borderColor: "#fca5a5", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  logoutText: { color: "#ef4444", fontWeight: "600", fontSize: 15 },
});
