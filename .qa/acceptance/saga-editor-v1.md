# Feature: Saga-Editor v1 – Klappentext, Orte, Geheimnisse, Pregens

## Intent
Ermögliche Autoren, eigene Sagas zu erstellen/bearbeiten (Klappentext, Orte, Geheimnisse, Pregens) und eine unveränderliche Fassung zu veröffentlichen. Native Sagas sind read-only; Anpassung nur über Kopie.

## Happy Path
- [x] Author can create/edit/publish via `/story-definitions/*` + RPCs (064).
- [x] Native copy flow (`copy_native_saga_definition` + CTA).
- [x] Pinned runs unchanged after draft edit (publish inserts new version only).
- [x] AU-Gates: `data-au-surface="journey"`, min-h-11, safe-area.
- [x] Hook `useSagaDefinitionEditor` matches issue API (dirty, revision, debounce 800ms).
- [x] Checks + test-gate (`saga-editor-v1-check.mjs`).
- [x] Touched files: zero type escape hatches.

## Edge Cases
- [x] Empty title → validation / Publish disabled
- [x] Revision conflict → resync message
- [x] beforeunload when dirty
- [x] Native: no dead edit fields; copy CTA only

## Regression
- [x] #574 read path + Dornhain redaction checks still pass

## Assumptions
- Migration 064 applied on target Supabase for runtime save/publish.

## Screenshots
| Step | Filename |
|------|----------|
| 1 | `01-happy-path.png` |

## Implementation Notes
- Domain: `blurb` + `pregens` on payload; synopsis synced from blurb on save.
- Infra: get/save/publish/copy/create RPCs on `saga-definition-service`.
- UI sections: Allgemein → Orte → Geheimnisse → Pregens.
- Library: „Geschichte bearbeiten/ansehen“ for GM + „Geschichte schreiben“.
