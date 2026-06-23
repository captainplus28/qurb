import { NextRequest, NextResponse } from "next/server";

// Proxy to OpenStreetMap Nominatim — Nominatim doesn't send CORS headers,
// so the browser can't call it directly. This runs server-side and forwards
// the request with a proper User-Agent (required by Nominatim's usage policy:
// https://operations.osmfoundation.org/policies/nominatim/).
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").toString().trim();
  if (q.length < 3) {
    return NextResponse.json(
      { error: "q must be at least 3 characters" },
      { status: 400 }
    );
  }

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    q
  )}&format=jsonv2&addressdetails=1&countrycodes=nl&limit=4`;

  try {
    const upstream = await fetch(url, {
      headers: {
        "User-Agent": "Qurb/1.0 (https://www.qurb.nl; hello@qurb.nl)",
      },
    });
    if (!upstream.ok) {
      return NextResponse.json(
        { error: "upstream error" },
        { status: upstream.status }
      );
    }
    const data = await upstream.json();
    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch {
    return NextResponse.json({ error: "upstream unreachable" }, { status: 502 });
  }
}
