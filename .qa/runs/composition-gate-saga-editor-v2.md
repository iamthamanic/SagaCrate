# Composition Gate — saga-editor-v2
- HEAD_SHA: eb8d8ddd9bb17baad11c77e62d5e6d8cf8a7b280
- BASE_SHA: 39a90a6655ae652e2cccc01fb25e3b9ec04df73b
- Date: 2026-10-11
- Verdict: CLEAR

## Event
Author edits simulation templates in Saga Editor; saveDraft persists JSONB payload.simulation; publish copies version.

## Hop chain
SagaEditorScreen sections → useSagaDefinitionEditor.setField(simulation) → draftToPayload → save_saga_definition_draft → saga_definition_versions.payload; kernel still resolves fixtures/dornhain via resolve-definition.

## Simulations
| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | Author-only writes | existing canEdit / RPCs | pass |
| Invalid/missing | Bad rule threat id | validateSagaDefinitionDraft | pass |
| Two consumers / crash | Autosave cloneDraft | deep-copy simulation | pass |

## Flags
| Tag | Severity | Hops | Why | Fix |
|-----|----------|------|-----|-----|
| (none) | | | | |
