"use client";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

interface Profile {
  id: string;
  full_name: string;
  college_or_company: string;
  completed_rides: number;
  co2_saved_kg: number;
  rating: number;
  avatar_url?: string;
  credits: number; // for gamification score
}

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"rides" | "co2" | "rating">("rides");

  useEffect(() => {
    async function fetchLeaders() {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, college_or_company, completed_rides, co2_saved_kg, rating, avatar_url, credits")
        .order("completed_rides", { ascending: false })
        .limit(20);
      
      if (data) setLeaders(data as Profile[]);
      setLoading(false);
    }
    fetchLeaders();
  }, []);

  const sortedLeaders = useMemo(() => {
    return [...leaders].sort((a, b) => {
      if (filter === "rides") return b.completed_rides - a.completed_rides;
      if (filter === "co2") return b.co2_saved_kg - a.co2_saved_kg;
      if (filter === "rating") return b.rating - a.rating;
      return 0;
    });
  }, [leaders, filter]);

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8 relative">
        <div className="relative mb-12 text-center p-10 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl overflow-hidden shadow-xl text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400 opacity-20 rounded-full blur-3xl -ml-10 -mb-10"></div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 relative z-10 drop-shadow-sm">Campus Leaderboard 🏆</h1>
          <p className="text-blue-100 text-lg relative z-10 max-w-lg mx-auto">See who is making the biggest impact. Compete with your college peers to climb the ranks and save the planet!</p>
        </div>

        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          <button onClick={() => setFilter("rides")} className={`px-5 py-2 rounded-full font-semibold transition ${filter === 'rides' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}>🏁 Top Riders</button>
          <button onClick={() => setFilter("co2")} className={`px-5 py-2 rounded-full font-semibold transition ${filter === 'co2' ? 'bg-emerald-500 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}>🌲 Eco Warriors (CO₂)</button>
          <button onClick={() => setFilter("rating")} className={`px-5 py-2 rounded-full font-semibold transition ${filter === 'rating' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}>⭐ Highest Rated</button>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-2 sm:p-4 overflow-hidden">
          <div className="space-y-3">
            {sortedLeaders.map((user, index) => (
              <div key={user.id} className="group flex items-center p-4 rounded-2xl hover:bg-indigo-50/50 transition-colors border border-transparent hover:border-indigo-100">
                <div className="w-10 text-center font-black text-2xl text-gray-300 group-hover:text-indigo-400 transition pr-4 shrink-0">
                  {index === 0 ? "👑" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                </div>
                
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.full_name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    user.full_name.charAt(0).toUpperCase()
                  )}
                </div>
                
                <div className="ml-4 flex-grow">
                  <h3 className="font-bold text-gray-900 group-hover:text-indigo-900 transition">{user.full_name}</h3>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{user.college_or_company}</p>
                </div>
                
                <div className="text-right flex space-x-6 items-center w-32 justify-end">
                  {filter === "rides" && (
                    <div className="text-xl font-black text-indigo-600">{user.completed_rides} <span className="text-xs font-medium text-gray-400">rides</span></div>
                  )}
                  {filter === "co2" && (
                    <div className="text-xl font-black text-emerald-600">{user.co2_saved_kg.toFixed(1)} <span className="text-xs font-medium text-gray-400">kg</span></div>
                  )}
                  {filter === "rating" && (
                    <div className="text-xl font-black text-amber-500">{user.rating.toFixed(1)} <span className="text-sm">⭐</span></div>
                  )}
                </div>
              </div>
            ))}
            
            {sortedLeaders.length === 0 && (
              <div className="py-20 text-center text-gray-500">
                <p className="text-4xl mb-3">🚀</p>
                <p>No riders on the board yet.<br/>Time to grab the #1 spot!</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
