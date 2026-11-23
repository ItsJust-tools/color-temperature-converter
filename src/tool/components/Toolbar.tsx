'use client';

import React from 'react';
import type { ToolState } from '../types';

interface ToolbarProps {
  state: ToolState;
  onChange: (next: ToolState) => void;
  onClear: () => void;
  onCopy?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ state, onClear, onCopy }) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
      <div
        className="flex items-center gap-2"
        role="group"
        aria-label="Color temperature tool controls"
      >
        <button
          type="button"
          onClick={onClear}
          data-testid="btn-clear"
          className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Clear history
        </button>
        {onCopy ? (
          <button
            type="button"
            onClick={onCopy}
            data-testid="btn-copy-result"
            className="rounded-md bg-amber-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-amber-600"
          >
            Copy result
          </button>
        ) : null}
        {state.history.length > 0 ? (
          <span className="text-xs text-gray-500 dark:text-gray-400" data-testid="history-count">
            {state.history.length} saved
          </span>
        ) : null}
      </div>
    </div>
  );
};
