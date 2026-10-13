# Composition Gate — media-opt-item-webp-contract

- HEAD_SHA: 3a8e7625580c5f0ad0d4b0e241046fb9d670a360
- BASE_SHA: 0a05fb2b6a1a41065d44be486a6dacaa12c31d90
- Date: 2026-10-13
- Verdict: SKIPPED

## Event
Client or Meshy pipeline stores/reads an item thumbnail; MIME may be PNG, JPEG, or WebP; Meshy image-to-3D may consume a WebP thumbnail as data URI.

## Hop chain
1. Domain `ITEM_THUMBNAIL_ALLOWED_MIME` + sniff (client/edge shared)
2. Edge `item-thumbnail` validate + Storage `item-thumbnails` + DB mime check
3. Optional: `item-model3d` downloads thumbnail bytes → data URI → Meshy

Cardinality: one asset row per upload; existing PNG/JPEG rows unchanged.

## Simulations

| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | 1 upload → 1 storage object + 1 row | Unchanged upload path | pass |
| Invalid/missing | fake webp MIME / wrong magic → reject | sniff + declared MIME mismatch | pass |
| Two consumers / crash | model3d reads same private object | owner-scoped path; no ACL change | pass |

## Flags
none

## Skip reason
MIME allowlist expansion on an existing single-hop Storage path; no new producer fan-out or AuthZ model change.
