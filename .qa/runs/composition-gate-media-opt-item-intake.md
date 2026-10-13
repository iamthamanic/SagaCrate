# Composition Gate — media-opt-item-intake

- HEAD_SHA: 810dc8e53cb99e74bc173decf90abd0ce53b6632
- BASE_SHA: cb34bcee51f9e92bcbf18488ab077aa266836e0b
- Date: 2026-10-13
- Verdict: SKIPPED

## Event
User uploads an item thumbnail in Workbench; client shows Object URL, optimizes with item-thumbnail profile, then calls existing item-thumbnail Edge upload.

## Hop chain
1. `useItemAssets.uploadFile` → Object URL preview
2. `prepareItemThumbnailFile` → `optimizeMedia` (item-thumbnail)
3. `itemThumbnailService.uploadThumbnail` → Edge `item-thumbnail` upload → Storage
4. On failure: no `onAssetKeyChange`; prior asset remains

## Simulations

| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | 1 file → 1 prepare → 1 upload | single path | pass |
| Invalid/missing | optimize/upload fail → toast; old key kept | catch without assetKey write | pass |
| Two consumers / crash | submitLock prevents double submit | lock + finally | pass |

## Flags
none

## Skip reason
Reuses existing Edge upload hop; optimizer is client-side prepare only.
