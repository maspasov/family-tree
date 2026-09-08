export interface GeocodeResult {
  lat: number
  lng: number
}

/**
 * Client-side geocoding via OpenStreetMap Nominatim — free, no API key.
 * Call only on an explicit user action (never on keystroke): Nominatim's
 * usage policy caps this at ~1 request/second.
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Nominatim ${res.status}`)
  const rows = (await res.json()) as Array<{ lat: string; lon: string }>
  if (rows.length === 0) return null
  return { lat: Number(rows[0].lat), lng: Number(rows[0].lon) }
}
