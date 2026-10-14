# Composition Gate — session-lobby-cover-device-bar

- HEAD_SHA: 47157808703b815d4e255f42fcf607a83794b417
- BASE_SHA: 6ed009ca33c5e873d101dd973e5d867d5c01fa0f
- Date: 2026-10-15
- Verdict: CLEAR

## Event
User toggles Cam/Mic/Live in the session lobby device bar (local preview only); account avatar upload optimizes then stores under the signed-in user path.

## Hop chain
User gesture (Cam/Mic/Live) → `LobbyDeviceBar` (App) → `useLobbyMediaPreview` (App hook) → `navigator.mediaDevices.getUserMedia` / `enumerateDevices` (browser) → local `<video>` / AnalyserNode VU / LiveAct portrait|NPC preview.

Account avatar: Profile `AccountAvatarSection` → `useMediaOptimizeIntake` (surviveUnmount) → `optimizeMedia` → `supabaseUserProfileRepository.uploadAvatar` → Storage `user-avatars/{uid}/…` + `user_profiles` → `account-avatar-store` / `useAccountAvatar` → shell sidebar + lobby self-seat.

No fan-out producers, no outbox, no LiveKit publish. Device prefs = `deviceId` only in `localStorage` (`sagatree.lobby-media-prefs.v1`).

## Simulations
| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | Each client owns own MediaStream; avatar write own row only | Same — no cross-owner FKs / LiveKit publish | pass |
| Invalid/missing | Denied/unavailable → DE hint; Enter not blocked | `mediaFailureBlocksSessionEnter` unchanged | pass |
| Two consumers / crash | Unmount stops tracks + AudioContext; surviveUnmount only for avatar optimize | Hook cleanup + optional surviveUnmount on avatar intake | pass |

## Flags
| Tag | Severity | Hops | Why local review missed it | Fix |
|-----|----------|------|----------------------------|-----|
| — | — | — | — | n/a |

## Skip reason
n/a
