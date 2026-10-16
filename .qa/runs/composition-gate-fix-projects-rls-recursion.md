# Composition Gate — fix-projects-rls-recursion

- HEAD_SHA: a5cdd4277a4d9fffc80816ea5ee377cdc7d2fcf4
- Date: 2026-10-16
- Verdict: CLEAR

## Event
Authenticated client lists GM / member projects (Library Sagas tab).

## Hop chain
1. Client → `projects` SELECT (PostgREST)
2. RLS: `gm_user_id = auth.uid()` OR `current_user_is_active_project_member(id)` (SECURITY DEFINER → `project_members`, no projects re-entry)
3. Optional: `project_members` SELECT via `user_id = auth.uid()` OR `is_project_gm(...)` (SECURITY DEFINER → projects/members, RLS bypassed)

## Simulations

### N-actors
Each user evaluates policies with own `auth.uid()`; DEFINER helpers scope by that uid. No fan-out side-effect. **PASS**

### Invalid / missing
Non-member / inactive membership → helpers false → row hidden (fail-closed). No elevated client role. **PASS**

### Concurrent consumers
Two SELECTs (projects + members) no longer form a recursive policy cycle; verified live: `authenticated` role `count(*)` on projects/members succeeds. **PASS**

## Findings
None.
