"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/auth/login"); return; }
      setUser({ email: data.user.email! });
      setLoading(false);
    });
  }, [router]);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold mb-2">Welcome back 👋</h1>
        <p className="text-gray-500 text-sm mb-6">{user?.email}</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/rides/new"
            className="bg-green-600 text-white rounded-xl p-6 hover:bg-green-700 transition text-center">
            <div className="text-3xl mb-2">➕</div>
            <div className="font-semibold text-lg">Offer a Ride</div>
            <div className="text-sm opacity-80 mt-1">Share your bike with others</div>
          </Link>
          <Link href="/rides"
            className="bg-white border rounded-xl p-6 hover:border-green-500 transition text-center">
            <div className="text-3xl mb-2">🔍</div>
            <div className="font-semibold text-lg">Find a Ride</div>
            <div className="text-sm text-gray-500 mt-1">Browse available rides</div>
          </Link>
          <Link href="/profile"
            className="bg-white border rounded-xl p-6 hover:border-green-500 transition text-center">
            <div className="text-3xl mb-2">👤</div>
            <div className="font-semibold text-lg">My Profile</div>
            <div className="text-sm text-gray-500 mt-1">View your rides & details</div>
          </Link>
        </div>
      </main>
    </div>
  );
}
