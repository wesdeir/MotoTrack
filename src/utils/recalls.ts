import type { Vehicle } from '../models';

export interface Recall {
  /** NHTSA campaign ID — unique, used for dedupe + acknowledgement. */
  campaignNumber: string;
  manufacturer: string;
  /** Affected system (e.g., "AIR BAGS", "BRAKES"). */
  component: string;
  /** Plain-English description of the defect. */
  summary: string;
  /** What can go wrong if not fixed. */
  consequence: string;
  /** What the manufacturer will do (typically free repair). */
  remedy: string;
  /** "Yes" = do-not-drive recall. */
  parkIt: boolean;
  /** Fire risk — park outside until fixed. */
  parkOutside: boolean;
  /** Date NHTSA received the recall report. */
  reportReceivedDate: string;
}

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const ENDPOINT = 'https://api.nhtsa.gov/recalls/recallsByVehicle';

interface CacheEntry {
  recalls: Recall[];
  fetchedAt: number;
}

function cacheKey(year: number, make: string, model: string): string {
  return `mototrack-recalls-cache:${year}:${make.toUpperCase()}:${model.toUpperCase()}`;
}

function readCache(year: number, make: string, model: string): Recall[] | null {
  try {
    const raw = localStorage.getItem(cacheKey(year, make, model));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    return parsed.recalls;
  } catch {
    return null;
  }
}

function writeCache(year: number, make: string, model: string, recalls: Recall[]): void {
  try {
    const entry: CacheEntry = { recalls, fetchedAt: Date.now() };
    localStorage.setItem(cacheKey(year, make, model), JSON.stringify(entry));
  } catch {
    // best-effort; ignore quota errors
  }
}

/** Strip trim / parenthetical info — "Civic SiR (EP3)" → "Civic". */
function firstWordModel(model: string): string {
  return model.split(/[\s(]/)[0];
}

async function queryNhtsa(year: number, make: string, model: string): Promise<Recall[]> {
  const url = `${ENDPOINT}?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = await res.json() as { results?: NhtsaRaw[] };
  return (json.results ?? []).map(normalize);
}

interface NhtsaRaw {
  Manufacturer?: string;
  NHTSACampaignNumber?: string;
  parkIt?: boolean | string;
  parkOutSide?: boolean | string;
  Component?: string;
  Summary?: string;
  Consequence?: string;
  Remedy?: string;
  ReportReceivedDate?: string;
}

function normalize(r: NhtsaRaw): Recall {
  return {
    campaignNumber: r.NHTSACampaignNumber ?? '',
    manufacturer: r.Manufacturer ?? '',
    component: r.Component ?? 'Unknown',
    summary: r.Summary ?? '',
    consequence: r.Consequence ?? '',
    remedy: r.Remedy ?? '',
    parkIt: r.parkIt === true || r.parkIt === 'Yes',
    parkOutside: r.parkOutSide === true || r.parkOutSide === 'Yes',
    reportReceivedDate: r.ReportReceivedDate ?? '',
  };
}

function dedupe(recalls: Recall[]): Recall[] {
  const seen = new Set<string>();
  const out: Recall[] = [];
  for (const r of recalls) {
    if (!r.campaignNumber || seen.has(r.campaignNumber)) continue;
    seen.add(r.campaignNumber);
    out.push(r);
  }
  // Most recent first — do-not-drive recalls float to the top
  return out.sort((a, b) => {
    if (a.parkIt !== b.parkIt) return a.parkIt ? -1 : 1;
    return b.reportReceivedDate.localeCompare(a.reportReceivedDate);
  });
}

/**
 * Fetch active recalls for the vehicle. Tries the full model string first
 * (works for "F-150", "Model 3") then falls back to the first word
 * ("Civic" extracted from "Civic SiR (EP3)") and merges results. Cached for
 * 7 days in localStorage keyed by year/make/model.
 */
export async function fetchRecalls(vehicle: Vehicle): Promise<Recall[]> {
  if (!vehicle.make || !vehicle.model || !vehicle.year) return [];

  const cached = readCache(vehicle.year, vehicle.make, vehicle.model);
  if (cached) return cached;

  try {
    const fullModel = vehicle.model.trim();
    const firstWord = firstWordModel(fullModel);

    const queries = firstWord !== fullModel
      ? [queryNhtsa(vehicle.year, vehicle.make, fullModel), queryNhtsa(vehicle.year, vehicle.make, firstWord)]
      : [queryNhtsa(vehicle.year, vehicle.make, fullModel)];

    const results = await Promise.all(queries);
    const merged = dedupe(results.flat());
    writeCache(vehicle.year, vehicle.make, vehicle.model, merged);
    return merged;
  } catch {
    return [];
  }
}

// --- per-recall acknowledgements -----------------------------------------

function ackKey(vehicleId: string, campaignNumber: string): string {
  return `mototrack-recall-ack:${vehicleId}:${campaignNumber}`;
}

export function isAcknowledged(vehicleId: string, campaignNumber: string): boolean {
  try { return localStorage.getItem(ackKey(vehicleId, campaignNumber)) === '1'; }
  catch { return false; }
}

export function acknowledgeRecall(vehicleId: string, campaignNumber: string): void {
  try { localStorage.setItem(ackKey(vehicleId, campaignNumber), '1'); } catch { /* no-op */ }
}

export function unacknowledgeRecall(vehicleId: string, campaignNumber: string): void {
  try { localStorage.removeItem(ackKey(vehicleId, campaignNumber)); } catch { /* no-op */ }
}

/** Public NHTSA campaign lookup URL — useful for "open in browser" buttons. */
export function nhtsaCampaignUrl(campaignNumber: string): string {
  return `https://www.nhtsa.gov/recalls?nhtsaId=${encodeURIComponent(campaignNumber)}`;
}
