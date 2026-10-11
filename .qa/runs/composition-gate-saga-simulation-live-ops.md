# Composition Gate — saga-simulation-live-ops
- HEAD_SHA: c412b7d75f96c109ab9b7fe45a061360ecf48580
- BASE_SHA: ab73d9fff8c5c543d6023a080bf8731ffd25cd6a
- Date: 2026-10-11
- Verdict: CLEAR

## Event
GM previews N days (pure kernel) then commits apply_simulation_batch; SQL validates patch and persists v2 adventure.

## Hop chain
SagaSimulationGmPanel → useSagaSimulation → advanceTime → buildSimulationPreview → useAdventureRuntime.run → apply_session_runtime_command → sagadrive_resolve_adventure_command (065) → world_state + projects.adventure_runtime.

## Simulations
| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | Non-GM forbidden | SQL 42501 + assertAdventureRuntimeAccess | pass |
| Invalid/missing | Bad patch / days | 22023 bounds + unknown keys | pass |
| Two consumers / crash | Idempotency batchId | session_events idempotency key | pass |

## Flags
| Tag | Severity | Hops | Why | Fix |
|-----|----------|------|-----|-----|
| (none) | | | | |
