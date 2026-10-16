# Composition Gate — fix-projects-rls-recursion

- HEAD_SHA: 49e4f8e910df6402bbd491bf251cf0ae7f06540a
- BASE_SHA: a719d716967837c588170b253592622734499a7e
- Date: 2026-10-16
- Verdict: CLEAR

## Event

Authenticated client lists GM / member projects (Library Sagas tab) after migration `092`.

## Hop chain

1. Client → `projects` SELECT (PostgREST)
2. RLS: `gm_user_id = auth.uid()` OR `current_user_is_active_project_member(id)` (SECURITY DEFINER → `project_members`, no projects re-entry)
3. Optional: `project_members` SELECT via `user_id = auth.uid()` OR `is_project_gm(...)` (SECURITY DEFINER → projects/members, RLS bypassed)

## Simulations

| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | Each user evaluates policies with own `auth.uid()` | DEFINER helpers scope by that uid; no fan-out | pass |
| Invalid/missing | Non-member / inactive → row hidden | Helpers false → fail-closed; no elevated client role | pass |
| Two consumers / crash | Concurrent projects + members SELECT no longer recurse | DEFINER bypasses RLS on nested reads; live `count(*)` succeeds | pass |

## Flags

| Tag | Severity | Hops | Why local review missed it | Fix |
|-----|----------|------|----------------------------|-----|
| (none) | | | | |
