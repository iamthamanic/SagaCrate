/**
 * Shared local-admin identity helpers for the local-only SagaTree stack.
 *
 * The `admin` shortcut maps to the seeded GoTrue user (LOCAL_ADMIN_EMAIL) so
 * the app holds a real JWT and RLS sees the `authenticated` role. The fallback
 * user id equals the seeded auth.users row (migration 011) — a valid UUID, so
 * Postgres never rejects it as `invalid input syntax for type uuid`. Offline
 * UI state resolves to the same owner id the seeded session would produce.
 * Location: src/lib/localAdmin.ts.
 */

export const LOCAL_ADMIN_STORAGE_KEY = 'sagatree-local-admin-session';
/** @deprecated Read-migrated to LOCAL_ADMIN_STORAGE_KEY. */
const LEGACY_LOCAL_ADMIN_STORAGE_KEY = 'sagatree-local-admin-session';

/**
 * Fixed UUID of the seeded local admin account (migration 011). Must stay in
 * sync with `supabase/migrations/011_seed_local_admin.sql`.
 */
export const LOCAL_ADMIN_USER_ID = '00000000-0000-4000-8000-000000000001';

export const LOCAL_ADMIN_USERNAME = 'admin';
export const LOCAL_ADMIN_PASSWORD = '1234';
/** Seeded email — keep stable; renaming would break existing GoTrue rows. */
export const LOCAL_ADMIN_EMAIL = 'admin@sagatree.local';

export function isLocalAdminSession(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.localStorage.getItem(LOCAL_ADMIN_STORAGE_KEY) === 'true') return true;
  if (window.localStorage.getItem(LEGACY_LOCAL_ADMIN_STORAGE_KEY) === 'true') {
    window.localStorage.setItem(LOCAL_ADMIN_STORAGE_KEY, 'true');
    return true;
  }
  return false;
}

export function setLocalAdminSession(active: boolean): void {
  if (typeof window === 'undefined') return;
  if (active) {
    window.localStorage.setItem(LOCAL_ADMIN_STORAGE_KEY, 'true');
  } else {
    window.localStorage.removeItem(LOCAL_ADMIN_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_LOCAL_ADMIN_STORAGE_KEY);
  }
}
