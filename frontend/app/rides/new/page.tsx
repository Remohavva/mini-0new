"use client";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import LocationSearch from "@/components/LocationSearch";
import RideMapWrapper from "@/components/RideMapWrapper";

export default function NewRidePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    origin: "",
    destination: "",
    departure_time: "",
    available_seats: 1,
    bike_model: "",
    notes: "",
  });
  const [originCoords, setOriginCoords] = useState<[number, number] | undefined>();
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | undefined>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const ride = await apiFetch<{ id: string }>("/rides", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          available_seats: Number(form.available_seats),
          departure_time: new Date(form.departure_time).toISOString(),
          origin_lat: originCoords?.[0],
          origin_lon: originCoords?.[1],
          destination_lat: destinationCoords?.[0],
          destination_lon: destinationCoords?.[1],
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
              <LocationSearch
                placeholder="e.g. Koramangala, Bangalore"
                value={form.origin}
                onChange={(val, coords) => { setForm((f) => ({ ...f, origin: val })); setOriginCoords(coords); }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">To</label>
              <LocationSearch
                placeholder="e.g. Whitefield, Bangalore"
                value={form.destination}
                onChange={(val, coords) => { setForm((f) => ({ ...f, destination: val })); setDestinationCoords(coords); }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Departure Time</label>
              <input type="datetime-local" name="departure_time" required value={form.departure_time} onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Available Seats</label>
              <input type="number" name="available_seats" min={1} max={3} required value={form.available_seats} onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
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

          {/* Live map preview */}
          <RideMapWrapper
            origin={form.origin}
            destination={form.destination}
            originCoords={originCoords}
            destinationCoords={destinationCoords}
          />
        </div>
      </main>
    </div>
  );
}
