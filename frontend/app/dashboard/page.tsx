"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Iridescence from "@/components/Iridescence";
import Link from "next/link";

interface Profile {
  full_name: string;
  user_type: string;
  college_or_company: string;
}

interface Ride {
  id: string;
  origin: string;
  destination: string;
  departure_time: string;
  status: string;
  suggested_fare?: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recentRides, setRecentRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push("/auth/login"); return; }
      const [p, rides] = await Promise.all([
        apiFetch<Profile>("/users/me").catch(() => null),
        apiFetch<Ride[]>("/rides/my").catch(() => []),
      ]);
      setProfile(p);
      setRecentRides(rides.slice(0, 3));
      setLoading(false);
    });
  }, [router]);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const initials = profile?.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* Hero greeting */}
        <div className="relative rounded-2xl overflow-hidden mb-8 h-48 sm:h-56">
          {/* Iridescence background */}
          <div className="absolute inset-0">
            <Iridescence color={[0.3, 0.5, 1.0]} speed={0.8} amplitude={0.12} mouseReact={true} />
          </div>
          {/* Overlay for readability */}
          <div className="absolute inset-0 bg-blue-900/40" />
          {/* Content */}
          <div className="relative z-10 h-full flex items-center justify-between px-8 text-white">
            <div>
              <p className="text-blue-100 text-sm mb-1">Good to see you,</p>
              <h1 className="text-3xl font-bold mb-1">Hey, {firstName} 👋</h1>
              <p className="text-blue-100 text-sm">
                {profile?.user_type === "student" ? "🎓" : "💼"} {profile?.college_or_company}
              </p>
            </div>
            <div className="hidden sm:flex w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm items-center justify-center text-2xl font-bold border border-white/30">
              {initials}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link href="/rides/new"
            className="group bg-blue-600 text-white rounded-2xl p-6 hover:bg-blue-700 transition-all hover:shadow-lg hover:-translate-y-0.5">
            <div className="text-4xl mb-3">🏍️</div>
            <div className="font-bold text-lg">Offer a Ride</div>
            <div className="text-sm text-blue-100 mt-1">Share your bike seat</div>
            <div className="mt-4 text-xs text-blue-200 group-hover:text-white transition">Get started →</div>
          </Link>
          <Link href="/rides"
            className="group bg-white border border-gray-200 rounded-2xl p-6 hover:border-blue-400 hover:shadow-lg transition-all hover:-translate-y-0.5">
            <div className="text-4xl mb-3">🔍</div>
            <div className="font-bold text-lg text-gray-800">Find a Ride</div>
            <div className="text-sm text-gray-500 mt-1">Browse available rides</div>
            <div className="mt-4 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition">Browse now →</div>
          </Link>
          <Link href="/profile"
            className="group bg-white border border-gray-200 rounded-2xl p-6 hover:border-blue-400 hover:shadow-lg transition-all hover:-translate-y-0.5">
            <div className="text-4xl mb-3">👤</div>
            <div className="font-bold text-lg text-gray-800">My Profile</div>
            <div className="text-sm text-gray-500 mt-1">Manage your account</div>
            <div className="mt-4 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition">View profile →</div>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Recent rides */}
          <div className="sm:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800">My Recent Rides</h2>
              <Link href="/rides" className="text-xs text-blue-600 hover:underline">View all</Link>
            </div>
            {recentRides.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-4xl mb-2">🛣️</p>
                <p className="text-gray-400 text-sm">No rides yet. Offer or find one!</p>
                <Link href="/rides/new" className="inline-block mt-3 text-sm text-blue-600 font-medium hover:underline">
                  Offer your first ride →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentRides.map((ride) => (
                  <Link key={ride.id} href={`/rides/${ride.id}`}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{ride.origin} → {ride.destination}</p>
                      <p className="text-xs text-gray-400 mt-0.5">🕐 {new Date(ride.departure_time).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {ride.suggested_fare ? <span className="text-xs font-medium text-blue-700">₹{ride.suggested_fare}</span> : null}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        ride.status === "open" ? "bg-blue-100 text-blue-700" :
                        ride.status === "full" ? "bg-yellow-100 text-yellow-700" :
                        ride.status === "completed" ? "bg-purple-100 text-purple-700" :
                        "bg-gray-100 text-gray-500"
                      }`}>{ride.status}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Tips / info panel */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-800 mb-4">Quick Tips</h2>
            <div className="space-y-4">
              {[
                { icon: "💰", title: "Fare is negotiable", desc: "Suggest a fare when offering — passengers can counter-offer." },
                { icon: "🗺️", title: "Use location search", desc: "Pick exact spots for accurate route maps and fare estimates." },
                { icon: "⭐", title: "Rate your rides", desc: "After a completed ride, leave a rating to build trust." },
                { icon: "💬", title: "Chat with riders", desc: "Once accepted, use in-ride chat to coordinate pickup." },
              ].map((tip, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-xl shrink-0">{tip.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">{tip.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
