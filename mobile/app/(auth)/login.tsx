import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else router.replace("/(tabs)/dashboard");
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.inner}>
        <Text style={styles.logo}>🏍️</Text>
        <Text style={styles.title}>Pillion</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#9ca3af"
          value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#9ca3af"
          value={password} onChangeText={setPassword} secureTextEntry />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign In</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
          <Text style={styles.link}>Don't have an account? <Text style={styles.linkBold}>Sign up</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  inner: { flex: 1, justifyContent: "center", paddingHorizontal: 28 },
  logo: { fontSize: 48, textAlign: "center", marginBottom: 8 },
  title: { fontSize: 32, fontWeight: "700", textAlign: "center", color: "#16a34a", marginBottom: 4 },
  subtitle: { fontSize: 15, color: "#6b7280", textAlign: "center", marginBottom: 32 },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginBottom: 12, color: "#111827" },
  error: { color: "#ef4444", fontSize: 13, marginBottom: 8 },
  btn: { backgroundColor: "#16a34a", borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 4, marginBottom: 20 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  link: { textAlign: "center", color: "#6b7280", fontSize: 14 },
  linkBold: { color: "#16a34a", fontWeight: "600" },
});
