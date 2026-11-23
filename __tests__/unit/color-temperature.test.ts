import { describe, it, expect } from 'vitest';
import {
  DEFAULT_STATE,
  MAX_HISTORY,
  MAX_KELVIN,
  MIN_KELVIN,
  PRESETS,
  clamp,
  formatKelvin,
  historyText,
  kelvinToHex,
  kelvinToRgb,
  kelvinToRgbRaw,
  parseHex,
  parseNumber,
  rgbToHex,
  rgbToKelvin,
} from '@/tool/types';
import {
  colorTemperatureTool,
  deserializeState,
  serializeState,
  summaryText,
  withHistory,
  roundTrips,
} from '@/tool/tool-definition';

const state = (patch: Partial<typeof DEFAULT_STATE> = {}) => ({ ...DEFAULT_STATE, ...patch });

describe('parseNumber', () => {
  it('parses non-negative decimals', () => {
    expect(parseNumber('6500')).toBe(6500);
    expect(parseNumber('0')).toBe(0);
    expect(parseNumber('12.5')).toBeCloseTo(12.5);
    expect(parseNumber('12.')).toBeCloseTo(12);
    expect(parseNumber(' 3200 ')).toBe(3200);
  });

  it('rejects invalid input', () => {
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('  ')).toBeNull();
    expect(parseNumber('abc')).toBeNull();
    expect(parseNumber('-500')).toBeNull();
    expect(parseNumber('1e3')).toBeNull();
    expect(parseNumber('12,5')).toBeNull();
  });
});

describe('clamp', () => {
  it('clamps into the range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(50, 0, 10)).toBe(10);
  });
});

describe('kelvinToRgb', () => {
  it('maps 1000K to a deep orange', () => {
    const { r, g, b } = kelvinToRgb(1000);
    expect(r).toBe(255);
    expect(g).toBeLessThan(120);
    expect(g).toBeGreaterThanOrEqual(0);
    expect(b).toBe(0);
  });

  it('maps 6500K to a near-white value', () => {
    const { r, g, b } = kelvinToRgb(6500);
    expect(r).toBeGreaterThanOrEqual(240);
    expect(g).toBeGreaterThanOrEqual(230);
    expect(b).toBeGreaterThanOrEqual(210);
    expect(r).toBeLessThanOrEqual(255);
    expect(b).toBeLessThanOrEqual(255);
  });

  it('maps tungsten 3200K to a warm tone', () => {
    const { r, g, b } = kelvinToRgb(3200);
    expect(r).toBe(255);
    expect(g).toBeGreaterThan(100);
    expect(g).toBeLessThan(200);
    expect(b).toBeLessThan(150);
  });

  it('clamps every channel into 0-255 for extreme temperatures', () => {
    for (const k of [-5000, 0, 500, 1000, 20000, 40000, 100000]) {
      const { r, g, b } = kelvinToRgb(k);
      for (const c of [r, g, b]) {
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(255);
        expect(Number.isInteger(c)).toBe(true);
      }
    }
    expect(kelvinToRgb(100).b).toBe(0);
    expect(kelvinToRgb(40000).r).toBeLessThanOrEqual(255);
  });

  it('exposes unclamped raw values', () => {
    const raw = kelvinToRgbRaw(6600);
    expect(raw.g).toBeGreaterThan(255);
    expect(kelvinToRgb(6600).g).toBe(255);
  });
});

describe('kelvinToHex / rgbToHex', () => {
  it('formats uppercase 6-digit hex', () => {
    expect(rgbToHex(255, 235, 224)).toBe('#FFEBE0');
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
  });

  it('matches rgb conversion', () => {
    const rgb = kelvinToRgb(5600);
    expect(kelvinToHex(5600)).toBe(rgbToHex(rgb.r, rgb.g, rgb.b));
  });
});

describe('parseHex', () => {
  it('accepts 3-digit and 6-digit hex with or without #', () => {
    expect(parseHex('#FFEBE0')).toEqual({ r: 255, g: 235, b: 224 });
    expect(parseHex('ffebe0')).toEqual({ r: 255, g: 235, b: 224 });
    expect(parseHex('#F00')).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseHex('f00')).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseHex('#AbCdEf')).toEqual({ r: 171, g: 205, b: 239 });
  });

  it('rejects invalid input', () => {
    expect(parseHex('')).toBeNull();
    expect(parseHex('#12')).toBeNull();
    expect(parseHex('#12345')).toBeNull();
    expect(parseHex('#1234567')).toBeNull();
    expect(parseHex('gggggg')).toBeNull();
    expect(parseHex('#zzz')).toBeNull();
    expect(parseHex('ff eb e0')).toBeNull();
  });
});

describe('rgbToKelvin', () => {
  it('round-trips temperatures within tolerance in 2000K-10000K', () => {
    for (const k of [2000, 3200, 4500, 5600, 6500, 7500, 9300, 10000]) {
      const rgb = kelvinToRgb(k);
      const back = rgbToKelvin(rgb.r, rgb.g, rgb.b);
      expect(Math.abs(back - k)).toBeLessThanOrEqual(120);
    }
  });

  it('maps saturated colors to band edges', () => {
    expect(rgbToKelvin(255, 0, 0)).toBeLessThanOrEqual(1200);
    expect(rgbToKelvin(180, 200, 255)).toBeGreaterThan(9000);
  });
});

describe('formatKelvin / historyText', () => {
  it('formats kelvin with a unit', () => {
    expect(formatKelvin(6500)).toBe('6500 K');
    expect(formatKelvin(4999.6)).toBe('5000 K');
  });

  it('builds a readable history line', () => {
    const line = historyText(state({ kelvin: '6500' }));
    expect(line).toContain('6500 K');
    expect(line).toContain('#');
  });
});

describe('presets and bounds', () => {
  it('includes the six named presets', () => {
    expect(PRESETS.map((p) => p.key)).toEqual(
      expect.arrayContaining([
        'candlelight',
        'tungsten',
        'daylight',
        'overcast',
        'shade',
        'monitor',
      ])
    );
    expect(PRESETS).toHaveLength(6);
    expect(MIN_KELVIN).toBe(1000);
    expect(MAX_KELVIN).toBe(12000);
  });
});

describe('serialize/deserialize round-trip', () => {
  const full = {
    kelvin: '4750',
    history: [{ text: '6500 K → #FFEBE0', createdAt: '2026-11-23T10:00:00.000Z' }],
  };

  it('round-trips all fields through serializeState/deserializeState', () => {
    const restored = deserializeState(JSON.parse(serializeState(full)));
    expect(restored.success).toBe(true);
    if (restored.success) {
      expect(restored.data).toEqual(full);
    }
  });

  it('round-trips the chosen temperature value', () => {
    const restored = deserializeState(JSON.parse(serializeState(state({ kelvin: '3200' }))));
    expect(restored.success).toBe(true);
    if (restored.success) {
      expect(restored.data.kelvin).toBe('3200');
    }
  });

  it('round-trips via the Tool object', () => {
    const serialized = colorTemperatureTool.serialize(full);
    const restored = colorTemperatureTool.deserialize(JSON.parse(serialized));
    expect(restored.success).toBe(true);
    if (restored.success) {
      expect(restored.data).toEqual(full);
    }
  });

  it('keeps URL share state round-trip safe', () => {
    expect(roundTrips(full)).toBe(true);
    expect(roundTrips(DEFAULT_STATE)).toBe(true);
  });

  it('rejects malformed payloads', () => {
    expect(deserializeState(null).success).toBe(false);
    expect(deserializeState('string').success).toBe(false);
    expect(deserializeState([1, 2]).success).toBe(false);
    expect(deserializeState(undefined).success).toBe(false);
  });

  it('falls back to defaults for missing or invalid kelvin', () => {
    const restored = deserializeState({});
    expect(restored.success).toBe(true);
    if (restored.success) {
      expect(restored.data.kelvin).toBe(DEFAULT_STATE.kelvin);
      expect(restored.data.history).toEqual([]);
    }
    const nonsense = deserializeState({ kelvin: 'abc' });
    expect(nonsense.success).toBe(true);
    if (nonsense.success) {
      expect(nonsense.data.kelvin).toBe(DEFAULT_STATE.kelvin);
    }
  });

  it('clamps out-of-range kelvin values into the tool bounds', () => {
    const low = deserializeState({ kelvin: '10' });
    const high = deserializeState({ kelvin: '99999' });
    if (low.success) expect(Number(low.data.kelvin)).toBeGreaterThanOrEqual(MIN_KELVIN);
    if (high.success) expect(Number(high.data.kelvin)).toBeLessThanOrEqual(MAX_KELVIN);
  });

  it('filters invalid history entries and caps length', () => {
    const entries = Array.from({ length: MAX_HISTORY + 5 }, (_, i) => ({
      text: `entry ${i}`,
      createdAt: new Date(2026, 0, 1, 0, 0, i).toISOString(),
    }));
    const restored = deserializeState({
      kelvin: '6500',
      history: [...entries, 'bad', { text: 'x' }],
    });
    expect(restored.success).toBe(true);
    if (restored.success) {
      expect(restored.data.history.length).toBe(MAX_HISTORY);
      expect(restored.data.history[0]?.text).toBe('entry 0');
    }
  });
});

describe('withHistory', () => {
  it('prepends newest entries first and caps at MAX_HISTORY', () => {
    const now = new Date('2026-11-23T12:00:00Z');
    let s = state();
    s = withHistory(s, 'one', now);
    s = withHistory(s, 'two', now);
    expect(s.history[0]?.text).toBe('two');
    expect(s.history[1]?.text).toBe('one');
    for (let i = 0; i < MAX_HISTORY + 10; i++) {
      s = withHistory(s, `entry ${i}`, now);
    }
    expect(s.history.length).toBe(MAX_HISTORY);
    expect(s.history[0]?.text).toBe(`entry ${MAX_HISTORY + 9}`);
  });
});

describe('summaryText and tool identity', () => {
  it('summarizes the current temperature', () => {
    expect(summaryText(state({ kelvin: '3200' }))).toContain('3200 K');
    expect(summaryText(state({ kelvin: 'oops' }))).toContain('valid temperature');
  });

  it('exposes the tool contract', () => {
    expect(colorTemperatureTool.id).toBe('color-temperature-converter');
    expect(colorTemperatureTool.initialState).toEqual(DEFAULT_STATE);
    expect(colorTemperatureTool.version).toBe('1.0.0');
  });
});
