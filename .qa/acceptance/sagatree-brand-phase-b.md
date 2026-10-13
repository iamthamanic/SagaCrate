# Acceptance — sagatree-brand-phase-b (SagaTree Core label)

## Intent
User-facing ruleset name is **SagaTree Core**. Elevator pitch in README frames SagaTree
as a dark, tool-like TTRPG surface with self-hosted Supabase stack.

## Checks
- [ ] Ruleset select label `SagaTree Core` (`sagatree-core` key unchanged)
- [ ] Character editor / presets / inventory copy use SagaTree Core
- [ ] README Elevator Pitch + SagaTree Core editor section
- [ ] `scripts/sagatree-brand-phase-b-check.mjs` PASS
- [ ] e2e character editor asserts SagaTree Core

## Out of scope
- DB column / RPC rename of `sagatree-core` (later schema phase)
- Full rewrite of every historical `.qa/` acceptance mentioning SagaTree Core
