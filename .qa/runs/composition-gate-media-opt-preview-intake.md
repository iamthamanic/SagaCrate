# Composition Gate — media-opt-preview-intake

- HEAD_SHA: 617435d61333bdce24d7f24426a13a2406d77672
- BASE_SHA: 5b831d9c4fe5fbbfd7d32e8cafc51b55861d69a5
- Date: 2026-10-13
- Verdict: SKIPPED

## Event
User selects an image file for later upload; the intake hook shows a local Object URL preview and runs client-side optimizeMedia before any authorized upload callback.

## Hop chain
1. App consumer calls `useMediaOptimizeIntake().selectFile`
2. Object URL preview (client-only) → `optimizeMedia` facade (lazy image engine / Worker)
3. Ready blob held in React state — **no** Storage/Edge write in this slice
4. Optional `upload(uploader)` delegates to an existing authorized pipeline (out of scope for this PR)

Cardinality: one generation per select/abort; stale completions ignored.

## Simulations

| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | 1 select → 1 optimize → 1 ready payload | No fan-out; generation race | pass |
| Invalid/missing | failed/unsupported/over-budget → failed; no silent original upload | buildUploadPayload rejects missing optimized bytes | pass |
| Two consumers / crash | Replace/abort/unmount bumps generation + revokes URLs | disposedRef + revokeAll | pass |

## Flags
none

## Skip reason
Intake is a client-side preview/status wrapper around the existing optimizer facade. Persistence and AuthZ remain in later upload wiring slices; no new producer→consumer Storage hop.
