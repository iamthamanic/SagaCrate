# Composition Gate — sagatree-schema-infra-rename
- HEAD_SHA: aa63450bcda9d8080fe375a9a4c7d37129a233b1
- BASE_SHA: 1af9ff434bea38ad9fef92deab3264dc1c098406
- Date: 2026-10-12
- Verdict: CLEAR

## Event
Authenticated character create/update persists SagaTree Core profile under `sagatree_profile` / `sagatree-core` while legacy `sagatree_*` aliases remain readable; native saga forbid trigger and public-id generators keep working under both names.

## Hop chain
CharacterEditor → supabase-character.repository (sagatree_profile write) → PostgREST → characters + sync trigger → sagatree_profile mirror; sheet-complete guard reads COALESCE(sagatree, sagatree); SQL helpers sagatree_* with sagatree_* wrappers; ensure_native_starter unchanged.

## Simulations
| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | Owner-only character writes; RLS unchanged | same policies + column grants on sagatree_profile | pass |
| Invalid/missing | Legacy preset JSON with only sagatree_profile still imports | normalizeSnapshot dual-read | pass |
| Two consumers / crash | Re-apply 073 idempotent; docker script finds sagatree-db or sagatree-db | IF NOT EXISTS + container fallback | pass |

## Flags
| Tag | Severity | Hops | Why | Fix |
|-----|----------|------|-----|-----|
| (none) | | | | |
