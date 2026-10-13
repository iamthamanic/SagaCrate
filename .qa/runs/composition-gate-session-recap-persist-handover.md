# Composition Gate — session-recap-persist-handover

- HEAD_SHA: 050c08dd6be3f2e9a2c99bab1747671cc337356f
- BASE_SHA: 7de64b053ee4a9aa0f5479efa47599f887f8988b
- Date: 2026-10-11
- Verdict: CLEAR

## Event
GM completes a session; system persists an episode recap and the next create_project_session hydrates adventure (+ optional knowledge) from the project for continuity. Members read role-projected highlights.

## Hop chain
`set_session_status(completed)` → `sagatree_upsert_session_recap` (writes `session_recaps` + updates `projects.adventure_runtime`) → later `create_project_session` copies project adventure (+ last completed knowledge) into new `sessions.world_state` → Recap UI `useSessionPrepareRecap` → `get_session_recap` (SECURITY DEFINER, audience filter) → domain parse → SessionRecapScreen. Overview episodes join recaps with audience-safe snippet.

## Simulations
| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | GM sees all highlights; player only public/shared | `sagatree_build_recap_highlight_lines(adv, is_gm)` on get + overview snippet | pass |
| Invalid/missing | Unauth / non-member → error; no table write from client | 42501/P0002; REVOKE client writes; SELECT membership RLS | pass |
| Two consumers / crash | Double complete idempotent; create without prior recap still hydrates project | ON CONFLICT upsert keeps summary_text; create reads projects.adventure_runtime always | pass |

## Flags
| Tag | Severity | Hops | Why local review missed it | Fix |
|-----|----------|------|----------------------------|-----|
| (none) | | | | |

## Skip reason
n/a
