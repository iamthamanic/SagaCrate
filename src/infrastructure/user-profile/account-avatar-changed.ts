/**
 * Account avatar publish API — thin facade over the shared cache (#682).
 * Location: src/infrastructure/user-profile/account-avatar-changed.ts
 */
import {
  publishAccountAvatarUrl,
  subscribeAccountAvatarUrl,
} from './account-avatar-store';

/** @deprecated Prefer publishAccountAvatarUrl — kept for call-site clarity. */
export const ACCOUNT_AVATAR_CHANGED_EVENT = 'sagatree:account-avatar-changed';

export type AccountAvatarChangedDetail = {
  readonly avatarUrl: string | null;
};

export function notifyAccountAvatarChanged(avatarUrl: string | null): void {
  publishAccountAvatarUrl(avatarUrl);
}

export function subscribeAccountAvatarChanged(
  listener: (avatarUrl: string | null) => void,
): () => void {
  return subscribeAccountAvatarUrl(listener);
}
