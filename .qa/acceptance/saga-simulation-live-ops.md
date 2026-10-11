# Feature: Simulation im Spiel – Zeit vorstellen und freigeben

## Intent
GM stellt Zeit vor (pure kernel preview), gibt Batch frei; Server validiert Patch und persistiert.

## Happy Path
- [x] Ops `advance_time` / `apply_simulation_batch` / `set_party_location` in 065.
- [x] Hook `useSagaSimulation` API (preview/commit/reject).
- [x] GM Panel on Live world tab (AU markers).
- [x] Checks + test-gate.
- [x] Zero type escape hatches.

## Edge Cases
- [x] days 1–30 server bound
- [x] unknown patch keys rejected
- [x] batch consequences capped at 32
- [x] Non-GM forbidden (SQL + assert)
- [x] Completed sessions rejected by existing RPC (051)

## Assumptions
- Apply migration 065 on target Supabase.
- Preview needs definitionRef like `fixture:mini-saga` or dornhain package.
