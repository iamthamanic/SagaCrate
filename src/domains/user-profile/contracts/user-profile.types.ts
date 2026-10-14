/**
 * User profile view models (#682).
 * Location: src/domains/user-profile/contracts/user-profile.types.ts
 */

export type UserProfileVm = {
  readonly id: string;
  readonly displayName: string | null;
  readonly avatarPath: string | null;
  /** Signed or resolvable URL for UI; null when no avatar_path. */
  readonly avatarUrl: string | null;
  readonly updatedAt: string | null;
};
