# Composition Gate — saga-editor-v1

- HEAD_SHA: WORKTREE
- BASE_SHA: 598ffb9757370d9e734f5c58eecfbdf62c3416d0
- Date: 2026-10-11
- Verdict: CLEAR

## Event
Author opens Saga Editor for a story definition; draft loads; autosave and publish create a new published version without moving pinned projects.

## Hop chain
Library /story-definitions → SagaEditorScreen → useSagaDefinitionEditor → sagaDefinitionService → SECURITY DEFINER RPCs (get/save/publish/copy/create) → saga_definitions.draft_revision + saga_definition_versions draft/published rows → UI ack / publish confirmation. Pinned projects keep saga_version_id.

## Simulations
| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | Only owner edits; native immutable | get/save/publish check owner; native raises 42501 | pass |
| Invalid/missing | Empty title / bad revision | validation + 22023 / 40001 resync | pass |
| Two consumers / crash | Draft edit does not move pinned runs | publish inserts new published version; projects.saga_version_id unchanged | pass |

## Flags
| Tag | Severity | Hops | Why local review missed it | Fix |
|-----|----------|------|----------------------------|-----|
| (none) | | | | |

## Skip reason
n/a
