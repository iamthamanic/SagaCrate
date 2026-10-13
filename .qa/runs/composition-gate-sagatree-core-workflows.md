# composition-gate — sagatree-core-workflows-real-apis (#606)

## Verdict
CLEAR

## Actors
1. GoTrue (login) → JWT
2. PostgREST projects/sessions (+ RPC create/join)
3. Storage character-portraits
4. Edge dm-tools (member)
5. Evidence consumer: contract-check + report.json

## Checks
- Producer→consumer: live script writes `report.json`; contract-check reads required passes
- No invalid fallback: BLOCKED_604 / BLOCKED_605 are explicit statuses, not silent skips
- Two consumers: contract-check + test-gate wiring both consume the same report shape
- HEAD ancestor: evidence committed on feature branch with script

## Out of scope
Realtime WS hop until #604 boots `sagatree-realtime`
