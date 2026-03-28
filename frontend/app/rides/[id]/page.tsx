"use client";
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import RideMapWrapper from "@/components/RideMapWrapper";
import RatingStars from "@/components/RatingStars";
import SOSButton from "@/components/SOSButton";
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
  suggested_fare?: number;
  origin_lat?: number;
  origin_lon?: number;
  destination_lat?: number;
  destination_lon?: number;
}

interface RideRequest {
  id: string;
  requester_id: string;
  requester_name?: string;
  status: string;
  message?: string;
  suggested_fare?: number;
  offered_fare?: number;
  agreed_fare?: number;
}

interface RideMessage {
  id: string;
  ride_id: string;
  sender_id: string;
  sender_name?: string | null;
  message: string;
  created_at: string;
}

export default function RideDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [ride, setRide] = useState<Ride | null>(null);
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [myRequest, setMyRequest] = useState<RideRequest | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [offerFare, setOfferFare] = useState("");
  const [counterFare, setCounterFare] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");
  const [originCoords, setOriginCoords] = useState<[number, number] | undefined>();
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | undefined>();
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [myRating, setMyRating] = useState<{ rating: number; comment?: string } | null>(null);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [messages, setMessages] = useState<RideMessage[]>([]);
  const [chatText, setChatText] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id ?? null);
      const rideData = await apiFetch<Ride>(`/rides/${id}`).catch(() => null);
      setRide(rideData);
      if (rideData) {
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
        } else if (data.user?.id) {
          const mine = await apiFetch<RideRequest | null>(`/rides/${id}/requests/mine`).catch(() => null);
          setMyRequest(mine);
        }
        // Check if user already rated this ride
        const existingRating = await apiFetch<{ rating: number; comment?: string } | null>(`/ratings/ride/${id}/mine`).catch(() => null);
        if (existingRating) setMyRating(existingRating);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleRequest() {
    try {
      const req = await apiFetch<RideRequest>(`/rides/${id}/requests`, {
        method: "POST",
        body: JSON.stringify({
          ride_id: id,
          message,
          offered_fare: offerFare ? Number(offerFare) : undefined,
        }),
      });
      setMyRequest(req);
      setActionMsg("Request sent successfully!");
    } catch (err: unknown) {
      setActionMsg(err instanceof Error ? err.message : "Failed to send request");
    }
  }

  async function handleNegotiate() {
    if (!myRequest || !counterFare) return;
    try {
      const updated = await apiFetch<RideRequest>(`/rides/${id}/requests/${myRequest.id}/negotiate`, {
        method: "PATCH",
        body: JSON.stringify({ offered_fare: Number(counterFare) }),
      });
      setMyRequest(updated);
      setCounterFare("");
      setActionMsg("Counter-offer sent!");
    } catch (err: unknown) {
      setActionMsg(err instanceof Error ? err.message : "Failed to negotiate");
    }
  }

  async function handleCancel() {
    await apiFetch(`/rides/${id}/cancel`, { method: "PATCH" });
    router.push("/dashboard");
  }

  async function handleStart() {
    await apiFetch(`/rides/${id}/start`, { method: "PATCH" });
    setRide((r) => r ? { ...r, status: "started" } : r);
  }

  async function handleComplete() {
    await apiFetch(`/rides/${id}/complete`, { method: "PATCH" });
    setRide((r) => r ? { ...r, status: "completed" } : r);
  }

  async function handleRate(revieweeId: string) {
    try {
      await apiFetch("/ratings/", {
        method: "POST",
        body: JSON.stringify({ ride_id: id, reviewee_id: revieweeId, rating: ratingValue, comment: ratingComment }),
      });
      setMyRating({ rating: ratingValue, comment: ratingComment });
      setRatingSubmitted(true);
    } catch (err: unknown) {
      setActionMsg(err instanceof Error ? err.message : "Failed to submit rating");
    }
  }

  async function handleRespond(requestId: string, action: "accept" | "reject") {
    await apiFetch(`/rides/${id}/requests/${requestId}?action=${action}`, { method: "PATCH" });
    setRequests((prev) => prev.map((r) => r.id === requestId ? { ...r, status: action + "ed" } : r));
  }

  async function handleSendChat() {
    if (!canChat) return;
    const trimmed = chatText.trim();
    if (!trimmed) return;
    setChatSending(true);
    try {
      await apiFetch(`/rides/${id}/messages`, {
        method: "POST",
        body: JSON.stringify({ message: trimmed }),
      });
      setChatText("");
      await loadMessages();
    } finally {
      setChatSending(false);
    }
  }

  const isOwner = !!ride && !!currentUserId && currentUserId === ride.rider_id;
  const canChat = isOwner ? requests.some((r) => r.status === "accepted") : myRequest?.status === "accepted";

  async function loadMessages() {
    const data = await apiFetch<RideMessage[]>(`/rides/${id}/messages`).catch(() => []);
    setMessages(data);
  }

  useEffect(() => {
    if (!canChat) return;
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canChat, id]);

  useEffect(() => {
    if (!canChat) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, canChat]);

  // Passenger must refresh their request status to unlock chat when the owner accepts.
  useEffect(() => {
    if (isOwner) return;
    if (!ride || !currentUserId) return;
    let cancelled = false;
    async function refreshMyRequest() {
      const mine = await apiFetch<RideRequest | null>(`/rides/${id}/requests/mine`).catch(() => null);
      if (!cancelled) setMyRequest(mine);
    }
    refreshMyRequest();
    const interval = setInterval(refreshMyRequest, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, id, ride]);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!ride) return <div className="flex items-center justify-center min-h-screen">Ride not found.</div>;

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
              ride.status === "started" ? "bg-blue-100 text-blue-700" :
              ride.status === "completed" ? "bg-purple-100 text-purple-700" :
              "bg-gray-100 text-gray-500"
            }`}>{ride.status}</span>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <p>🕐 {new Date(ride.departure_time).toLocaleString()}</p>
            <p>💺 {ride.available_seats} seat{ride.available_seats !== 1 ? "s" : ""} available</p>
            {ride.bike_model && <p>🏍️ {ride.bike_model}</p>}
            {ride.notes && <p>📝 {ride.notes}</p>}
          </div>

          {/* Fare display */}
          {ride.suggested_fare ? (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Suggested Fare</p>
                <p className="text-xs text-green-600">Negotiable</p>
              </div>
              <p className="text-2xl font-bold text-green-700">₹{ride.suggested_fare}</p>
            </div>
          ) : null}

          {/* Owner actions */}
          {isOwner && (
            <div className="mt-4 flex flex-wrap gap-2">
              {(ride.status === "open" || ride.status === "full") && (
                <button onClick={handleStart}
                  className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition">
                  🚀 Start Ride
                </button>
              )}
              {ride.status === "started" && (
                <button onClick={handleComplete}
                  className="text-sm bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 transition">
                  ✅ Complete Ride
                </button>
              )}
              {(ride.status === "open" || ride.status === "full") && (
                <button onClick={handleCancel}
                  className="text-sm text-red-500 hover:text-red-700 underline">
                  Cancel
                </button>
              )}
            </div>
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

        {/* SOS button — shown during active ride */}
        {ride.status === "started" && (
          <div className="mb-6">
            <SOSButton rideId={ride.id} />
          </div>
        )}

        {/* Passenger: request form */}
        {!isOwner && ride.status === "open" && !myRequest && (
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h2 className="font-semibold mb-3">Request this ride</h2>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)}
              placeholder="Optional message to the rider..."
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500 mb-3" rows={2} />
            <div className="flex gap-2 items-center mb-3">
              <span className="text-sm text-gray-500 shrink-0">Counter-offer fare (₹)</span>
              <input type="number" value={offerFare} onChange={(e) => setOfferFare(e.target.value)}
                placeholder={ride.suggested_fare ? `Suggested: ₹${ride.suggested_fare}` : "Optional"}
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <button onClick={handleRequest}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
              Send Request
            </button>
            {actionMsg && <p className="text-sm mt-2 text-green-600">{actionMsg}</p>}
          </div>
        )}

        {/* Passenger: my request status */}
        {!isOwner && myRequest && (
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h2 className="font-semibold mb-3">Your Request</h2>
            <div className="space-y-2 text-sm text-gray-600">
              {myRequest.suggested_fare && <p>Rider suggested: <span className="font-medium text-gray-800">₹{myRequest.suggested_fare}</span></p>}
              {myRequest.offered_fare && <p>Your offer: <span className="font-medium text-gray-800">₹{myRequest.offered_fare}</span></p>}
              {myRequest.agreed_fare && <p className="text-green-700 font-medium">Agreed fare: ₹{myRequest.agreed_fare}</p>}
            </div>
            <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${
              myRequest.status === "accepted" ? "bg-green-100 text-green-700" :
              myRequest.status === "rejected" ? "bg-red-100 text-red-700" :
              "bg-yellow-100 text-yellow-700"
            }`}>{myRequest.status}</span>

            {myRequest.status === "pending" && (
              <div className="mt-3 flex gap-2 items-center">
                <input type="number" value={counterFare} onChange={(e) => setCounterFare(e.target.value)}
                  placeholder="New counter-offer (₹)"
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                <button onClick={handleNegotiate}
                  className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700">
                  Counter-offer
                </button>
              </div>
            )}
            {actionMsg && <p className="text-sm mt-2 text-green-600">{actionMsg}</p>}
          </div>
        )}

        {/* Rider: incoming requests */}
        {isOwner && requests.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-semibold mb-4">Ride Requests ({requests.length})</h2>
            <div className="space-y-3">
              {requests.map((req) => (
                <div key={req.id} className="border rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-800 mb-1">{req.requester_name ?? req.requester_id.slice(0, 8) + "..."}</p>
                  {req.message && <p className="text-sm mb-2">{req.message}</p>}
                  <div className="flex flex-wrap gap-2 text-xs text-gray-600 mb-2">
                    {req.suggested_fare && <span>Suggested: <strong>₹{req.suggested_fare}</strong></span>}
                    {req.offered_fare && <span>Offered: <strong className="text-blue-600">₹{req.offered_fare}</strong></span>}
                    {req.agreed_fare && <span className="text-green-700 font-medium">Agreed: ₹{req.agreed_fare}</span>}
                  </div>
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

        {/* Chat (only after request is accepted) */}
        {canChat && (
          <div className="bg-white rounded-xl shadow p-6 mt-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold">Chat</h2>
              <span className="text-xs text-gray-500">Ride status: {ride.status}</span>
            </div>

            <div className="border rounded-lg p-3 h-64 overflow-y-auto bg-gray-50">
              {messages.length === 0 ? (
                <p className="text-sm text-gray-500">No messages yet.</p>
              ) : (
                messages.map((m) => {
                  const isMe = m.sender_id === currentUserId;
                  return (
                    <div key={m.id} className={`mb-2 ${isMe ? "text-right" : "text-left"}`}>
                      <div
                        className={`inline-block max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                          isMe
                            ? "bg-blue-600 text-white"
                            : "bg-white border border-gray-200 text-gray-800"
                        }`}
                      >
                        {m.message}
                        <div className={`text-[11px] mt-1 ${isMe ? "text-blue-100" : "text-gray-400"}`}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-2 mt-3">
              <input
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSendChat}
                disabled={chatSending || !chatText.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {chatSending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        )}

        {/* Rating section — shown after ride is completed */}
        {ride.status === "completed" && (
          <div className="bg-white rounded-xl shadow p-6 mt-6">
            {myRating || ratingSubmitted ? (
              <div>
                <h2 className="font-semibold mb-2">Your Rating</h2>
                <RatingStars value={myRating?.rating ?? ratingValue} readonly size="md" />
                {myRating?.comment && <p className="text-sm text-gray-500 mt-1">{myRating.comment}</p>}
                <p className="text-xs text-green-600 mt-2">Rating submitted ✓</p>
              </div>
            ) : (
              <div>
                <h2 className="font-semibold mb-3">Rate this ride</h2>
                <RatingStars value={ratingValue} onChange={setRatingValue} size="lg" />
                <textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Leave a comment (optional)..."
                  className="w-full mt-3 border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={2}
                />
                <button
                  onClick={() => handleRate(isOwner
                    ? (requests.find(r => r.status === "accepted")?.requester_id ?? "")
                    : ride.rider_id
                  )}
                  className="mt-3 bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-500 transition"
                >
                  Submit Rating
                </button>
                {actionMsg && <p className="text-sm mt-2 text-red-500">{actionMsg}</p>}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
