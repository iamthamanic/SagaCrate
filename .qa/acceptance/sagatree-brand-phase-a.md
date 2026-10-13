# Acceptance — sagatree-brand-phase-a (#589 Phase A)

## Intent
Visible product brand is **SagaTree** (login, shell, document title, package name).
Do **not** rename SagaTree Core rules IDs, DB RPCs, or story-domain „Saga“.

## Checks
- [ ] `scripts/sagatree-brand-phase-a-check.mjs` PASS
- [ ] `e2e/smoke.app-loads.spec.ts` asserts title + heading SagaTree
- [ ] Login / AuthGate / Layout show SagaTree
- [ ] `SagaTreeLogo` is the canonical logo component
- [ ] Zero type escape hatches on touched shell files

## Out of scope (later phases)
- SagaTree Core editor copy (Phase B)
- Contract version strings / DB rename (Phase C–E)
