# Composition Gate — fix-function-bodies-sagatree

- HEAD_SHA: d686710507408149ae387256aaf7c50f4ba89dac
- BASE_SHA: fa9a4dc6c2b5b7418b8493ec188bdccebddeec16
- Date: 2026-10-14
- Verdict: CLEAR

## Event
Login → `ensure_native_starter_project` RPC → `seed_dornhain_starter_characters` writes `characters.sagatree_profile`; session checks read the same column.

## Hop chain
GoTrue JWT → PostgREST RPC (authenticated) → SECURITY DEFINER SQL functions → renamed `sagatree_*` helpers → canonical `sagatree_profile` column.

## Simulations
| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | Every account gets starter project/characters | Same function path per user; verified for admin, grants unchanged | pass |
| Invalid/missing | anon still blocked; no dangling helper refs | Grants preserved by CREATE OR REPLACE; callee scan returned 0 missing | pass |
| Two consumers / crash | Re-apply and fresh volume (077 then 079 then 085) both end consistent | DO block is a no-op when nothing matches | pass |

## Flags
none

## Skip reason
n/a
