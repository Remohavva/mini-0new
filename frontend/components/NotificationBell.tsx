"use client";
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  ride_id?: string;
  read: boolean;
  created_at: string;
}

const typeIcon: Record<string, string> = {
  ride_request: "🙋",
  request_accepted: "✅",
  request_rejected: "❌",
  ride_started: "🚀",
  ride_completed: "🏁",
};

export default function NotificationBell() {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);

  async function fetchNotifications() {
    const data = await apiFetch<Notification[]>("/notifications/").catch(() => []);
    setNotifications(data);
    setUnread(data.filter((n) => !n.read).length);
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleOpen() {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen && unread > 0) {
      await apiFetch("/notifications/read-all", { method: "PATCH" });
      setUnread(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }

  async function handleNotificationClick(n: Notification) {
    setOpen(false);
    if (!n.read) {
      await apiFetch(`/notifications/${n.id}/read`, { method: "PATCH" }).catch(() => {});
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnread((prev) => Math.max(0, prev - 1));
    }
    if (n.ride_id) router.push(`/rides/${n.ride_id}`);
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={handleOpen} className="relative p-2 focus:outline-none hover:scale-110 transition-transform" aria-label="Notifications">
        <span className="text-xl">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <span className="font-semibold text-sm text-slate-900">Notifications</span>
            {notifications.length > 0 && (
              <button
                onClick={async () => {
                  await apiFetch("/notifications/read-all", { method: "PATCH" });
                  setUnread(0);
                  setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                }}
                className="text-xs text-blue-600 hover:text-blue-700 transition"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No notifications yet</p>
            ) : (
              notifications.map((n) => (
                <button key={n.id} onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition ${!n.read ? "bg-blue-50" : ""}`}>
                  <div className="flex gap-3 items-start">
                    <span className="text-lg shrink-0">{typeIcon[n.type] ?? "📢"}</span>
                    <div className="min-w-0">
                      <p className={`text-sm ${!n.read ? "font-semibold text-slate-900" : "text-slate-700"}`}>{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{n.body}</p>
                      <p className="text-xs text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.read && <span className="w-2 h-2 bg-blue-600 rounded-full shrink-0 mt-1" />}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
