# Composition Gate — session-lobby-media-preview

- HEAD_SHA: 04e3033f1ee8dfd71734aacffb08e874d50217d0
- BASE_SHA: 4d4ca6bdc37eeb4f6bcdba17c59e404a80bc2ad6
- Date: 2026-10-14
- Verdict: CLEAR
- Note: automated composition-gate.mjs SKIPPED (single-hop application diff without downstream side-effect path); manual hop analysis CLEAR

## Event
User opens Session Lobby → clicks Kamera/Mikrofon/LiveAct prüfen → local browser MediaStream / Analyser / portrait preview; preferred deviceIds may be written to localStorage only.

## Hop chain
User gesture → `useLobbyMediaPreview` (App) → `navigator.mediaDevices.getUserMedia` / `enumerateDevices` (browser) → `<video>` / VU-Meter / portrait|NPC icon preview.
LiveAct GM options: domain catalogs (core/builtin) → `listNpcCreatureDefinitions({ scope: 'personal' })` (Infrastructure, membership-scoped) → Select → preview.
No LiveKit / `useSessionMediaPlane` publish. No server write of media blobs.

## Simulations
| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | Each lobby client probes own devices independently | Streams are local per browser tab; prefs are per-origin localStorage | pass |
| Invalid/missing | Denied/unavailable → status label; Enter remains allowed | `mediaFailureBlocksSessionEnter` stays false; CTA not gated on media | pass |
| Two consumers / crash | Camera card + LiveAct share preferred camera deviceId; stop/unmount stops tracks | Single preferred cameraDeviceId in prefs; cleanup stops all tracks + closes AudioContext | pass |

## Flags
none

## Skip reason
n/a (manual CLEAR); automated SKIPPED: single-hop application diff without downstream side-effect path
