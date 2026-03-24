"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import RideMapWrapper from "@/components/RideMapWrapper";
import { geocode } from "@/lib/geocode";

interface Ride {
  id: string;
  rider_id: string;
  origin: string;
  destination: string;
  departure_time: string;
  available_seats: number;
  status: string;
  bike_model?: string;
  notes?: string;
  origin_lat?: number;
  origin_lon?: number;
  destination_lat?: number;
  destination_lon?: number;
}

interface RideRequest {
  id: string;
  requester_id: string;
  status: string;
  message?: string;
}

export default function RideDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [ride, setRide] = useState<Ride | null>(null);
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");
  const [originCoords, setOriginCoords] = useState<[number, number] | undefined>();
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | undefined>();

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id ?? null);
      const rideData = await apiFetch<Ride>(`/rides/${id}`).catch(() => null);
      setRide(rideData);
      if (rideData) {
        // Use stored coords or geocode from text
        if (rideData.origin_lat && rideData.origin_lon) {
          setOriginCoords([rideData.origin_lat, rideData.origin_lon]);
        } else {
          geocode(rideData.origin).then((r) => r[0] && setOriginCoords([parseFloat(r[0].lat as unknown as string), parseFloat(r[0].lon as unknown as string)]));
        }
        if (rideData.destination_lat && rideData.destination_lon) {
          setDestinationCoords([rideData.destination_lat, rideData.destination_lon]);
        } else {
          geocode(rideData.destination).then((r) => r[0] && setDestinationCoords([parseFloat(r[0].lat as unknown as string), parseFloat(r[0].lon as unknown as string)]));
        }
        if (data.user?.id === rideData.rider_id) {
          const reqs = await apiFetch<RideRequest[]>(`/rides/${id}/requests`).catch(() => []);
          setRequests(reqs);
        }
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleRequest() {
    try {
      await apiFetch(`/rides/${id}/requests`, {
        method: "POST",
        body: JSON.stringify({ ride_id: id, message }),
      });
      setActionMsg("Request sent successfully!");
    } catch (err: unknown) {
      setActionMsg(err instanceof Error ? err.message : "Failed to send request");
    }
  }

  async function handleCancel() {
    await apiFetch(`/rides/${id}/cancel`, { method: "PATCH" });
    router.push("/dashboard");
  }

  async function handleRespond(requestId: string, action: "accept" | "reject") {
    await apiFetch(`/rides/${id}/requests/${requestId}?action=${action}`, { method: "PATCH" });
    setRequests((prev) => prev.map((r) => r.id === requestId ? { ...r, status: action + "ed" } : r));
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!ride) return <div className="flex items-center justify-center min-h-screen">Ride not found.</div>;

  const isOwner = currentUserId === ride.rider_id;

  return (
    <div>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold">{ride.origin} → {ride.destination}</h1>
            <span className={`text-sm px-3 py-1 rounded-full font-medium ${
              ride.status === "open" ? "bg-green-100 text-green-700" :
              ride.status === "full" ? "bg-yellow-100 text-yellow-700" :
              "bg-gray-100 text-gray-500"
            }`}>{ride.status}</span>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <p>🕐 {new Date(ride.departure_time).toLocaleString()}</p>
            <p>💺 {ride.available_seats} seat{ride.available_seats !== 1 ? "s" : ""} available</p>
            {ride.bike_model && <p>🏍️ {ride.bike_model}</p>}
            {ride.notes && <p>📝 {ride.notes}</p>}
          </div>

          {isOwner && ride.status === "open" && (
            <button onClick={handleCancel}
              className="mt-4 text-sm text-red-500 hover:text-red-700 underline">
              Cancel this ride
            </button>
          )}
        </div>

        {/* Map */}
        <div className="mb-6">
          <RideMapWrapper
            origin={ride.origin}
            destination={ride.destination}
            originCoords={originCoords}
            destinationCoords={destinationCoords}
          />
        </div>

        {!isOwner && ride.status === "open" && (
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h2 className="font-semibold mb-3">Request this ride</h2>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)}
              placeholder="Optional message to the rider..."
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500" rows={3} />
            <button onClick={handleRequest}
              className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
              Send Request
            </button>
            {actionMsg && <p className="text-sm mt-2 text-green-600">{actionMsg}</p>}
          </div>
        )}

        {isOwner && requests.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-semibold mb-4">Ride Requests ({requests.length})</h2>
            <div className="space-y-3">
              {requests.map((req) => (
                <div key={req.id} className="border rounded-lg p-3">
                  <p className="text-sm text-gray-500 mb-1">User: {req.requester_id.slice(0, 8)}...</p>
                  {req.message && <p className="text-sm mb-2">{req.message}</p>}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      req.status === "accepted" ? "bg-green-100 text-green-700" :
                      req.status === "rejected" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>{req.status}</span>
                    {req.status === "pending" && (
                      <>
                        <button onClick={() => handleRespond(req.id, "accept")}
                          className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">Accept</button>
                        <button onClick={() => handleRespond(req.id, "reject")}
                          className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">Reject</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
