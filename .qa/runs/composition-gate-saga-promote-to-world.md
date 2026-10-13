# Composition Gate — saga-promote-to-world
- HEAD_SHA: ac5b52d943e469ef31711015638a8de3cc7c8b85
- BASE_SHA: 2d1b5871191b9e34488c31b2d0d0419f6c7b2d8b
- Date: 2026-10-11
- Verdict: CLEAR

## Event
GM confirms promote of a recap consequence into saga draft knowledgeFacts (author) or world promotedLore (world owner); ledger idempotency; session_events audit.

## Hop chain
SessionRecapPromoteActions → sessionOutcomePromotionService → promote_session_outcome_to_saga|world RPC → sagatree_find_session_consequence → saga_definition_versions.payload / world_profiles.modules → session_outcome_promotions + append_session_event.

## Simulations
| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | Author/world-owner only; GM without rights fails | SQL 42501 | pass |
| Invalid/missing | unknown consequence / native saga | P0002 / native message | pass |
| Two consumers / crash | Idempotent second promote; revision bump once | UNIQUE ledger + early return | pass |

## Flags
| Tag | Severity | Hops | Why | Fix |
|-----|----------|------|-----|-----|
| (none) | | | | |
