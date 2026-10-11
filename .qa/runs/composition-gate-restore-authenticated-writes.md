# Composition Gate — restore-authenticated-writes
- HEAD_SHA: 550a30b962528b04d89956e64582ff65e1d71822
- BASE_SHA: 592d52aeedbf4cf287b8ba4382cc0fa221e97139
- Date: 2026-10-11
- Verdict: CLEAR

## Event
Authenticated client creates/updates project/session via PostgREST; RETURNING uses safe columns; secrets never selectable; service_role unchanged.

## Hop chain
project-service.createProject → PostgREST INSERT projects → RLS → RETURNING PROJECT_SAFE_COLUMNS; secrets blocked by column privileges (059/071).

## Simulations
| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | Player cannot SELECT secrets; GM write via RLS | column REVOKE + RLS | pass |
| Invalid/missing | bare select(*) / adventure_runtime select denied | privilege 42501 | pass |
| Two consumers / crash | Idempotent grants; service_role full access | GRANT ALL service_role | pass |

## Flags
| Tag | Severity | Hops | Why | Fix |
|-----|----------|------|-----|-----|
| (none) | | | | |
