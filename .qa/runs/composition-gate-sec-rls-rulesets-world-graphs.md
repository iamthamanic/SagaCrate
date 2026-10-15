# Composition Gate — sec-rls-rulesets-world-graphs

- HEAD_SHA: e256d488158cddfd05dcc250fee84f590a95cde7
- BASE_SHA: f13dd95182fab57d925e5e3c0bd8a08c89dea25c
- Date: 2026-10-15
- Verdict: CLEAR

## Event
Authenticated stranger requests `rulesets` / `world_graphs` rows by id belonging to another project.

## Hop chain
Browser/PostgREST JWT → `rest/v1/{rulesets|world_graphs}` → Postgres RLS policies (`086`) → empty set or denied mutate (no cross-owner leak).

## Simulations
| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | GM creates row; stranger cannot SELECT/UPDATE by id | Live suite deny checks pass | pass |
| Invalid/missing | No membership → no row visibility | `USING` requires GM or `current_user_is_active_project_member` | pass |
| Two consumers / crash | REST + Edge service-role bypass remain intentional | Policies only for `TO authenticated` | pass |

## Flags
| Tag | Severity | Hops | Why local review missed it | Fix |
|-----|----------|------|----------------------------|-----|
| (none) | — | — | — | — |
