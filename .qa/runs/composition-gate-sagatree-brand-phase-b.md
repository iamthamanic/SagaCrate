# Composition Gate — sagatree-brand-phase-b
- HEAD_SHA: 96e1c4635629e28badb349741065e2702b0cf74a
- BASE_SHA: c907838dae1e618d52e4f7d6b999d9f56466d0d8
- Date: 2026-10-12
- Verdict: CLEAR

## Event
User-facing brand copy and ruleset label switch from SagaDrive Core → SagaTree Core; lore Edge prompt branding updates; README elevator pitch product-first. Internal ruleset key `sagadrive-core` unchanged.

## Hop chain
character-creation label `SagaTree Core` → CharacterEditor Select / toasts → preset + inventory UI copy → Edge `character-lore-prompt` product name → README / e2e / phase-b contract consumers.

## Simulations
| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | GM + player see SagaTree Core in editor; lore writer framed as SagaTree | label + prompt strings | pass |
| Invalid/missing | Old SagaDrive Core label / README section absent | phase-b contract forbids | pass |
| Two consumers / crash | test-gate phase-b check + e2e character-editor both assert SagaTree Core | same label source | pass |

## Flags
| Tag | Severity | Hops | Why | Fix |
|-----|----------|------|-----|-----|
| (none) | | | | |
