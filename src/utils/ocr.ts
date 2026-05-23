import Tesseract from 'tesseract.js';

export interface ParsedReceipt {
  /** Full text output from Tesseract — useful for debugging or fallback display. */
  rawText: string;
  /** Largest $X.XX value found — typically the total. */
  amount?: number;
  /** ISO YYYY-MM-DD if a date was confidently parsed. */
  date?: string;
  /** Fuel quantity in litres (or first-stated quantity if the unit was 'gal'). */
  litres?: number;
  /** Price per litre in dollars (X.XXX). */
  pricePerLitre?: number;
  /** Largest "NNNN km" / "NNNN mi" number — likely the odometer. */
  odometer?: number;
}

/**
 * OCR a receipt image and extract the most useful fields. Lazy callers should
 * dynamic-import this module — Tesseract.js + WASM weighs ~2MB and shouldn't
 * land in the main bundle.
 */
export async function scanReceipt(file: File | Blob): Promise<ParsedReceipt> {
  const { data } = await Tesseract.recognize(file, 'eng');
  const text = data.text;
  return {
    rawText: text,
    amount:         extractAmount(text),
    date:           extractDate(text),
    litres:         extractLitres(text),
    pricePerLitre:  extractPricePerLitre(text),
    odometer:       extractOdometer(text),
  };
}

// --- field extractors ----------------------------------------------------

/** Largest $X.XX (or X.XX surrounded by amount-like context). */
function extractAmount(text: string): number | undefined {
  const candidates: number[] = [];
  // $12.34 or $1,234.56
  const re = /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})|\d+\.\d{2})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) != null) {
    const n = Number(m[1].replace(/,/g, ''));
    if (!Number.isNaN(n) && n > 0 && n < 10000) candidates.push(n);
  }
  // Fallback: "TOTAL ... 12.34"
  const totalRe = /total\D{0,8}(\d{1,4}\.\d{2})/i;
  const tm = totalRe.exec(text);
  if (tm) {
    const n = Number(tm[1]);
    if (!Number.isNaN(n) && n > 0) candidates.push(n);
  }
  if (candidates.length === 0) return undefined;
  return Math.max(...candidates);
}

/** ISO date if we can find one in common receipt formats. */
function extractDate(text: string): string | undefined {
  // YYYY-MM-DD or YYYY/MM/DD
  const iso = /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/.exec(text);
  if (iso) return normalize(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  // MM/DD/YYYY or DD/MM/YYYY (ambiguous — assume MM/DD/YYYY, US receipts most common in NA)
  const dmy = /(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/.exec(text);
  if (dmy) {
    let y = Number(dmy[3]);
    if (y < 100) y += y >= 70 ? 1900 : 2000;
    const a = Number(dmy[1]);
    const b = Number(dmy[2]);
    // If first part > 12, it must be a day → flip to DD/MM
    if (a > 12 && b <= 12) return normalize(y, b, a);
    return normalize(y, a, b);
  }

  // "MMM DD, YYYY"
  const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  const monthRe = new RegExp(`(${months.join('|')})[a-z]*\\.?\\s+(\\d{1,2})[,\\s]+(\\d{2,4})`, 'i');
  const mm = monthRe.exec(text);
  if (mm) {
    const mIdx = months.indexOf(mm[1].toLowerCase().slice(0, 3)) + 1;
    let y = Number(mm[3]);
    if (y < 100) y += y >= 70 ? 1900 : 2000;
    return normalize(y, mIdx, Number(mm[2]));
  }
  return undefined;
}

function normalize(y: number, m: number, d: number): string | undefined {
  if (y < 1990 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return undefined;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Litres value — handles "12.345 L" / "12.345 litres" / "12.34 gal" (converted). */
function extractLitres(text: string): number | undefined {
  const litreRe = /(\d{1,3}(?:[.,]\d{1,3}))\s*(?:l\b|lit(?:re|er)s?\b)/i;
  const lm = litreRe.exec(text);
  if (lm) {
    const n = Number(lm[1].replace(',', '.'));
    if (!Number.isNaN(n) && n > 0 && n < 500) return n;
  }
  const galRe = /(\d{1,3}(?:[.,]\d{1,3}))\s*gal(?:lons?)?\b/i;
  const gm = galRe.exec(text);
  if (gm) {
    const n = Number(gm[1].replace(',', '.'));
    if (!Number.isNaN(n) && n > 0 && n < 200) return Number((n * 3.78541).toFixed(3));
  }
  return undefined;
}

/** Price per litre in $/L. Also catches $/gal converted. */
function extractPricePerLitre(text: string): number | undefined {
  // "$1.469/L" or "1.469 /L"
  const lRe = /\$?\s*(\d\.\d{2,3})\s*[\/]\s*l\b/i;
  const lm = lRe.exec(text);
  if (lm) {
    const n = Number(lm[1]);
    if (n > 0 && n < 10) return n;
  }
  // "$X.XXX/gal" → convert to $/L
  const gRe = /\$?\s*(\d\.\d{2,3})\s*[\/]\s*gal/i;
  const gm = gRe.exec(text);
  if (gm) {
    const n = Number(gm[1]);
    if (n > 0 && n < 20) return Number((n / 3.78541).toFixed(3));
  }
  return undefined;
}

/** Largest NNNNN km / mi number — typically odometer on service receipts. */
function extractOdometer(text: string): number | undefined {
  const candidates: number[] = [];
  const re = /(\d{2,7})\s*(?:km|mi(?:les)?)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) != null) {
    const n = Number(m[1]);
    if (!Number.isNaN(n) && n >= 100 && n < 10_000_000) candidates.push(n);
  }
  if (candidates.length === 0) return undefined;
  return Math.max(...candidates);
}
