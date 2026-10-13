# Composition Gate — media-opt-item-intake

- HEAD_SHA: 04250ab9182d5d7f76932f1869b8a67214a4b747
- BASE_SHA: cb34bcee51f9e92bcbf18488ab077aa266836e0b
- Date: 2026-10-13
- Verdict: SKIPPED

## Event
User uploads an item thumbnail in the Workbench; client shows Object URL preview, optimizes with item-thumbnail profile, then calls existing item-thumbnail Edge upload.

## Hop chain
1. `useItemAssets.runUpload` → Object URL preview
2. `prepareItemThumbnailFile` → `optimizeMedia` (item-thumbnail)
3. `itemThumbnailService.uploadThumbnail` → Edge `item-thumbnail` upload (magic/MIME/owner)
4. Signed URL returned; prior assetKey/URL untouched on failure

## Simulations

| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | 1 file → 1 optimize → 1 Edge upload | Single submit lock | pass |
| Invalid/missing | optimize/upload fail → prior asset kept | resolvedUrl uncleared | pass |
| Two consumers / crash | submitLock prevents double submit | existing lock | pass |

## Flags
none

## Skip reason
Client-side prepare before existing Edge upload hop; no new Storage ACL or producer fan-out.
