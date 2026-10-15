/**
 * useAccountAvatar — shared account avatar URL for shell, profile, lobby (#682).
 * Location: src/app/shell/useAccountAvatar.ts
 *
 * Lives in shell so Layout can consume it without a shell↔profile import cycle.
 * Loads once per signed-in user into a module cache; optimistic Object URLs from
 * profile upload publish immediately so every consumer updates without remount.
 */
import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import {
  clearAccountAvatarUrlCache,
  ensureAccountAvatarLoaded,
  getAccountAvatarUrlCache,
  publishAccountAvatarUrl,
  subscribeAccountAvatarUrl,
} from '../../infrastructure/user-profile/account-avatar-store';
import { userProfileService } from '../../infrastructure/user-profile/user-profile-service';

export type UseAccountAvatarResult = {
  readonly avatarUrl: string | null;
  /** Publish a display URL (remote signed or local Object URL). */
  readonly setAvatarUrl: (avatarUrl: string | null) => void;
};

export function useAccountAvatar(): UseAccountAvatarResult {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrlState] = useState<string | null>(() =>
    getAccountAvatarUrlCache(),
  );

  useEffect(() => subscribeAccountAvatarUrl(setAvatarUrlState), []);

  useEffect(() => {
    if (!user?.id) {
      clearAccountAvatarUrlCache();
      return;
    }
    void ensureAccountAvatarLoaded(user.id, () => userProfileService.getOwnProfile());
  }, [user?.id]);

  return {
    avatarUrl,
    setAvatarUrl: publishAccountAvatarUrl,
  };
}
