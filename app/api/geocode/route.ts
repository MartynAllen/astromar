import { NextResponse } from "next/server";

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

// Proxies OpenStreetMap's free Nominatim geocoder server-side — it requires
// a descriptive User-Agent (browsers can't set that header themselves) and
// this keeps the 1 req/sec usage-policy limit off the client.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  // A place name never needs to be long; capping it keeps this route from
  // being usable as a general-purpose proxy for oversized requests against
  // Nominatim's free, rate-limited service.
  if (query.length > 100) {
    return NextResponse.json({ error: "Query too long" }, { status: 400 });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "5");

  const res = await fetch(url, {
    headers: { "User-Agent": "Astromar (astromar.co.uk) sky-visibility-finder" },
    // Place names don't change; caching identical queries keeps repeat
    // lookups off Nominatim's 1 req/sec usage-policy limit entirely.
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Geocoding service unavailable" }, { status: 502 });
  }

  const results: NominatimResult[] = await res.json();

  return NextResponse.json(
    results.map((r) => ({
      lat: Number(r.lat),
      lng: Number(r.lon),
      label: r.display_name,
    })),
  );
}
