'use client';

import React from 'react';
import {
  DEFAULT_STATE,
  MAX_KELVIN,
  MIN_KELVIN,
  PRESETS,
  clamp,
  kelvinToHex,
  kelvinToRgb,
  kelvinToRgbRaw,
  parseHex,
  parseNumber,
  rgbToKelvin,
  type ToolState,
} from '../types';

interface CanvasProps {
  state: ToolState;
  onChange?: (state: ToolState) => void;
  onSaveHistory?: (text: string) => void;
}

function CopyButton({ value, testid }: { value: string; testid?: string }) {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable; ignore
    }
  }, [value]);
  return (
    <button
      type="button"
      onClick={handleCopy}
      data-testid={testid}
      className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
      aria-label={`Copy ${value}`}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export const Canvas: React.FC<CanvasProps> = ({ state, onChange, onSaveHistory }) => {
  const kelvinValue = parseNumber(state.kelvin);
  const valid = kelvinValue !== null;
  const safeKelvin =
    kelvinValue === null
      ? Number(DEFAULT_STATE.kelvin)
      : clamp(kelvinValue, MIN_KELVIN, MAX_KELVIN);

  const rgb = kelvinToRgb(safeKelvin);
  const hex = kelvinToHex(safeKelvin);
  const raw = kelvinToRgbRaw(safeKelvin);
  const clampNote = kelvinToRgbRaw(safeKelvin);
  const clampedAny = clampNote.r < 0 || clampNote.r > 255 || clampNote.g < 0 || clampNote.g > 255;
  const backKelvin = rgbToKelvin(rgb.r, rgb.g, rgb.b);

  const update = (patch: Partial<ToolState>) => onChange?.({ ...state, ...patch });
  const setKelvin = (value: string) => update({ kelvin: value });

  const [hexInput, setHexInput] = React.useState<string>('');

  const applyHex = () => {
    const parsed = parseHex(hexInput);
    if (!parsed) return;
    const nearest = rgbToKelvin(parsed.r, parsed.g, parsed.b);
    setKelvin(String(nearest));
    setHexInput('');
  };

  return (
    <div className="p-4 space-y-6 overflow-y-auto h-full" data-testid="temperature-canvas">
      {/* Live color swatch preview */}
      <div
        className="rounded-lg border border-gray-200 p-6 flex items-center justify-center dark:border-gray-800"
        data-testid="swatch-preview"
      >
        <div
          role="img"
          aria-label={`Color preview at ${Math.round(safeKelvin)} kelvin`}
          data-testid="swatch-color"
          className="w-40 h-24 rounded-md shadow-inner flex items-end justify-center"
          style={{
            backgroundColor: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.08), rgba(255,255,255,0.08))',
          }}
        >
          <span className="mb-1 px-2 py-0.5 rounded bg-black/40 text-white text-xs font-mono">
            {hex}
          </span>
        </div>
      </div>

      {/* Temperature controls */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4 dark:border-gray-800 dark:bg-gray-900">
        <div>
          <label
            htmlFor="kelvin-slider"
            className="block text-xs font-medium text-gray-700 dark:text-gray-300"
          >
            Color temperature ({MIN_KELVIN}K–{MAX_KELVIN}K)
          </label>
          <input
            id="kelvin-slider"
            type="range"
            min={MIN_KELVIN}
            max={MAX_KELVIN}
            step={50}
            value={safeKelvin}
            onChange={(e) => setKelvin(e.target.value)}
            data-testid="kelvin-slider"
            className="w-full mt-2 accent-amber-500"
            aria-valuetext={`${Math.round(safeKelvin)} kelvin`}
          />
        </div>
        <div>
          <label
            htmlFor="kelvin-input"
            className="block text-xs font-medium text-gray-700 dark:text-gray-300"
          >
            Kelvin value
          </label>
          <input
            id="kelvin-input"
            type="number"
            inputMode="numeric"
            min={MIN_KELVIN}
            max={MAX_KELVIN}
            value={state.kelvin}
            onChange={(e) => setKelvin(e.target.value)}
            data-testid="kelvin-input"
            aria-invalid={!valid}
            className="mt-1 w-40 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
          {!valid ? (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400" data-testid="kelvin-error">
              Enter a temperature between {MIN_KELVIN} and {MAX_KELVIN}.
            </p>
          ) : null}
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Temperature presets">
          {PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              data-testid={`preset-${preset.key}`}
              aria-pressed={Math.round(safeKelvin) === preset.kelvin}
              onClick={() => setKelvin(String(preset.kelvin))}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
                Math.round(safeKelvin) === preset.kelvin
                  ? 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-900/40 dark:text-amber-100'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400'
              }`}
            >
              {preset.label} · {preset.kelvin}K
            </button>
          ))}
        </div>
      </div>

      {/* RGB / HEX inputs and results */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="hex-input"
              className="block text-xs font-medium text-gray-700 dark:text-gray-300"
            >
              Convert from HEX
            </label>
            <div className="flex gap-2 mt-1">
              <input
                id="hex-input"
                type="text"
                value={hexInput}
                placeholder="#FFEBE0"
                onChange={(e) => setHexInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') applyHex();
                }}
                data-testid="hex-input"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-mono text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
              <button
                type="button"
                onClick={applyHex}
                data-testid="btn-apply-hex"
                className="rounded-md bg-amber-500 px-3 py-2 text-xs font-medium text-white hover:bg-amber-600"
              >
                Convert
              </button>
            </div>
          </div>
          <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
            <p className="font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Conversion
            </p>
            <p data-testid="rgb-out" className="font-mono">
              rgb({rgb.r}, {rgb.g}, {rgb.b})
            </p>
            <p data-testid="hex-out" className="font-mono flex items-center gap-2">
              {hex} <CopyButton value={hex} testid="copy-hex" />
            </p>
            <p data-testid="rgb-copy-row" className="flex items-center gap-2">
              <span className="font-mono">
                {rgb.r}, {rgb.g}, {rgb.b}
              </span>
              <CopyButton value={`${rgb.r}, ${rgb.g}, ${rgb.b}`} testid="copy-rgb" />
            </p>
            <p data-testid="kelvin-copy-row" className="flex items-center gap-2">
              <span className="font-mono">{Math.round(safeKelvin)} K</span>
              <CopyButton value={`${Math.round(safeKelvin)}`} testid="copy-kelvin" />
            </p>
          </div>
        </div>

        <div
          className="rounded-md bg-gray-50 p-3 text-xs text-gray-600 dark:bg-gray-800/50 dark:text-gray-300"
          data-testid="blackbody-out"
        >
          <p className="font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
            Blackbody white point (before clamping)
          </p>
          <p className="font-mono" data-testid="raw-rgb">
            raw rgb({Math.round(raw.r)}, {Math.round(raw.g)}, {Math.round(raw.b)})
          </p>
          {clampedAny ? (
            <p className="mt-1" data-testid="clamp-note">
              Values outside 0–255 are clamped into the sRGB gamut.
            </p>
          ) : null}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400" data-testid="roundtrip-note">
          Nearest temperature for this color: ≈ {backKelvin} K
        </p>
      </div>

      <div className="text-center">
        <button
          type="button"
          data-testid="btn-save-history"
          onClick={() => onSaveHistory?.(`${Math.round(safeKelvin)} K → ${hex}`)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Save to history
        </button>
      </div>

      {/* History */}
      <div>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          History
        </h3>
        {state.history.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400" data-testid="history-empty">
            No saved conversions yet.
          </p>
        ) : (
          <ul className="space-y-1" data-testid="history-list">
            {state.history.map((entry, i) => (
              <li
                key={`${entry.createdAt}-${i}`}
                className="flex items-center justify-between gap-2 rounded-md border border-gray-200 px-3 py-1.5 text-xs dark:border-gray-800"
              >
                <span className="text-gray-700 dark:text-gray-300">{entry.text}</span>
                <CopyButton value={entry.text} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-center text-xs text-gray-500 dark:text-gray-400">
        All conversions run locally in your browser; nothing is uploaded.
      </p>
    </div>
  );
};
