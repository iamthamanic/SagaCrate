# Composition Gate — donalu-world-workspace

- **HEAD_SHA:** `c6341e9c230f2ba9d9d86038d469751645a39ecb`
- **Date (UTC):** 2026-10-17T11:10:00Z
- **Verdict:** CLEAR

## Scope verified

| Package | Evidence |
|---------|----------|
| P0 JWT gate | `donalu-p0-auth-gate-check` OK; place/atlas/profile adapters assert JWT; no service_role |
| P1 Donalu rename | DB: `WO-9FFK6.name = Donalu` |
| P2 places schema | Migration `095` + `096`; 6 places; map links; saga `world_place_id` ×5 |
| P3 Places UX | `WorldPlacesPanel` in workbench; IV placeholder + Detailkarte anlegen; `sagaPublicId` from Saga map |
| P4 saga overlay | Catalog shows `worldPlaceId`; bindings linked via seed_key |
| P5 dungeon | `buildDungeonGeneratorMeta` + `manualDirty` + UI reforge confirm; meta merges on save |
| P6 player projection | `list_world_places(..., p_player_view, p_saga_public_id)` party filter |
| Checks | `donalu-world-places-check`, `world-atlas-editor-check`, `unified-atlas-dungeon-check`, `npm run typecheck` OK |

## Child maps (WO-9FFK6)

- Weltkarte (Unified) / Dornhain (Stadt) / Taverne Innenraum / Krypta Dungeon (+ legacy tiles)

## Notes

- Demo Eldoria LOD labels marked non-canonical in UI (`Demo-*`).
- Apply `096_donalu_place_map_link_rpc.sql` on environments that already have `095`.
