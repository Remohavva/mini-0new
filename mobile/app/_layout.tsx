import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    supabase.auth.onAuthStateChange((_event, session) => {
      const inAuth = segments[0] === "(auth)";
      if (!session && !inAuth) {
        router.replace("/(auth)/login");
      } else if (session && inAuth) {
        router.replace("/(tabs)/dashboard");
      }
    });
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
