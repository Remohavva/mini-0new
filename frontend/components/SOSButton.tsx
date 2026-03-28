"use client";
import { useState } from "react";
import { apiFetch } from "@/lib/api";

interface Props {
  rideId?: string;
}

export default function SOSButton({ rideId }: Props) {
  const [triggered, setTriggered] = useState(false);
  const [mapsLink, setMapsLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSOS() {
    if (!confirm("🆘 Trigger SOS? This will record your location and alert your emergency contact.")) return;
    setLoading(true);
    setError("");

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
      );

      const res = await apiFetch<{ ok: boolean; maps_link: string; contact?: { name: string; phone: string } }>("/emergency/sos", {
        method: "POST",
        body: JSON.stringify({ lat: pos.coords.latitude, lon: pos.coords.longitude, ride_id: rideId }),
      });

      setMapsLink(res.maps_link);
      setTriggered(true);

      // Open WhatsApp with pre-filled message if contact exists
      if (res.contact) {
        const msg = encodeURIComponent(
          `🆘 SOS from Pillion!\n${res.contact.name ? `User needs help.` : ""}\nLive location: ${res.maps_link}\n${rideId ? `Ride ID: ${rideId}` : ""}`
        );
        window.open(`https://wa.me/${res.contact.phone.replace(/\D/g, "")}?text=${msg}`, "_blank");
      }
    } catch {
      setError("Could not get location. Please enable location access.");
    }
    setLoading(false);
  }

  if (triggered) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
        <p className="text-red-700 font-semibold mb-2">🆘 SOS Triggered</p>
        <p className="text-sm text-red-600 mb-3">Your emergency contact has been notified.</p>
        {mapsLink && (
          <a href={mapsLink} target="_blank" rel="noopener noreferrer"
            className="text-sm text-blue-600 underline">View your location on map</a>
        )}
      </div>
    );
  }

  return (
    <div>
      <button onClick={handleSOS} disabled={loading}
        className="w-full bg-red-600 text-white py-3 rounded-xl font-bold text-base hover:bg-red-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
        {loading ? "Getting location..." : "🆘 SOS — Emergency"}
      </button>
      {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
    </div>
  );
}
