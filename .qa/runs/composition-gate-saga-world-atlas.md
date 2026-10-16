# Composition Gate — saga-world-atlas

- HEAD_SHA: a5cdd4277a4d9fffc80816ea5ee377cdc7d2fcf4
- Date: 2026-10-16
- Verdict: CLEAR

## Event
Saga Hub opens `Welt → Orte / Karten` (map-only) and resolves the interactive world map; Orte/Lore open in a Sheet drawer.

## Hop chain
1. **Producer:** `useSagaOverview` → `worldProfileId` + `isGm` + `partyLocationRef`.
2. **Consumer A (view):** `WorldMapPlayerView` (`hideSidebar`) → `worldMapService.getMap`.
3. **Consumer B (GM edit/expand):** `WorldMapEditorScreen` (`embedded`) → `saveMap` / size+4.
4. **Drawer (lazy):** Sheet open → `listBindings(location|lore)` + reveal controls (same permission RPCs as former catalog panel).

Dornhain seed (`090`) is a one-shot DB producer of `world_profile_id` + starter `world_maps` — not a runtime fan-out.

## Simulations

### N-actors
Each viewer loads overview once per session refresh and map once per `worldProfileId`. No fan-out side-effect (email/webhook). Cardinality: **once per client view load**, not once per ensemble member. **PASS**

### Invalid / missing
Missing `worldProfileId` → empty state (`data-saga-world-atlas-empty`); no client-invented UUID; no map save path. Overview error without model → DE error alert; does not mount map with a fallback foreign id. **PASS (fail-closed)**

### Concurrent consumers / crash
View vs edit is a local `editMode` toggle; both modes use the **same** overview `worldProfileId`. Save remains on existing map service revision path (not duplicated). Party move not enabled in hub (`canMoveParty={false}`) so hub does not race Live GM party updates. **PASS**

## Findings
None.

## Notes
- Scriptony full world dossier / pin↔location tree linking deferred (acceptance Out of Scope / Assumptions).
- Gate scripts `look-library-check` / `world-look-preview-check` updated to match Hub IA tab registries (pre-existing brittle literals).
