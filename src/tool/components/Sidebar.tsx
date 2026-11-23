'use client';

import React from 'react';
import { PRESETS, type ToolState } from '../types';

interface SidebarProps {
  state: ToolState;
  onChange: (next: ToolState) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ state }) => {
  return (
    <div className="p-4 space-y-6 text-sm overflow-y-auto h-full" data-testid="temperature-sidebar">
      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Presets</h3>
        <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
          {PRESETS.map((preset) => (
            <li key={preset.key} className="flex justify-between gap-2">
              <span>{preset.label}</span>
              <span className="text-gray-500 dark:text-gray-400">{preset.kelvin} K</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">About</h3>
        <p className="text-xs text-gray-600 dark:text-gray-300">
          Kelvin values are converted to sRGB with Tanner Helland&apos;s blackbody approximation;
          out-of-gamut channels are clamped. The reverse conversion finds the nearest correlated
          color temperature for any RGB/HEX color.
        </p>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Saved results</h3>
        <p className="text-xs text-gray-600 dark:text-gray-300" data-testid="sidebar-history-count">
          {state.history.length} entr{state.history.length === 1 ? 'y' : 'ies'} in history
          {state.history.length > 0 ? ' (newest first)' : ''}
        </p>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Keyboard shortcuts</h3>
        <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
          <li>
            <kbd>C</kbd> — Copy result
          </li>
          <li>
            <kbd>S</kbd> — Save to history
          </li>
          <li>Arrow keys adjust the temperature slider</li>
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Share</h3>
        <p className="text-xs text-gray-600 dark:text-gray-300">
          Use the toolbar share button to create a URL containing the current temperature; open it
          to restore the color.
        </p>
      </div>
    </div>
  );
};
