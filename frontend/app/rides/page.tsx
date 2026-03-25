"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { geocode } from "@/lib/geocode";
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
  suggested_fare?: number;
  origin_lat?: number;
  origin_lon?: number;
  destination_lat?: number;
  destination_lon?: number;
}

const RATE_PER_KM = 4;
const MIN_FARE = 20;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function FareTag({ ride }: { ride: Ride }) {
  const [fare, setFare] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Use stored fare first
    if (ride.suggested_fare && ride.suggested_fare > 0) {
      setFare(ride.suggested_fare);
      return;
    }
    // Use stored coords
    if (ride.origin_lat && ride.origin_lon && ride.destination_lat && ride.destination_lon) {
      const km = haversineKm(ride.origin_lat, ride.origin_lon, ride.destination_lat, ride.destination_lon);
      setFare(Math.max(Math.round(km * RATE_PER_KM), MIN_FARE));
      return;
    }
    // Geocode as last resort
    setLoading(true);
    Promise.all([geocode(ride.origin), geocode(ride.destination)]).then(([oRes, dRes]) => {
      const o = oRes[0];
      const d = dRes[0];
      if (o && d) {
        const km = haversineKm(parseFloat(o.lat as unknown as string), parseFloat(o.lon as unknown as string), parseFloat(d.lat as unknown as string), parseFloat(d.lon as unknown as string));
        setFare(Math.max(Math.round(km * RATE_PER_KM), MIN_FARE));
      }
      setLoading(false);
    });
  }, [ride]);

  if (loading) return <p className="text-xs text-gray-400 mt-1.5 animate-pulse">Calculating fare...</p>;
  if (!fare) return null;

  const isEstimate = !ride.suggested_fare || ride.suggested_fare === 0;
  return (
    <div className="flex items-center gap-1.5 mt-2">
      <span className="text-sm font-bold text-green-700">₹{fare}</span>
      {isEstimate && (
        <span className="text-xs bg-yellow-50 text-yellow-600 border border-yellow-200 px-1.5 py-0.5 rounded-full">est.</span>
      )}
    </div>
  );
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

        <div className="flex gap-2 mb-4">
          {(["all", "my"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${tab === t ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {t === "all" ? "Available" : "My Rides"}
            </button>
          ))}
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
                <MiniRideMapWrapper key={`${ride.id}-map`} origin={ride.origin} destination={ride.destination} />
                <div className="p-4">
                  <div className="flex justify-between items-start mb-1">
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
                  <FareTag ride={ride} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
