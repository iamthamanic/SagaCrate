# Composition Gate — session-lobby-cover-device-bar

- HEAD_SHA: db7e90c33d22165738a284aa2b73550e88f6f76c
- Date: 2026-10-15
- Verdict: CLEAR

## Event
User toggles Cam/Mic/Live in the session lobby device bar (local preview only).

## Hop chain
User gesture (Cam/Mic/Live) → `LobbyDeviceBar` (App) → `useLobbyMediaPreview` (App hook) → `navigator.mediaDevices.getUserMedia` / `enumerateDevices` (browser) → local `<video>` / AnalyserNode VU / LiveAct portrait|NPC preview.

No fan-out producers, no outbox, no dual SoT fields. Device prefs = `deviceId` only in `localStorage` (`sagatree.lobby-media-prefs.v1`).

Account avatar display: `userProfileService` / storage signed URL → `account-avatar-store` → `useAccountAvatar` → shell sidebar + lobby self-seat. Upload: intake optimize → `supabaseUserProfileRepository.uploadAvatar` (own `userId` path only).

## Simulations
| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| 1 event, N actors | Each client owns own MediaStream; avatar write own row only | Same — no cross-owner FKs / LiveKit publish | pass |
| invalid / missing | Denied/unavailable → DE hint; Enter not blocked | `mediaFailureBlocksSessionEnter` unchanged | pass |
| 2 consumers / crash | Unmount stops tracks + AudioContext; surviveUnmount only for avatar optimize | Hook cleanup + optional surviveUnmount on avatar intake | pass |

## Flags
| Tag | Severity | Hops | Why local review missed it | Fix |
|-----|----------|------|----------------------------|-----|
| — | — | — | — | n/a |

## Skip reason
n/a
