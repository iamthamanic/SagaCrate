# Universal Media Optimizer V1

Parent epic: [#624](https://github.com/iamthamanic/SagaTree/issues/624)  
Feature slug (01): `media-opt-contracts`  
Milestone: `media-optimizer-v1`

## Decision

| Layer | Responsibility |
|-------|----------------|
| `src/domains/media/` | Pure MediaKind / AssetProfile / Budget / Result contracts + policies (no React, no Supabase) |
| `src/infrastructure/media/optimizer/` | Static four-slot facade; lazy engines; image WebP via `@jsquash/webp`; video/audio/model3d stubs → `unsupported` |
| `src/app/media/intake/` | Preview-first hook (Object URL, abort, race); public `src/app/media/index.ts` |
| Existing services / Edge | AuthZ, MIME/magic-byte, owner RLS, persistence — still authoritative |

## Result & policy contracts

Statuses: `optimized | unchanged | unsupported | over-budget | aborted | failed`.

- `unchanged` only when the original already satisfies policy (size/MIME echo must match input).
- Never silently upload the original after a required optimization failure.
- `targetBytes` = desired encoded size; `maxUploadBytes` = hard ceiling (strictly separate).

## Image algorithm (later slices)

Lossless WebP first (`@jsquash/webp`), then quality ladder, then downscale to profile floor; no unnecessary growth; WASM lazy; Worker + Abort with browser/build proof.

## Product limits (domain policies)

| Profile | MIME | maxUpload | Notes |
|---------|------|-----------|-------|
| character-portrait | PNG/JPEG/WebP/GIF | 5 MiB | GIF → convert-static when optimizing |
| map-pin | PNG/JPEG/WebP | 5 MiB | |
| look-reference | PNG/JPEG/WebP | 8 MiB/image | Aggregate request **12 MiB**; 1–10 images |
| item-thumbnail | PNG/JPEG/WebP | 10 MiB | WebP enabled (#641 coordinated Domain/Edge/Bucket/DB) |

## Server

Scriptony browser code is not Deno-native. Slice 11/12 prove WASM/Worker under CPU/RAM limits before provider-output optimize.

## Sequence

Child issues `media-opt-order-01` … `13` with `Depends on #<prev>`; none depend on open epic #624. Queue isolation via milestone `media-optimizer-v1`.

## Non-goals (V1)

No real video/audio/3D transcoding; no FFmpeg.wasm; no replacement storage API; no gameplay changes.
