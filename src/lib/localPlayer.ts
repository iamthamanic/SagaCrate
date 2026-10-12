/**
 * Shared local-player identity helpers for the local-only SagaTree stack.
 *
 * The `player` shortcut maps to the seeded GoTrue user (LOCAL_PLAYER_EMAIL).
 * Admin and player have equal product rights today; saga-scoped permissions
 * come later inside each saga. Keep UUID in sync with migration 074.
 * Location: src/lib/localPlayer.ts.
 */

export const LOCAL_PLAYER_USER_ID = '00000000-0000-4000-8000-000000000002';

export const LOCAL_PLAYER_USERNAME = 'player';
export const LOCAL_PLAYER_PASSWORD = '1234';
/** Seeded email — keep stable; renaming would break existing GoTrue rows. */
export const LOCAL_PLAYER_EMAIL = 'player@sagadrive.local';

export function isLocalPlayerShortcut(identifier: string, password: string): boolean {
  const normalized = identifier.trim().toLowerCase();
  return (
    (normalized === LOCAL_PLAYER_USERNAME || normalized === LOCAL_PLAYER_EMAIL) &&
    password === LOCAL_PLAYER_PASSWORD
  );
}
