"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import RatingStars from "@/components/RatingStars";

interface Ride {
  id: string;
  origin: string;
  destination: string;
  departure_time: string;
  status: string;
  suggested_fare?: number;
  bike_model?: string;
  rider_id: string;
  completed_at?: string;
}

interface Stats {
  total: number;
  completed: number;
  total_fare: number;
  as_rider: number;
  as_passenger: number;
}

export default function HistoryPage() {
  const router = useRouter();
  const [rides, setRides] = useState<Ride[]>([]);
  const [passengerRides, setPassengerRides] = useState<Ride[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, completed: 0, total_fare: 0, as_rider: 0, as_passenger: 0 });
  const [tab, setTab] = useState<"rider" | "passenger">("rider");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { router.push("/auth/login"); return; }
      setUserId(data.user.id);

      // My rides as rider (all statuses)
      const myRides = await apiFetch<Ride[]>("/rides/my").catch(() => []);
      setRides(myRides);

      // Rides I joined as passenger (accepted requests)
      const myRequests = await apiFetch<{ ride_id: string; agreed_fare?: number; status: string }[]>(
        "/rides/my-requests"
      ).catch(() => []);
      const acceptedRideIds = myRequests.filter((r) => r.status === "accepted").map((r) => r.ride_id);

      // Fetch those rides
      const joined: Ride[] = [];
      for (const rideId of acceptedRideIds.slice(0, 20)) {
        const r = await apiFetch<Ride>(`/rides/${rideId}`).catch(() => null);
        if (r) joined.push(r);
      }
      setPassengerRides(joined);

      // Compute stats
      const completedRider = myRides.filter((r) => r.status === "completed");
      const completedPassenger = joined.filter((r) => r.status === "completed");
      const totalFare = [...completedRider, ...completedPassenger].reduce((sum, r) => sum + (r.suggested_fare ?? 0), 0);

      setStats({
        total: myRides.length + joined.length,
        completed: completedRider.length + completedPassenger.length,
        total_fare: totalFare,
        as_rider: myRides.length,
        as_passenger: joined.length,
      });
      setLoading(false);
    }
    load();
  }, [router]);

  const displayRides = tab === "rider" ? rides : passengerRides;

  const statusColor: Record<string, string> = {
    open: "bg-green-100 text-green-700",
    full: "bg-yellow-100 text-yellow-700",
    started: "bg-blue-100 text-blue-700",
    completed: "bg-purple-100 text-purple-700",
    cancelled: "bg-gray-100 text-gray-500",
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Ride History</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total Rides", value: stats.total, icon: "🛣️" },
            { label: "Completed", value: stats.completed, icon: "✅" },
            { label: "As Rider", value: stats.as_rider, icon: "🏍️" },
            { label: "Fare Paid/Earned", value: `₹${stats.total_fare}`, icon: "💰" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border p-4 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {(["rider", "passenger"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${tab === t ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {t === "rider" ? "🏍️ As Rider" : "🙋 As Passenger"}
            </button>
          ))}
        </div>

        {displayRides.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">🛣️</div>
            <p>No rides yet in this category.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayRides.map((ride) => (
              <Link key={ride.id} href={`/rides/${ride.id}`}
                className="block bg-white border rounded-xl p-4 hover:border-green-400 transition">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">{ride.origin} → {ride.destination}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      🕐 {new Date(ride.departure_time).toLocaleString()}
                      {ride.completed_at && ` · Completed ${new Date(ride.completed_at).toLocaleDateString()}`}
                    </p>
                    {ride.bike_model && <p className="text-xs text-gray-400 mt-0.5">🏍️ {ride.bike_model}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[ride.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {ride.status}
                    </span>
                    {ride.suggested_fare && (
                      <span className="text-sm font-bold text-green-700">₹{ride.suggested_fare}</span>
                    )}
                  </div>
                </div>
                {ride.status === "completed" && (
                  <div className="mt-2 pt-2 border-t flex items-center gap-2">
                    <RatingStars value={0} readonly size="sm" />
                    <span className="text-xs text-gray-400">Tap to rate</span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
