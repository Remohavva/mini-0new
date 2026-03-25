"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import Navbar from "@/components/Navbar";
import MiniRideMapWrapper from "@/components/MiniRideMapWrapper";
import Link from "next/link";

interface Ride {
  id: string;
  origin: string;
  destination: string;
  departure_time: string;
  available_seats: number;
  status: string;
  bike_model?: string;
  rider_id: string;
}

export default function RidesPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "my">("all");

  async function fetchRides() {
    setLoading(true);
    if (tab === "my") {
      const data = await apiFetch<Ride[]>(`/rides/my`).catch(() => []);
      setRides(data);
    } else {
      const params = new URLSearchParams({ status: "open" });
      if (origin) params.set("origin", origin);
      if (destination) params.set("destination", destination);
      const data = await apiFetch<Ride[]>(`/rides?${params}`).catch(() => []);
      setRides(data);
    }
    setLoading(false);
  }

  useEffect(() => { fetchRides(); }, [tab]); // eslint-disable-line

  return (
    <div>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Rides</h1>
          <Link href="/rides/new" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
            + Offer Ride
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab("all")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${tab === "all" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            Available
          </button>
          <button onClick={() => setTab("my")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${tab === "my" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            My Rides
          </button>
        </div>

        {tab === "all" && (
          <div className="flex gap-3 mb-6">
            <input placeholder="From..." value={origin} onChange={(e) => setOrigin(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            <input placeholder="To..." value={destination} onChange={(e) => setDestination(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            <button onClick={fetchRides} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
              Search
            </button>
          </div>
        )}

        {loading ? (
          <p className="text-gray-500">Loading rides...</p>
        ) : rides.length === 0 ? (
          <p className="text-gray-500">No rides found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rides.map((ride) => (
              <Link key={ride.id} href={`/rides/${ride.id}`}
                className="block bg-white border rounded-xl overflow-hidden hover:border-green-400 hover:shadow-md transition">
                <MiniRideMapWrapper origin={ride.origin} destination={ride.destination} />
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold text-base leading-tight">
                      {ride.origin} → {ride.destination}
                    </p>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium ml-2 shrink-0">
                      {ride.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    🕐 {new Date(ride.departure_time).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    💺 {ride.available_seats} seat{ride.available_seats !== 1 ? "s" : ""}
                    {ride.bike_model && ` · 🏍️ ${ride.bike_model}`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
