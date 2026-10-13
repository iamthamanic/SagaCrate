# Composition Gate — media-opt-lazy-worker

- HEAD_SHA: 40c36fa9b8a25aa89228dff26e9da43c33f53ef9
- BASE_SHA: 7ce5b13167f58fd34bad67664a627bd0865279c4
- Date: 2026-10-13
- Verdict: SKIPPED

## Event
Client encodes an image via the media optimizer image engine; optionally offloads WASM encode to a dedicated Worker.

## Hop chain
1. `optimizeMedia` facade (lazy import) → `optimizeImage`
2. Policy/resource guards (domain + `resource-limits`)
3. Raster decode on main thread → `encodeWebpWithWorkerFallback`
4. Worker (`image.worker.ts`) OR main-thread fallback runs `encodeWebpUnderBudget` / `@jsquash/webp`
5. Typed `MediaOptimizeResult` returned to caller — **no** Storage/Edge write in this slice

Cardinality: one encode job per call; abort terminates the Worker (no persist).

## Simulations

| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | 1 call → 1 encode → 1 result | No fan-out; no shared queue claim | pass |
| Invalid/missing | Missing bytes / over pixel limit → failed/over-budget; no fake optimized | Early returns before encode | pass |
| Two consumers / crash | Abort terminates worker; no Storage side effects | `worker.terminate` on abort; no upload hop | pass |

## Flags
none

## Skip reason
Worker is an in-process encode offload only — no producer→consumer persistence, webhook, or multi-hop business event. Storage/AuthZ remain in later upload slices.
