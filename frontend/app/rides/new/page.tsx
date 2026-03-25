"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import LocationSearch from "@/components/LocationSearch";
import RideMapWrapper from "@/components/RideMapWrapper";

const RATE_PER_KM = 4;
const MIN_FARE = 20;

const DAYS = [
  { label: "Su", value: 0 },
  { label: "Mo", value: 1 },
  { label: "Tu", value: 2 },
  { label: "We", value: 3 },
  { label: "Th", value: 4 },
  { label: "Fr", value: 5 },
  { label: "Sa", value: 6 },
];

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function NewRidePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    origin: "", destination: "", departure_time: "",
    bike_model: "", notes: "",
  });
  const [originCoords, setOriginCoords] = useState<[number, number] | undefined>();
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | undefined>();
  const [suggestedFare, setSuggestedFare] = useState<number | null>(null);
  const [fareKm, setFareKm] = useState<number | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch<{ bike_model?: string }>("/users/me").then((p) => {
      if (p.bike_model) setForm((f) => ({ ...f, bike_model: p.bike_model! }));
    }).catch(() => {});
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function toggleDay(day: number) {
    setRecurrenceDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function handleLocationChange(key: "origin" | "destination", val: string, coords?: [number, number]) {
    setForm((f) => ({ ...f, [key]: val }));
    if (key === "origin") setOriginCoords(coords);
    else setDestinationCoords(coords);
    const o = key === "origin" ? coords : originCoords;
    const d = key === "destination" ? coords : destinationCoords;
    if (o && d) {
      const km = haversineKm(o[0], o[1], d[0], d[1]);
      setFareKm(Math.round(km * 10) / 10);
      setSuggestedFare(Math.max(Math.round(km * RATE_PER_KM), MIN_FARE));
    } else {
      setSuggestedFare(null);
      setFareKm(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isRecurring && recurrenceDays.length === 0) {
      setError("Please select at least one day for recurring rides.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const ride = await apiFetch<{ id: string }>("/rides/", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          available_seats: 1,
          departure_time: new Date(form.departure_time).toISOString(),
          origin_lat: originCoords?.[0],
          origin_lon: originCoords?.[1],
          destination_lat: destinationCoords?.[0],
          destination_lon: destinationCoords?.[1],
          suggested_fare: suggestedFare ?? 0,
          is_recurring: isRecurring,
          recurrence_days: isRecurring ? recurrenceDays : [],
        }),
      });
      router.push(`/rides/${ride.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create ride");
    }
    setLoading(false);
  }

  return (
    <div>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Offer a Ride</h1>
        <div className="grid grid-cols-1 gap-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">From</label>
              <LocationSearch placeholder="e.g. Koramangala, Bangalore" value={form.origin}
                onChange={(val, coords) => handleLocationChange("origin", val, coords)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">To</label>
              <LocationSearch placeholder="e.g. Whitefield, Bangalore" value={form.destination}
                onChange={(val, coords) => handleLocationChange("destination", val, coords)} />
            </div>

            {suggestedFare !== null && (
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Suggested Fare</p>
                  <p className="text-xs text-green-600">{fareKm} km · ₹{RATE_PER_KM}/km · min ₹{MIN_FARE}</p>
                </div>
                <p className="text-2xl font-bold text-green-700">₹{suggestedFare}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Departure Time</label>
              <input type="datetime-local" name="departure_time" required value={form.departure_time} onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>

            {/* Recurring toggle */}
            <div className="border rounded-xl p-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />
                  <div className={`w-10 h-6 rounded-full transition ${isRecurring ? "bg-green-500" : "bg-gray-200"}`} />
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isRecurring ? "translate-x-4" : ""}`} />
                </div>
                <span className="text-sm font-medium">Recurring ride</span>
                <span className="text-xs text-gray-400">Repeats on selected days</span>
              </label>

              {isRecurring && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Select days</p>
                  <div className="flex gap-2">
                    {DAYS.map((d) => (
                      <button key={d.value} type="button" onClick={() => toggleDay(d.value)}
                        className={`w-9 h-9 rounded-full text-xs font-semibold transition ${
                          recurrenceDays.includes(d.value)
                            ? "bg-green-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button type="button" onClick={() => setRecurrenceDays([1,2,3,4,5])}
                      className="text-xs text-green-600 hover:underline">Weekdays</button>
                    <button type="button" onClick={() => setRecurrenceDays([0,6])}
                      className="text-xs text-green-600 hover:underline">Weekends</button>
                    <button type="button" onClick={() => setRecurrenceDays([0,1,2,3,4,5,6])}
                      className="text-xs text-green-600 hover:underline">Every day</button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Bike Model (optional)</label>
              <input name="bike_model" value={form.bike_model} onChange={handleChange}
                placeholder="e.g. Royal Enfield Classic 350"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes (optional)</label>
              <textarea name="notes" value={form.notes} onChange={handleChange}
                placeholder="Any additional info..."
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" rows={3} />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition">
              {loading ? "Creating..." : "Create Ride"}
            </button>
          </form>

          <RideMapWrapper origin={form.origin} destination={form.destination}
            originCoords={originCoords} destinationCoords={destinationCoords} />
        </div>
      </main>
    </div>
  );
}
