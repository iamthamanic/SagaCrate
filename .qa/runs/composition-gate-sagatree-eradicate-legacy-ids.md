# Composition Gate — sagatree-eradicate-legacy-ids
- Date: 2026-10-13
- Verdict: CLEAR (static)

## Event
Product code and live schema use only SagaTree identifiers; SagaDrive aliases removed after backfill.

## Hop chain
CharacterEditor → repository (`sagatree_profile` / `sagatree-core`) → PostgREST → `characters.sagatree_profile`; sheet-complete guard reads sagatree only; SQL helpers `sagatree_*` only (wrappers dropped in 079).

## Simulations
| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | Owner-only character writes | unchanged RLS | pass |
| Legacy preset JSON | snapshot key rewritten in 079 | jsonb rewrite | pass |
| Re-apply | IF EXISTS / DROP IF EXISTS | idempotent drops | pass |

## Flags
| Tag | Severity | Hops | Why | Fix |
|-----|----------|------|-----|-----|
| (none) | | | | |
