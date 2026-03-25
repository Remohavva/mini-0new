import { NextRequest, NextResponse } from "next/server";

// Photon — free OSM-based geocoder, no API key, more lenient rate limits
// Falls back to Nominatim if Photon fails
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) return NextResponse.json([]);

  // Try Photon first (no rate limit issues)
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5&lang=en&bbox=68.1,6.4,97.4,35.7`;
    const res = await fetch(photonUrl, {
      headers: { "User-Agent": "Pillion/1.0" },
      cache: "no-store",
    });
    const data = await res.json();

    // Photon returns GeoJSON — convert to Nominatim-compatible format
    if (data.features?.length > 0) {
      const results = data.features
        .filter((f: PhotonFeature) => {
          // Filter to India only
          const country = f.properties?.country;
          return !country || country === "India";
        })
        .map((f: PhotonFeature) => ({
          lat: f.geometry.coordinates[1],
          lon: f.geometry.coordinates[0],
          display_name: [
            f.properties.name,
            f.properties.city || f.properties.town || f.properties.village,
            f.properties.state,
            f.properties.country,
          ].filter(Boolean).join(", "),
        }));

      if (results.length > 0) {
        return NextResponse.json(results, {
          headers: { "Cache-Control": "public, max-age=3600" },
        });
      }
    }
  } catch (e) {
    console.error("Photon geocode error:", e);
  }

  // Fallback to Nominatim
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=in`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Pillion/1.0 contact@pillion.app",
        "Accept": "application/json",
      },
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  } catch {
    return NextResponse.json([]);
  }
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
}
