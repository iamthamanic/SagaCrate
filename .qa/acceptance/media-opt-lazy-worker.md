# Feature: media-opt-lazy-worker (#632)

## Intent
WASM/Worker-Integration mit Vite, Abort, Pixel- und RAM-Grenzen sowie Bundle-Entkopplung absichern.

## Happy Path
- [ ] Initial-App-Chunk enthält keinen WebP-WASM-Encoder (lazy Worker / dynamic import + Vite chunk)
- [ ] Worker-Encoding und Browser-Fallback sind nachweislich nutzbar
- [ ] Abort beendet den Auftrag ohne Storage-Side-Effects (worker.terminate)
- [ ] Pixel- und Eingabegrößenlimits schützen vor extremer Speichernutzung
- [ ] Touched files: zero type escape hatches (typed-strict / Boy Scout)

## Implementation Notes
- `image.worker.ts` + `webp-worker-client.ts` with main-thread fallback
- `resource-limits.ts` for input bytes / pixels
- `vite.config.ts` manualChunks `jsquash-webp`
