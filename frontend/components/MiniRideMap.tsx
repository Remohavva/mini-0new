"use client";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { geocode, getRoute } from "@/lib/geocode";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function makeLabelIcon(label: string, color: string) {
  return L.divIcon({
    className: "",
    iconAnchor: [0, 36],
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;gap:2px">
        <div style="
          background:${color};
          color:white;
          font-size:10px;
          font-weight:600;
          padding:2px 6px;
          border-radius:999px;
          white-space:nowrap;
          max-width:100px;
          overflow:hidden;
          text-overflow:ellipsis;
          box-shadow:0 1px 4px rgba(0,0,0,0.25);
          font-family:Inter,sans-serif;
        ">${label}</div>
        <div style="width:2px;height:8px;background:${color};border-radius:2px"></div>
        <div style="width:10px;height:10px;background:${color};border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>
      </div>
    `,
  });
}

function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length >= 2) {
      map.fitBounds(coords as [number, number][], { padding: [30, 30] });
    } else if (coords.length === 1) {
      map.setView(coords[0], 13);
    }
  }, [coords, map]);
  return null;
}

interface Props {
  origin: string;
  destination: string;
}

export default function MiniRideMap({ origin, destination }: Props) {
  const [originCoords, setOriginCoords] = useState<[number, number] | null>(null);
  const [destCoords, setDestCoords] = useState<[number, number] | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);

  // Short label — first part before comma
  const originLabel = origin.split(",")[0].trim();
  const destLabel = destination.split(",")[0].trim();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [oRes, dRes] = await Promise.all([geocode(origin), geocode(destination)]);
      if (cancelled) return;

      const o = oRes[0] ? [parseFloat(oRes[0].lat as unknown as string), parseFloat(oRes[0].lon as unknown as string)] as [number, number] : null;
      const d = dRes[0] ? [parseFloat(dRes[0].lat as unknown as string), parseFloat(dRes[0].lon as unknown as string)] as [number, number] : null;

      if (o) setOriginCoords(o);
      if (d) setDestCoords(d);

      if (o && d) {
        const route = await getRoute(o, d);
        if (!cancelled && route) {
          setRouteCoords(route.geometry.map(([lon, lat]) => [lat, lon]));
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [origin, destination]);

  const markerCoords = [originCoords, destCoords].filter(Boolean) as [number, number][];

  return (
    <MapContainer
      key={`${origin}-${destination}`}
      center={[20.5937, 78.9629]}
      zoom={5}
      style={{ height: "160px", width: "100%", borderRadius: "0.5rem", zIndex: 0 }}
      scrollWheelZoom={false}
      dragging={false}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FitBounds coords={markerCoords} />
      {originCoords && (
        <Marker position={originCoords} icon={makeLabelIcon(originLabel, "#16a34a")} />
      )}
      {destCoords && (
        <Marker position={destCoords} icon={makeLabelIcon(destLabel, "#dc2626")} />
      )}
      {routeCoords.length > 0 && (
        <Polyline positions={routeCoords} color="#16a34a" weight={3} opacity={0.8} />
      )}
    </MapContainer>
  );
}
