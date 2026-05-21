export interface DecodedVin {
  make: string;
  model: string;
  year: number;
  trim?: string;
  engine?: string;
}

// Module-level cache — prevents duplicate network requests for the same VIN
const vinCache = new Map<string, DecodedVin | null>();

export async function decodeVin(vin: string): Promise<DecodedVin | null> {
  if (vinCache.has(vin)) return vinCache.get(vin) ?? null;
  try {
    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`,
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { Results?: Record<string, string>[] };
    const r = json?.Results?.[0];
    if (!r) return null;

    const make = r.Make?.trim();
    const model = r.Model?.trim();
    const year = Number(r.ModelYear?.trim());
    if (!make || !model || !year) return null;

    const trim = r.Series?.trim() || undefined;

    const displacement = parseFloat(r.DisplacementL ?? '');
    const cylinders = r.EngineCylinders?.trim();
    let engine: string | undefined;
    if (!isNaN(displacement) || cylinders) {
      const parts: string[] = [];
      if (!isNaN(displacement)) parts.push(`${displacement.toFixed(1)}L`);
      if (cylinders) parts.push(`${cylinders}-cyl`);
      engine = parts.join(' ') || undefined;
    }

    // make, model, year are all confirmed non-empty/non-zero above
    const result: DecodedVin = { make, model, year, trim, engine };
    vinCache.set(vin, result);
    return result;
  } catch {
    return null;
  }
}
