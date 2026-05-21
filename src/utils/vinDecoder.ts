export interface DecodedVin {
  make: string;
  model: string;
  year: number;
  trim?: string;
  engine?: string;
}

export async function decodeVin(vin: string): Promise<DecodedVin | null> {
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

    return { make, model, year, trim, engine };
  } catch {
    return null;
  }
}
