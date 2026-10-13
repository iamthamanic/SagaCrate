# Composition Gate — media-opt-world-pin

- HEAD_SHA: 6f3436973fa000ad13bd405f52e1c517a10e961e
- BASE_SHA: f8cf4c510dd0537739476134847a213532108369
- Date: 2026-10-13
- Verdict: SKIPPED

## Event
User attaches an optional image when placing a world map pin; client shows Object URL preview, optimizes with map-pin profile, then uploads to existing `world-map-pins` Storage.

## Hop chain
1. `WorldMapPinDialogs` → `useMediaOptimizeIntake` (map-pin)
2. `optimizeMedia` → ready blob
3. `worldMapService.uploadPinImage(..., { alreadyOptimized: true })` → Storage path under `user.id/world/...`
4. Pin save stores Storage path in map JSON (unchanged RPC) — not Base64

## Simulations

| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | 1 file → 1 optimize → 1 storage object | Single upload | pass |
| Invalid/missing | fail → prior path kept; no silent original | early throw | pass |
| Two consumers / crash | abort/replace via intake generation | intake race | pass |

## Flags
none

## Skip reason
Reuses existing owner-scoped pin Storage hop; intake is client-side. No new Edge route or multi-consumer queue.
