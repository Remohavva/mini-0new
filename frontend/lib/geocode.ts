// Nominatim geocoding — free, no API key needed

export interface GeoResult {
  lat: number;
  lon: number;
  display_name: string;
}

// India bounding box: SW(6.4, 68.1) → NE(35.7, 97.4)
const INDIA_BOUNDS = "6.4,68.1,35.7,97.4"; // kept for reference but not used with bounded=1
const INDIA_CENTER: [number, number] = [20.5937, 78.9629];

export { INDIA_CENTER };

export async function geocode(query: string): Promise<GeoResult[]> {
  try {
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&countrycodes=in`;
  try {
    const res = await fetch(url, {
      headers: {
        "Accept-Language": "en",
        "User-Agent": "Pillion/1.0 (bike-pooling-app)",
      },
    });
    if (!res.ok) return `${lat}, ${lon}`;
    const data = await res.json();
    return data.display_name ?? `${lat}, ${lon}`;
  } catch {
    return `${lat}, ${lon}`;
  }
}

// OSRM routing — free, no API key needed
export interface RouteResult {
  distance: number; // meters
  duration: number; // seconds
  geometry: [number, number][]; // [lon, lat] pairs
}

export async function getRoute(
  from: [number, number], // [lat, lon]
  to: [number, number]
): Promise<RouteResult | null> {
  const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.code !== "Ok" || !data.routes?.length) return null;
  const route = data.routes[0];
  return {
    distance: route.distance,
    duration: route.duration,
    geometry: route.geometry.coordinates,
  };
}

export function formatDistance(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

export function formatDuration(seconds: number) {
  const m = Math.round(seconds / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`;
}

// Fare calculation — ₹4/km base rate, minimum ₹20
const RATE_PER_KM = 4;
const MIN_FARE = 20;

export function calculateFare(distanceMeters: number): number {
  const km = distanceMeters / 1000;
  return Math.max(Math.round(km * RATE_PER_KM), MIN_FARE);
}
