# Composition Gate — media-opt-look-reference

- HEAD_SHA: 8f65e5e5f940b7f69fc8cfe5313a56f7b525fffa
- BASE_SHA: f1185a1aea4177ecb247dbea2a747558784e0130
- Date: 2026-10-13
- Verdict: SKIPPED

## Event
User adds look reference images; client shows Object URL preview, optimizes with look-reference profile (8 MiB/image, 12 MiB aggregate), then sends Base64 to existing look-reference-analysis Edge.

## Hop chain
1. `LookReferenceAdaptionFlow.addFiles` → Object URL preview
2. `prepareLookReferenceFileForAnalysis` → `optimizeMedia` (look-reference)
3. Base64 of optimized bytes → `analyzeLookReferences` (aggregate guard) → Edge `look-reference-analysis`
4. Draft returned — no silent save

## Simulations

| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | N images → N prepare → 1 analyze | Single analyze invoke | pass |
| Invalid/missing | over aggregate / optimize fail → error; prior refs kept | rollback provisional | pass |
| Two consumers / crash | no dual writers | local state only until analyze | pass |

## Flags
none

## Skip reason
Reuses existing Edge analysis hop; optimizer is client-side before Base64. No new Storage producer fan-out.
