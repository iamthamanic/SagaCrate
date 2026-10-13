# Feature: media-opt-server-proof (#645)

## Intent
Vor serverseitiger Verwendung einen reproduzierbaren Deno-/WASM-Proof unter knappen CPU-/RAM-Bedingungen liefern und Deno-Adapter vs. dedizierten Worker entscheiden.

## Happy Path
- [ ] Deno-Test verarbeitet reale PNG/JPEG/WebP Fixtures (WASM-synthetisiert) und misst CPU/RAM/Laufzeit/Qualität (PSNR)
- [ ] Explizite Decision: `deno-adapter` | `dedicated-worker` | `not-viable` in `docs/media-optimizer-server-decision.md`
- [ ] Encode-Failure / unreachable byte budget → Status `failed` / `over-budget`, nie stilles Original
- [ ] Produktive Storage-/Auth-Services unverändert
- [ ] Touched files: zero type escape hatches
