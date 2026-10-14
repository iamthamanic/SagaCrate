/**
 * profile area — public API for other app areas and the composition root.
 * Location: src/app/profile/index.ts
 */
export { Profile } from './Profile';
/** Re-export — canonical hook lives in shell (avoids shell↔profile cycle). */
export { useAccountAvatar, type UseAccountAvatarResult } from '../shell';
