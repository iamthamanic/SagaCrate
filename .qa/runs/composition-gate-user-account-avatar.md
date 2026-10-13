# Composition Gate — user-account-avatar

- HEAD_SHA: WORKTREE (uncommitted on feat/issue-682-user-account-avatar; base 242524f72264eef25a28fff5b3fd4ec064a0b9b8)
- BASE_SHA: 242524f72264eef25a28fff5b3fd4ec064a0b9b8
- Date: 2026-10-14
- Verdict: CLEAR

## Event
Account avatar upload: User selects image in Profile → Media Optimizer (`user-avatar`) → Storage `user-avatars/{uid}/…` + `user_profiles.avatar_path` update. Lobby roster batch-loads profiles once per refresh and shows account identity (avatar URL / initials, display name, user id) for each membership userId. Path never grants session authorization.

## Hop chain
Profile UI (`AccountAvatarSection` / `useMediaOptimizeIntake`) → `optimizeMedia(user-avatar)` → `userProfileService.uploadAvatar(alreadyOptimized)` → Storage + `user_profiles` row → Lobby `useSessionLobby` `getProfilesByUserIds` (one query) → signed URL per path → `SessionLobbyScreen` roster. Cardinality: one optimize+upload per user action; one profile batch per lobby rebuild (not N fan-out queries).

## Simulations
| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | Each peer sees others' avatars via authenticated SELECT on paths; writes only own folder/row | RLS own write; peer read; batch by userIds | pass |
| Invalid/missing | Optimize fail / missing profile row → keep prior avatar; lobby shows initials + fallback name | Intake never silent-original; batch omits missing; UI fallback | pass |
| Two consumers / crash | Profile refresh + Lobby batch both read `avatar_path` as single source of truth | Same column; signed URL regenerated per consumer load | pass |

## Flags
none

## Skip reason
n/a
