# Composition Gate — media-opt-item-webp-contract

- HEAD_SHA: 79cd648dcef9975c0ac10cd7d7177a8c9598a738
- BASE_SHA: 0a05fb2b6a1a41065d44be486a6dacaa12c31d90
- Date: 2026-10-13
- Verdict: SKIPPED

## Event
User uploads or Meshy generates an item thumbnail; system accepts PNG/JPEG/WebP with magic-byte validation; Image-to-3D consumes the same asset.

## Hop chain
1. Client / Edge validate MIME via magic bytes (PNG/JPEG/WebP)
2. Storage `item-thumbnails` + `item_thumbnail_assets.mime` check
3. Optional: `item-model3d` downloads thumbnail → data URI → Meshy image-to-3d
4. No ACL / RLS policy changes

## Simulations

| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | 1 upload → 1 asset row | unchanged cardinality | pass |
| Invalid/missing | wrong MIME / fake webp → reject | sniff vs claimed | pass |
| Two consumers / crash | Meshy uses stored bytes; PNG/JPEG still work | shared sniff helper | pass |

## Flags
none

## Skip reason
MIME allowlist expansion on existing single-hop Storage path; no new producer fan-out or AuthZ change.
