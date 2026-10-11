# ecc-check — sagatree-core-workflows-real-apis (#606)

## Phase A (test-gate)
- Contract check wired in `scripts/test-gate.mjs` → `checkSagatreeCoreWorkflowsContract`
- Live runner + evidence present

## Phase B (composition)
- CLEAR — see composition-gate-sagatree-core-workflows.md

## Phase C (security notes)
- No secrets in report (tokens not persisted)
- Synthetic users use disposable emails
- Documents #604/#605 blockers instead of weakening production authz
