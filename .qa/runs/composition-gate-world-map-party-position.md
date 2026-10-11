# Composition Gate — world-map-party-position
- HEAD_SHA: b6f8b943eb315c316a6b28ce976df073d484d32c
- BASE_SHA: fef75f7138878dda025a6171920733a7e8e1d920
- Date: 2026-10-11
- Verdict: CLEAR

## Event
GM sets party location (label or map:x,y); session adventure op persists `partyLocationRef` on project adventure_runtime; hub overview projects it; player map shows marker without write.

## Hop chain
SagaPartyLocationGmPanel / WorldMapPlayerView(canMoveParty) → useAdventureRuntime.run(set_party_location) → apply_session_runtime_command → adventure.partyLocationRef + projects.adventure_runtime → get_saga_overview.worldStateSummary.partyLocationRef → SagaWorldStatePanel + WorldMapPlayerView(read-only).

## Simulations
| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | Only GM writes; two projects independent | RPC GM gate + per-project runtime | pass |
| Invalid/missing | empty locationRef rejected | SQL 22023 | pass |
| Two consumers / crash | Overview + live map same ref; map missing → text | partyLocationDisplayLabel fallback | pass |

## Flags
| Tag | Severity | Hops | Why | Fix |
|-----|----------|------|-----|-----|
| (none) | | | | |
