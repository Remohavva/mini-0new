import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch } from "@/lib/api";

interface Profile {
  id: string;
  full_name: string;
  user_type: string;
  college_or_company: string;
  phone?: string;
  avatar_url?: string;
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Profile>(`/users/${id}`)
      .then(setProfile)
      .catch(() => setError("Could not load profile."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <View style={styles.center}><ActivityIndicator color="#16a34a" /></View>;
  if (error || !profile) return (
    <View style={styles.center}>
      <Text style={styles.errorText}>{error || "User not found."}</Text>
      <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>← Go back</Text></TouchableOpacity>
    </View>
  );

  const initials = profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{profile.full_name}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {profile.user_type === "student" ? "🎓 Student" : "💼 Corporate"}
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>{profile.user_type === "student" ? "🏫" : "🏢"}</Text>
            <Text style={styles.infoVal}>{profile.college_or_company}</Text>
          </View>
          {profile.phone ? (
            <View style={[styles.infoRow, styles.infoRowBorder]}>
              <Text style={styles.infoIcon}>📞</Text>
              <Text style={styles.infoVal}>{profile.phone}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  container: { padding: 20, paddingBottom: 40 },
  backBtn: { marginBottom: 16 },
  back: { color: "#16a34a", fontWeight: "600", fontSize: 15 },
  errorText: { color: "#6b7280", marginBottom: 12 },
  avatarWrap: { alignItems: "center", marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#16a34a", justifyContent: "center", alignItems: "center", marginBottom: 10 },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "700" },
  name: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 6 },
  badge: { backgroundColor: "#f0fdf4", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  badgeText: { color: "#16a34a", fontSize: 13, fontWeight: "600" },
  infoCard: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#f3f4f6" },
  infoRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  infoRowBorder: { borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  infoIcon: { fontSize: 18 },
  infoVal: { fontSize: 14, color: "#374151", flex: 1 },
});
