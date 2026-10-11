# Composition Gate — saga-between-sessions-bote
- HEAD_SHA: aa96abaae43c57c4cfca195e7cbd4adb5e917c44
- BASE_SHA: 96e2c57dffe140d0b2ee61bf6993f93181e832bc
- Date: 2026-10-11
- Verdict: CLEAR

## Event
GM advances time on Prepare (reuse #577 panel); commit persists consequences; players read Der Bote from projected consequences; hub overview returns openDeadlines.

## Hop chain
SessionPrepareScreen → SagaBetweenSessionsSection → SagaSimulationGmPanel → useSagaSimulation → apply_simulation_batch (065) → projects.adventure_runtime; Prepare VM → buildBoteLines (domain); SagaResourceScreen → get_saga_overview (066) → SagaWorldStatePanel openDeadlines.

## Simulations
| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | Non-GM no time steppers | isGm gate on GM panel mount | pass |
| Invalid/missing | Empty Bote | buildBoteLines empty kind | pass |
| Two consumers / crash | Player no gm_only deadlines | 066 shared adventure + assertSagaOverviewAudienceSafe | pass |

## Flags
| Tag | Severity | Hops | Why | Fix |
|-----|----------|------|-----|-----|
| (none) | | | | |
