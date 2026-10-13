# Feature: media-opt-golden-qa (#649)

## Intent
Golden Fixtures und End-to-End-, Bundle-, Security- und Performance-Gates für Media Optimizer V1 dauerhaft verankern.

## Happy Path
- [ ] Golden Fixtures: Qualität/Bytes/GIF/Alpha/Abort/Überbudget in check + domain policy
- [ ] E2E: cold load ohne WASM; fünf Surfaces dokumentiert/verdrahtet
- [ ] Initial-Bundle lädt WASM nicht unaufgefordert (facade lazy + vite chunk)
- [ ] `media-optimizer-golden-qa-check` in `test-gate`; Composition SKIPPED/CLEAR
- [ ] Touched files: zero type escape hatches
