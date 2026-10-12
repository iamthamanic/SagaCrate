# Composition Gate — dornhain-starter-and-brand-cleanup
- HEAD_SHA: e702269b5d0b9724a94273d02978af063be86313
- BASE_SHA: 00d470c3a85f6c27aef2f6cebef44ee1626bdf44
- Date: 2026-10-12
- Verdict: CLEAR

## Event
Authenticated GM loads project summaries (SessionJoin / Library). Client calls `ensure_native_starter_project` so the native Dornhain definition becomes a selectable playthrough; character SELECT no longer depends on direct `projects` table scans under column allow-lists.

## Hop chain
useProjectSummaries → project-service.fetchUserProjectSummaries → rpc ensure_native_starter_project (SECURITY DEFINER) → create_project_from_saga_version → projects + project_members → PostgREST SELECT PROJECT_SAFE + saga_definitions embed; character summaries → characters RLS (owner OR is_project_gm OR active member).

## Simulations
| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | Only that GM gets/owns the Dornhain playthrough; other users unaffected | ensure filters by auth.uid() + gm_user_id | pass |
| Invalid/missing | Missing Dornhain seed → soft warn, list still loads; forbid_native still blocks client native inserts | soft-fail rpc + trigger remains | pass |
| Two consumers / crash | Second ensure is idempotent (`created: false`); no duplicate saga projects | SELECT existing by gm+saga_id before create | pass |

## Flags
| Tag | Severity | Hops | Why | Fix |
|-----|----------|------|-----|-----|
| (none) | | | | |
