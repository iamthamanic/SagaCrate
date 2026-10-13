# Composition Gate — sagatree-brand-phase-b
- HEAD_SHA: 60e3db962797a299741f81c4415a3e81fb6ebf9a
- BASE_SHA: c907838dae1e618d52e4f7d6b999d9f56466d0d8
- Date: 2026-10-12
- Verdict: CLEAR

## Event
User-facing SagaTree Core brand + README pitch/carousel; lore prompt branding. Internal key `sagatree-core` unchanged.

## Hop chain
character-creation label → CharacterEditor UI → Edge character-lore-prompt → README/e2e/phase-b contract (+ screenshot carousel docs).

## Simulations
| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | GM/player see SagaTree Core; lore framed as SagaTree | label + prompt | pass |
| Invalid/missing | SagaTree Core label/README section absent | phase-b contract | pass |
| Two consumers / crash | test-gate + e2e assert SagaTree Core | same label | pass |

## Flags
| Tag | Severity | Hops | Why | Fix |
|-----|----------|------|-----|-----|
| (none) | | | | |
