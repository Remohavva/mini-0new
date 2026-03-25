import { useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { apiFetch } from "@/lib/api";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  ride_id?: string;
  read: boolean;
  created_at: string;
};

const typeIcon: Record<string, string> = {
  ride_request: "🙋",
  request_accepted: "✅",
  request_rejected: "❌",
  ride_started: "🚀",
  ride_completed: "🏁",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  async function fetchNotifications() {
    const data = await apiFetch<Notification[]>("/notifications/").catch(() => []);
    setNotifications(data);
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  async function handleMarkAllRead() {
    await apiFetch("/notifications/read-all", { method: "PATCH" }).catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <View style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.subtitle}>{unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}</Text>
      </View>

      {notifications.length > 0 && (
        <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn}>
          <Text style={styles.markAllBtnText}>Mark all read</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No notifications yet</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={async () => {
              if (!item.read) {
                await apiFetch(`/notifications/${item.id}/read`, { method: "PATCH" }).catch(() => {});
                setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
              }
              if (item.ride_id) router.push(`/ride/${item.ride_id}` as never);
            }}
            style={[styles.item, !item.read && styles.itemUnread]}
          >
            <Text style={styles.icon}>{typeIcon[item.type] ?? "📢"}</Text>
            <View style={styles.itemBody}>
              <Text style={[styles.itemTitle, !item.read && { fontWeight: "800" }]}>{item.title}</Text>
              <Text style={styles.itemBodyText} numberOfLines={2}>
                {item.body}
              </Text>
              <Text style={styles.itemTime}>{timeAgo(item.created_at)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f9fafb", paddingHorizontal: 16, paddingTop: 18 },
  header: { marginBottom: 12 },
  title: { fontSize: 22, fontWeight: "800", color: "#111827", marginBottom: 2 },
  subtitle: { fontSize: 13, fontWeight: "600", color: "#6b7280" },
  list: { paddingBottom: 30 },
  empty: { textAlign: "center", color: "#9ca3af", marginTop: 40 },
  markAllBtn: { alignSelf: "flex-end", marginBottom: 10, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#eff6ff", borderRadius: 10 },
  markAllBtnText: { color: "#2563eb", fontWeight: "700" },
  item: { flexDirection: "row", gap: 10, backgroundColor: "#fff", borderWidth: 1, borderColor: "#f3f4f6", padding: 14, borderRadius: 14, marginBottom: 10 },
  itemUnread: { borderColor: "#93c5fd" },
  icon: { fontSize: 20, width: 24 },
  itemBody: { flex: 1 },
  itemTitle: { color: "#111827", fontSize: 14 },
  itemBodyText: { color: "#6b7280", fontSize: 12, marginTop: 4 },
  itemTime: { color: "#9ca3af", fontSize: 11, marginTop: 6 },
});

