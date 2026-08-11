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

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "5");

  const res = await fetch(url, {
    headers: { "User-Agent": "Astromar (astromar.co.uk) sky-visibility-finder" },
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
