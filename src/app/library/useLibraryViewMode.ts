/**
 * useLibraryViewMode — shared Liste / Grid / Karussell preference for Library tabs.
 * Location: src/app/library/useLibraryViewMode.ts
 *
 * Persists per-tab via localStorage. Default: list on md+, carousel on phone.
 */
import { useEffect, useState } from 'react';

export type LibraryViewMode = 'list' | 'grid' | 'carousel';

const VIEW_MODES: readonly LibraryViewMode[] = ['list', 'grid', 'carousel'];

export function isLibraryViewMode(value: unknown): value is LibraryViewMode {
  return typeof value === 'string' && (VIEW_MODES as readonly string[]).includes(value);
}

export function defaultLibraryViewMode(): LibraryViewMode {
  if (typeof window === 'undefined') return 'list';
  return window.innerWidth >= 768 ? 'list' : 'carousel';
}

export function loadLibraryViewMode(storageKey: string): LibraryViewMode {
  const fallback = defaultLibraryViewMode();
  try {
    const saved = window.localStorage.getItem(storageKey);
    return isLibraryViewMode(saved) ? saved : fallback;
  } catch {
    return fallback;
  }
}

export function useLibraryViewMode(storageKey: string) {
  const [viewMode, setViewMode] = useState<LibraryViewMode>(() =>
    loadLibraryViewMode(storageKey),
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, viewMode);
    } catch {
      // Private mode / storage disabled.
    }
  }, [storageKey, viewMode]);

  return { viewMode, setViewMode } as const;
}
