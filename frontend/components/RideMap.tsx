"use client";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { getRoute, formatDistance, formatDuration, RouteResult } from "@/lib/geocode";
import "leaflet/dist/leaflet.css";

// Fix default marker icons broken by webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const redIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length >= 2) {
      map.fitBounds(coords.map(([lat, lon]) => [lat, lon] as [number, number]), { padding: [40, 40] });
    } else if (coords.length === 1) {
      map.setView(coords[0], 13);
    } else {
      // Default to India
      map.setView([20.5937, 78.9629], 5);
    }
  }, [coords, map]);
  return null;
}

interface Props {
  origin?: string;
  destination?: string;
  originCoords?: [number, number];
  destinationCoords?: [number, number];
}

export default function RideMap({ origin, destination, originCoords, destinationCoords }: Props) {
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);

  useEffect(() => {
    if (!originCoords || !destinationCoords) { setRoute(null); setRouteCoords([]); return; }
    getRoute(originCoords, destinationCoords).then((r) => {
      if (!r) return;
      setRoute(r);
      // OSRM returns [lon, lat], Leaflet needs [lat, lon]
      setRouteCoords(r.geometry.map(([lon, lat]) => [lat, lon]));
    });
  }, [originCoords, destinationCoords]);

  const center: [number, number] = originCoords ?? [20.5937, 78.9629]; // India center
  const markerCoords = [originCoords, destinationCoords].filter(Boolean) as [number, number][];

  return (
    <div className="rounded-xl overflow-hidden border shadow-sm">
      {route && (
        <div className="flex gap-4 px-4 py-2 bg-green-50 border-b text-sm font-medium text-green-800">
          <span>📍 {formatDistance(route.distance)}</span>
          <span>⏱ {formatDuration(route.duration)}</span>
          <a
            href={`https://www.openstreetmap.org/directions?engine=fossgis_osrm_bike&route=${originCoords?.[0]},${originCoords?.[1]};${destinationCoords?.[0]},${destinationCoords?.[1]}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-green-700 hover:underline"
          >
            Open in OSM ↗
          </a>
        </div>
      )}
      <MapContainer center={center} zoom={5} style={{ height: "380px", width: "100%" }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds coords={markerCoords} />
        {originCoords && (
          <Marker position={originCoords} icon={greenIcon}>
            <Popup>{origin ?? "Origin"}</Popup>
          </Marker>
        )}
        {destinationCoords && (
          <Marker position={destinationCoords} icon={redIcon}>
            <Popup>{destination ?? "Destination"}</Popup>
          </Marker>
        )}
        {routeCoords.length > 0 && (
          <Polyline positions={routeCoords} color="#16a34a" weight={4} opacity={0.8} />
        )}
      </MapContainer>
    </div>
  );
}
