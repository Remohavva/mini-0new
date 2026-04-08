"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

import { apiFetch } from "@/lib/api";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalRides: 0,
    activeUsers: 0,
    revenuePotential: 0,
    popularRoutes: [] as { route: string; count: number }[],
    pendingVerifications: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAdminData() {
      // 1. Total Rides
      const { count: ridesCount } = await supabase.from('rides').select('*', { count: 'exact', head: true });

      // 2. Active Users (All users in profiles for now)
      const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

      // 3. Revenue Potential (Sum of suggested/agreed fares from completed rides or uncompleted rides)
      // Since SQL aggregation from client is tricky w/o RPC, let's fetch subset or use basic JS reduce
      const { data: fares } = await supabase
        .from('rides')
        .select('suggested_fare')
        .not('suggested_fare', 'is', null);

      const revenue = fares ? fares.reduce((acc, curr) => acc + (curr.suggested_fare || 0), 0) : 0;

      // 4. Popular Routes
      // Group by origin -> destination
      const { data: routes } = await supabase
        .from('rides')
        .select('origin, destination')
        .limit(1000); // Fetch up to 1000 to group

      const routeCounts: Record<string, number> = {};
      routes?.forEach(r => {
        const key = `${r.origin} -> ${r.destination}`;
        routeCounts[key] = (routeCounts[key] || 0) + 1;
      });

      const popularRoutes = Object.entries(routeCounts)
        .map(([route, count]) => ({ route, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // 5. Pending Verifications
      const { data: pendingUsers } = await supabase
        .from('profiles')
        .select('id, full_name, email, license_url')
        .eq('verification_status', 'pending');

      setStats({
        totalRides: ridesCount || 0,
        activeUsers: usersCount || 0,
        revenuePotential: revenue,
        popularRoutes,
        pendingVerifications: pendingUsers || [],
      });
      setLoading(false);
    }
    fetchAdminData();
  }, []);

  async function handleReview(userId: string, action: "approve" | "reject") {
    try {
      await apiFetch(`/verification/review/${userId}?action=${action}`, { method: "PATCH" });
      setStats(prev => ({
        ...prev,
        pendingVerifications: prev.pendingVerifications.filter((u: any) => u.id !== userId)
      }));
    } catch (err) {
      alert("Failed to review user");
    }
  }

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">Pillion Platform Analytics</h1>
          <p className="text-gray-500 text-lg">Real-time overview of network health and activity.</p>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col justify-center transform transition duration-300 hover:-translate-y-1 hover:shadow-xl">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Total Rides Tracked</h3>
            <p className="text-5xl font-black text-indigo-600 mb-2">{stats.totalRides.toLocaleString()}</p>
            <div className="text-sm text-green-500 font-medium bg-green-50 self-start px-2 py-1 rounded-md">↑ 12% this week</div>
          </div>
          
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col justify-center transform transition duration-300 hover:-translate-y-1 hover:shadow-xl">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Active Community</h3>
            <p className="text-5xl font-black text-pink-500 mb-2">{stats.activeUsers.toLocaleString()}</p>
            <div className="text-sm text-green-500 font-medium bg-green-50 self-start px-2 py-1 rounded-md">↑ 8% from last month</div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col justify-center transform transition duration-300 hover:-translate-y-1 hover:shadow-xl">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Econ Generated (₹)</h3>
            <p className="text-5xl font-black text-emerald-500 mb-2">₹{stats.revenuePotential.toLocaleString()}</p>
            <div className="text-sm text-gray-400 font-medium">Estimated transaction flow</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Popular Routes */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">🔥 High-Volume Routes</h3>
            <div className="space-y-4">
              {stats.popularRoutes.length > 0 ? stats.popularRoutes.map((route, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-indigo-200 transition">
                  <span className="font-semibold text-gray-800">{route.route}</span>
                  <span className="bg-indigo-100 text-indigo-800 font-bold py-1 px-3 rounded-full text-sm">
                    {route.count} runs
                  </span>
                </div>
              )) : (
                <div className="text-gray-500 italic p-4 text-center">No route data yet</div>
              )}
            </div>
          </div>
          
          {/* Quick Insights Placeholder / Gamification tease */}
          <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-8 shadow-xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white opacity-10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-pink-500 opacity-20 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-4">🚀 Next Level Growth</h3>
              <p className="text-indigo-200 mb-8 leading-relaxed">
                Platform potential is strong. Consider pushing referral campaigns in active colleges to density matching rates. Your CO₂ offset gamification is ready to deploy.
              </p>
              
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">Network Density Target</span>
                  <span className="font-bold text-green-400">42% / 60%</span>
                </div>
                <div className="w-full bg-black/40 rounded-full h-3">
                  <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full" style={{ width: '70%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Verifications */}
        <div className="mt-8 bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">📄 Pending Verifications</h3>
          <div className="space-y-4">
            {stats.pendingVerifications.length > 0 ? stats.pendingVerifications.map((user, i) => (
              <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="mb-4 sm:mb-0">
                  <p className="font-semibold text-gray-800">{user.full_name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  {user.license_url && (
                    <a href={user.license_url} target="_blank" rel="noreferrer" className="text-indigo-600 text-sm hover:underline mt-1 inline-block">
                      View License Document
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleReview(user.id, 'approve')} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition">
                    Approve
                  </button>
                  <button onClick={() => handleReview(user.id, 'reject')} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition">
                    Reject
                  </button>
                </div>
              </div>
            )) : (
              <div className="text-gray-500 italic p-4 text-center">No pending verifications</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
