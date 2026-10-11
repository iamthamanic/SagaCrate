# Composition Gate — saga-definitions-versions

- HEAD_SHA: WORKTREE
- BASE_SHA: 43d94a77ff01d9983cf82348366e4218a93f8726
- Date: 2026-10-11
- Verdict: CLEAR

## Event
Client opens library/overview or Dornhain panel; story definitions/versions are loaded with audience projection; new group runs pin the same published version.

## Hop chain
Library / GoldenAdventureDornhainPanel / useSagaOverview → project summaries join saga_definitions metadata OR RPC get_native_saga_definition_by_slug / get_saga_overview → sagadrive_project_saga_definition_payload → UI. create_project_from_saga_version writes new projects row pinned to version.

## Simulations
| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | Non-GM never sees gm_only fact summaries | RPC projects knowledgeFacts; client package redacted | pass |
| Invalid/missing | Unknown slug / non-member → error | P0002 / 42501 | pass |
| Two consumers / crash | Two groups same version_id independent adventure_runtime | create_project_from_saga_version clones pin, separate project rows | pass |

## Flags
| Tag | Severity | Hops | Why local review missed it | Fix |
|-----|----------|------|----------------------------|-----|
| (none) | | | | |

## Skip reason
n/a
