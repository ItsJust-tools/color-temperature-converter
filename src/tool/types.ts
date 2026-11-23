/** Temperature presets available in the toolbar. */
export type PresetKey = 'candlelight' | 'tungsten' | 'daylight' | 'overcast' | 'shade' | 'monitor';

/** A single saved kelvin value entry. */
export interface HistoryEntry {
  /** Human readable description, e.g. "6500 K → #FFEBE0". */
  text: string;
  /** ISO timestamp when the entry was saved. */
  createdAt: string;
}

/** Editable state of the color temperature converter. */
export interface ToolState {
  /** Chosen correlated color temperature in Kelvin (1000–12000). */
  kelvin: string;
  /** Saved conversion entries, newest first. */
  history: HistoryEntry[];
}

/** Bounds used by slider and validation. */
export const MIN_KELVIN = 1000;
export const MAX_KELVIN = 12000;

export const DEFAULT_STATE: ToolState = {
  kelvin: '6500',
  history: [],
};

export const MAX_HISTORY = 20;

/** Named temperature presets in Kelvin. */
export const PRESETS: { key: PresetKey; label: string; kelvin: number }[] = [
  { key: 'candlelight', label: 'Candlelight', kelvin: 1850 },
  { key: 'tungsten', label: 'Tungsten', kelvin: 3200 },
  { key: 'daylight', label: 'Daylight', kelvin: 5600 },
  { key: 'overcast', label: 'Overcast', kelvin: 6500 },
  { key: 'shade', label: 'Shade', kelvin: 7500 },
  { key: 'monitor', label: 'Monitor', kelvin: 9300 },
];

/** Parse a non-negative decimal kelvin string; null when invalid. */
export function parseNumber(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (!/^\d+(\.\d*)?$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

/** Clamp a number into [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Convert a correlated color temperature (Kelvin) to an approximate
 * sRGB color using Tanner Helland's algorithm, WITHOUT gamut clamping.
 * Returns raw channel values, which may fall outside 0–255.
 */
export function kelvinToRgbRaw(kelvin: number): { r: number; g: number; b: number } {
  const t = clamp(kelvin, 1000, 40000) / 100;

  let r: number;
  if (t <= 66) {
    r = 255;
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
  }

  let g: number;
  if (t <= 66) {
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
  } else {
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  }

  let b: number;
  if (t >= 66) {
    b = 255;
  } else if (t <= 19) {
    b = 0;
  } else {
    b = 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  }

  return { r, g, b };
}

/**
 * Convert Kelvin to sRGB, clamping every channel into 0–255 using
 * the standard Helland approach (clip then round).
 */
export function kelvinToRgb(kelvin: number): { r: number; g: number; b: number } {
  const { r, g, b } = kelvinToRgbRaw(kelvin);
  return {
    r: Math.round(clamp(r, 0, 255)),
    g: Math.round(clamp(g, 0, 255)),
    b: Math.round(clamp(b, 0, 255)),
  };
}

/**
 * Convert a Kelvin value to the nearest correlated color temperature
 * via the blackbody RGB estimate and its HEX representation.
 */
export function kelvinToHex(kelvin: number): string {
  const { r, g, b } = kelvinToRgb(kelvin);
  return rgbToHex(r, g, b);
}

/** Format 0–255 channels as uppercase 6-digit HEX (#RRGGBB). */
export function rgbToHex(r: number, g: number, b: number): string {
  const to2 = (v: number) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
  return `#${to2(r)}${to2(g)}${to2(b)}`.toUpperCase();
}

export interface ParsedHex {
  r: number;
  g: number;
  b: number;
}

/**
 * Parse a HEX string in 3- or 6-digit form, with or without the
 * leading '#', case-insensitive. Returns null for invalid input.
 */
export function parseHex(input: string): ParsedHex | null {
  const cleaned = input.trim().replace(/^#/, '');
  let full: string;
  if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
    full = cleaned
      .split('')
      .map((c) => c + c)
      .join('');
  } else if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    full = cleaned;
  } else {
    return null;
  }
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return { r, g, b };
}

/**
 * Estimate the nearest correlated color temperature (Kelvin) for an
 * sRGB color by inverting the Helland blackbody curves numerically:
 * sample candidate temperatures and pick the one whose clamped RGB is
 * closest (squared distance) to the input color.
 */
export function rgbToKelvin(r: number, g: number, b: number): number {
  const dr = clamp(r, 0, 255);
  const dg = clamp(g, 0, 255);
  const db = clamp(b, 0, 255);

  // Coarse scan 1000K..12000K in 50K steps, then refine ±100K in 1K steps.
  let best = 6500;
  let bestDist = Number.POSITIVE_INFINITY;
  for (let k = 1000; k <= 12000; k += 50) {
    const c = kelvinToRgb(k);
    const d = (c.r - dr) ** 2 + (c.g - dg) ** 2 + (c.b - db) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = k;
    }
  }
  const lo = Math.max(1000, best - 100);
  const hi = Math.min(12000, best + 100);
  for (let k = lo; k <= hi; k += 1) {
    const c = kelvinToRgb(k);
    const d = (c.r - dr) ** 2 + (c.g - dg) ** 2 + (c.b - db) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = k;
    }
  }
  return best;
}

/** Format a kelvin value nicely, e.g. 6500 → "6500 K". */
export function formatKelvin(kelvin: number): string {
  return `${Math.round(kelvin)} K`;
}

/** Full conversion line used in history, e.g. "6500 K → #FFEBE0 (rgb(255, 235, 224))". */
export function historyText(state: ToolState): string {
  const kelvin = parseNumber(state.kelvin) ?? 0;
  const rgb = kelvinToRgb(kelvin);
  return `${formatKelvin(kelvin)} → ${kelvinToHex(kelvin)} (rgb(${rgb.r}, ${rgb.g}, ${rgb.b}))`;
}
