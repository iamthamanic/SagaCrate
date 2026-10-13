/**
 * User profile domain barrel (#682).
 * Location: src/domains/user-profile/index.ts
 */

export type { UserProfileVm } from './contracts/user-profile.types';
export {
  initialsFromDisplayName,
  resolveAccountDisplayName,
  type AccountDisplayNameInput,
} from './display-name';
