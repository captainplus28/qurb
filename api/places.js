// Proxy to OpenStreetMap Nominatim — Nominatim doesn't send CORS headers,
// so the browser can't call it directly. This runs server-side on Vercel
// and forwards the request with a proper User-Agent (required by Nominatim's
// usage policy: https://operations.osmfoundation.org/policies/nominatim/).
export default async function handler(req, res) {
  const q = (req.query.q ?? '').toString().trim();
  if (q.length < 3) {
    res.status(400).json({ error: 'q must be at least 3 characters' });
    return;
  }

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=jsonv2&addressdetails=1&countrycodes=nl&limit=4`;

  try {
    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'Qurb/1.0 (https://www.qurb.nl; hello@qurb.nl)' },
    });
    if (!upstream.ok) {
      res.status(upstream.status).json({ error: 'upstream error' });
      return;
    }
    const data = await upstream.json();
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(200).json(data);
  } catch {
    res.status(502).json({ error: 'upstream unreachable' });
  }
}
