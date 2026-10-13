# Composition Gate — sagatree-eradicate-legacy-ids
- HEAD_SHA: 441df28a749103e7da2ee8e50347d24f2fe9b6e5
- BASE_SHA: 14200cf30e7a0a1f9f14f72be17a3f1e45a3a6df
- Date: 2026-10-13
- Verdict: CLEAR

## Event
Authenticated character create/update persists SagaTree Core under `sagatree_profile` / `sagatree-core` only; migration 079 drops `sagadrive_profile`, legacy SQL wrappers, and renames remaining `sagadrive_*` helpers to `sagatree_*`.

## Hop chain
CharacterEditor → supabase-character.repository (`sagatree_profile` write) → PostgREST → `characters.sagatree_profile`; sheet-complete guard reads sagatree only; SQL helpers `sagatree_*` only after 079 rename/drop.

## Simulations
| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | Owner-only character writes; RLS unchanged | same policies + sagatree_profile column | pass |
| Invalid/missing | Preset JSON with only legacy profile key rewritten in 079 | jsonb rewrite before column drop | pass |
| Two consumers / crash | Re-apply 079 idempotent; apply-migrations finds sagatree-db or sagadrive-db | DROP IF EXISTS + container fallback | pass |

## Flags
| Tag | Severity | Hops | Why | Fix |
|-----|----------|------|-----|-----|
| (none) | | | | |
