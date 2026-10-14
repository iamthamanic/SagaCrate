/**
 * useLibraryCornerMenu — shared open/toggle/busy state for Library ⋮ menus.
 * Location: src/app/library/useLibraryCornerMenu.ts
 *
 * Owns the portal anchor so Embla slide remounts do not lose the open panel.
 * Pair with EntityBrowserCornerMenuTrigger + EntityBrowserCornerMenuPortal.
 */
import { useCallback, useState } from 'react';
import type { EntityBrowserCornerMenuAnchor } from './EntityBrowserCornerMenu';

export type LibraryCornerMenuState = EntityBrowserCornerMenuAnchor;

export function useLibraryCornerMenu() {
  const [anchor, setAnchor] = useState<LibraryCornerMenuState | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const close = useCallback(() => {
    setAnchor(null);
  }, []);

  const toggle = useCallback(
    (menuKey: string, rect: DOMRect, triggerEl: HTMLElement) => {
      setAnchor((prev) => {
        if (prev?.menuKey === menuKey && prev.triggerEl === triggerEl) {
          return null;
        }
        return {
          menuKey,
          top: rect.bottom + 4,
          left: rect.right - 224,
          triggerEl,
        };
      });
    },
    [],
  );

  const isOpen = useCallback(
    (menuKey: string) => anchor?.menuKey === menuKey,
    [anchor?.menuKey],
  );

  const isBusy = useCallback(
    (menuKey: string) => busyKey === menuKey,
    [busyKey],
  );

  return {
    anchor,
    openMenuKey: anchor?.menuKey ?? null,
    busyKey,
    setBusyKey,
    toggle,
    close,
    isOpen,
    isBusy,
  };
}

export type UseLibraryCornerMenuReturn = ReturnType<typeof useLibraryCornerMenu>;
