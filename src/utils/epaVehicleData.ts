/**
 * Client for EPA's FuelEconomy.gov public API. No auth, CORS open. We use it
 * for one thing: looking up the OEM fuel tank capacity for a given vehicle.
 *
 * Flow: year/make/model → menu/options returns N matching trims, each with a
 * numeric ID → fetch full record for the first match → tankSize1 (gallons) is
 * what we want. We convert to litres for storage.
 *
 * Returns null on any failure — caller falls back to user-entered value.
 *
 * Caches in localStorage keyed by `${year}:${make}:${model}` for 30 days.
 */

const GAL_TO_L = 3.78541;
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MENU_URL  = 'https://www.fueleconomy.gov/ws/rest/vehicle/menu/options';
const VEHICLE_URL = 'https://www.fueleconomy.gov/ws/rest/vehicle';

function cacheKey(year: number, make: string, model: string): string {
  return `mototrack-tank-size:${year}:${make.toUpperCase()}:${model.toUpperCase()}`;
}

interface CacheEntry {
  /** Litres, or `null` if EPA returned no match (don't keep retrying). */
  tankSizeLitres: number | null;
  fetchedAt: number;
}

function readCache(year: number, make: string, model: string): CacheEntry | null {
  try {
    const raw = localStorage.getItem(cacheKey(year, make, model));
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) return null;
    return entry;
  } catch {
    return null;
  }
}

function writeCache(year: number, make: string, model: string, tankSizeLitres: number | null): void {
  try {
    const entry: CacheEntry = { tankSizeLitres, fetchedAt: Date.now() };
    localStorage.setItem(cacheKey(year, make, model), JSON.stringify(entry));
  } catch { /* no-op */ }
}

/** EPA returns XML by default. Use DOMParser to read the few fields we need. */
function parseXml(text: string): Document {
  return new DOMParser().parseFromString(text, 'application/xml');
}

function firstValueOfTag(doc: Document, tag: string): string | null {
  const el = doc.getElementsByTagName(tag)[0];
  return el?.textContent?.trim() ?? null;
}

/** Try the EPA menu lookup. Tries the full model first, then a first-word
 *  fallback for models like "Civic SiR (EP3)" → "Civic". */
async function findVehicleId(year: number, make: string, model: string): Promise<string | null> {
  const variants = [model.trim()];
  const firstWord = model.trim().split(/[\s(]/)[0];
  if (firstWord && firstWord !== model.trim()) variants.push(firstWord);

  for (const variant of variants) {
    try {
      const url = `${MENU_URL}?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(variant)}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const doc = parseXml(await res.text());
      // <menuItems><menuItem><value>43253</value><text>Auto (CVT)</text></menuItem>...
      const value = firstValueOfTag(doc, 'value');
      if (value) return value;
    } catch {
      // fall through to next variant
    }
  }
  return null;
}

async function fetchTankSizeGallons(vehicleId: string): Promise<number | null> {
  try {
    const res = await fetch(`${VEHICLE_URL}/${encodeURIComponent(vehicleId)}`);
    if (!res.ok) return null;
    const doc = parseXml(await res.text());
    const raw = firstValueOfTag(doc, 'tankSize1');
    if (!raw) return null;
    const gal = parseFloat(raw);
    if (Number.isNaN(gal) || gal <= 0) return null;
    return gal;
  } catch {
    return null;
  }
}

/**
 * Look up the OEM fuel-tank capacity for a vehicle. Returns litres rounded
 * to one decimal, or null if EPA has no data for the given year/make/model.
 */
export async function lookupTankSizeLitres(
  year: number,
  make: string,
  model: string,
): Promise<number | null> {
  if (!year || !make || !model) return null;

  const cached = readCache(year, make, model);
  if (cached) return cached.tankSizeLitres;

  const vehicleId = await findVehicleId(year, make, model);
  if (!vehicleId) {
    writeCache(year, make, model, null);
    return null;
  }
  const gallons = await fetchTankSizeGallons(vehicleId);
  if (gallons == null) {
    writeCache(year, make, model, null);
    return null;
  }
  const litres = Math.round(gallons * GAL_TO_L * 10) / 10;
  writeCache(year, make, model, litres);
  return litres;
}
