# Media Optimizer — Server optimize decision (#645)

Feature slug: `media-opt-server-proof`

**Decision:** `deno-adapter`

## Rationale (DE)

Deno kann `@jsquash/{png,jpeg,webp}` (WASM) laden, PNG/JPEG/WebP decoden, optional downscalen und mit Quality-Ladder zu WebP encoden. Laufzeiten und RSS-Deltas liegen für typische Raster (1600×1200 → maxEdge 1024) klar unter großzügigen CI-Ceilings. Slice 12 (#647) darf daher einen **isolierten Deno-/Edge-Adapter** vorbereiten — nicht produktiv verdrahten, bis AuthZ/MIME/Owner unverändert bleiben und Budgets explizit enforced sind.

## Measured (local Deno proof, 2026-10-13)

| Fixture | Status | totalMs (order) | Notes |
|---------|--------|-----------------|-------|
| PNG 1600×1200 synthetic | optimized | ~155 ms | PSNR ≥ 28 dB, WebP ≤ 512 KiB |
| JPEG same | optimized | ~163 ms | |
| WebP same | optimized | ~148 ms | |
| Small WebP 64×64 | unchanged | ~1 ms | already in budget |
| GIF / unknown | unsupported | <1 ms | explicit status, no silent original |
| targetBytes=64 | over-budget | ~283 ms | output null |

RSS delta ceiling in tests: 512 MiB (proof harness); heap/RSS deltas observed in practice are far lower for these fixtures.

## Non-goals confirmed

- Produktive Storage-/Auth-Services und Upload-Routen wurden **nicht** geändert.
- Kein Provider-Output-Optimize in Production in diesem Ticket.

## Alternatives rejected for now

- `dedicated-worker`: not required given successful Deno WASM encode/decode under local Edge-like Deno.
- `not-viable`: rejected — encode/decode and budget statuses work.
