/**
 * In-memory account avatar URL cache — shared across shell, profile, lobby (#682).
 * Location: src/infrastructure/user-profile/account-avatar-store.ts
 *
 * Holds the latest display URL (signed remote or local Object URL) so every
 * surface reads the same value without waiting for a remount/refetch.
 */

type AvatarListener = (avatarUrl: string | null) => void;

let cachedAvatarUrl: string | null = null;
/** User id for which a remote load was attempted (success or empty). */
let remoteLoadedUserId: string | null = null;
let loadInFlight: Promise<void> | null = null;
const listeners = new Set<AvatarListener>();

export function getAccountAvatarUrlCache(): string | null {
  return cachedAvatarUrl;
}

export function getAccountAvatarLoadedUserId(): string | null {
  return remoteLoadedUserId;
}

export function publishAccountAvatarUrl(avatarUrl: string | null): void {
  if (cachedAvatarUrl === avatarUrl) return;
  cachedAvatarUrl = avatarUrl;
  for (const listener of listeners) {
    listener(avatarUrl);
  }
}

export function clearAccountAvatarUrlCache(): void {
  remoteLoadedUserId = null;
  loadInFlight = null;
  if (cachedAvatarUrl === null) return;
  cachedAvatarUrl = null;
  for (const listener of listeners) {
    listener(null);
  }
}

export function subscribeAccountAvatarUrl(listener: AvatarListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

type ProfileLoader = () => Promise<{ avatarUrl: string | null } | null>;

/**
 * Load own avatar once per user. Does not clear an optimistic local preview
 * when the remote path is still empty.
 */
export function ensureAccountAvatarLoaded(
  userId: string,
  loadProfile: ProfileLoader,
): Promise<void> {
  if (remoteLoadedUserId === userId) {
    return Promise.resolve();
  }
  if (loadInFlight) return loadInFlight;

  loadInFlight = (async () => {
    try {
      const row = await loadProfile();
      const remote = row?.avatarUrl ?? null;
      remoteLoadedUserId = userId;
      if (remote) {
        publishAccountAvatarUrl(remote);
      }
      // else: keep optimistic cache (local Object URL) if present
    } catch (err) {
      console.error('Account avatar remote load failed:', err);
      remoteLoadedUserId = userId;
    } finally {
      loadInFlight = null;
    }
  })();

  return loadInFlight;
}
