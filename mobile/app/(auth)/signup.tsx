import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function SignupScreen() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", full_name: "", user_type: "student", college_or_company: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(key: string, val: string) { setForm((f) => ({ ...f, [key]: val })); }

  async function handleSignup() {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name, user_type: form.user_type, college_or_company: form.college_or_company, phone: form.phone } },
    });
    if (error) setError(error.message);
    else router.replace("/(tabs)/dashboard");
    setLoading(false);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
      <Text style={styles.logo}>🏍️</Text>
      <Text style={styles.title}>Join Pillion</Text>

      <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#9ca3af" value={form.full_name} onChangeText={(v) => set("full_name", v)} />
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#9ca3af" value={form.email} onChangeText={(v) => set("email", v)} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#9ca3af" value={form.password} onChangeText={(v) => set("password", v)} secureTextEntry />
      <TextInput style={styles.input} placeholder="Phone (optional)" placeholderTextColor="#9ca3af" value={form.phone} onChangeText={(v) => set("phone", v)} keyboardType="phone-pad" />

      <Text style={styles.label}>I am a</Text>
      <View style={styles.toggle}>
        {["student", "corporate"].map((t) => (
          <TouchableOpacity key={t} style={[styles.toggleBtn, form.user_type === t && styles.toggleActive]} onPress={() => set("user_type", t)}>
            <Text style={[styles.toggleText, form.user_type === t && styles.toggleTextActive]}>
              {t === "student" ? "🎓 Student" : "💼 Corporate"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput style={styles.input} placeholder={form.user_type === "student" ? "College Name" : "Company Name"} placeholderTextColor="#9ca3af"
        value={form.college_or_company} onChangeText={(v) => set("college_or_company", v)} />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.btn} onPress={handleSignup} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.link}>Already have an account? <Text style={styles.linkBold}>Sign in</Text></Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  inner: { paddingHorizontal: 28, paddingTop: 60, paddingBottom: 40 },
  logo: { fontSize: 40, textAlign: "center", marginBottom: 6 },
  title: { fontSize: 28, fontWeight: "700", textAlign: "center", color: "#16a34a", marginBottom: 24 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginBottom: 12, color: "#111827" },
  toggle: { flexDirection: "row", gap: 10, marginBottom: 12 },
  toggleBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", alignItems: "center", backgroundColor: "#fff" },
  toggleActive: { backgroundColor: "#16a34a", borderColor: "#16a34a" },
  toggleText: { fontSize: 14, color: "#6b7280", fontWeight: "500" },
  toggleTextActive: { color: "#fff", fontWeight: "700" },
  error: { color: "#ef4444", fontSize: 13, marginBottom: 8 },
  btn: { backgroundColor: "#16a34a", borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 4, marginBottom: 20 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  link: { textAlign: "center", color: "#6b7280", fontSize: 14 },
  linkBold: { color: "#16a34a", fontWeight: "600" },
});
