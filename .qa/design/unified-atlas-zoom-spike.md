# Design: SagaTree Unified Atlas / Multi-Scale Zoom

Status: Phase-1 technical spike, **not production renderer selection**. Date: 2026-10-16.

## Problem / intent
Der Legacy-Editor speichert pro `worldProfileId` genau eine 24–60 Kacheln große 2D-Karte. Der Nutzer will von einer Weltkarte durch **Mausrad-Zoom im selben Viewport** bis zu Stadt, Gebäude und Raum gelangen, und später alle Maßstäbe mit Texturen/Stamps wie bei Inkarnate gestalten. Ein reiner Wechsel zwischen Tabs/Editors ist kein akzeptables Endergebnis.

## Existing repository
- `src/app/world/map/WorldMapCanvas.tsx`: HTML Canvas 2D, Brush und Pins, kein einheitlicher Kamera-/LOD-Vertrag.
- `src/app/world/map/WorldMapEditorScreen.tsx`: Editor in Weltprofil und im Saga-Atlas.
- `src/app/project/SagaWorldAtlasPanel.tsx`: Saga → Welt benutzt bereits denselben Editor im GM-Modus; Players read through filtered RPC.
- `src/domains/world/map/*`: Existing tile data contract `WorldMapData`.
- `supabase/migrations/068_world_maps.sql`: one map JSONB per world profile, optimistic revision.
- No `.qa/design/product-roadmap.md` in main at inspection time.

## Options
| Option | Trade-off |
| --- | --- |
| A YAGNI: Keep current canvas and switch between unrelated raster images | Cheap but violates natural, anchored zoom and loses coordinates. **Rejected**. |
| B Existing Canvas 2D + domain camera and nested clip regions (spike) | No new dependencies, quick validation of camera invariants and LOD, integrates with existing editor. GPU/texture pipeline remains unsolved. **Selected for Phase 1 only**. |
| C One GPU renderer (PixiJS v8) + geometry overlays | Promising for stamps, mask/textures, but needs performance and edit-geometry spike before adoption. Candidate for Phase 2/3. |
| D MapLibre or Leaflet + synchronized Pixi viewport | Existing GIS tools but two camera/control stacks, harder to keep pointer coordinates and artistic painting aligned. Evaluate only if required. |

## Research
- Azgaar [.map vs GeoJSON/JSON](https://github.com/Azgaar/Fantasy-Map-Generator/wiki/Knowledge-Base): `.map` is native editable save; exports are not symmetric.
- Azgaar [architecture](https://github.com/Azgaar/Fantasy-Map-Generator/blob/master/docs/architecture/architecture.md): currently undertaking gradual modularization, not a drop-in React SDK.
- MapLibre [docs](https://maplibre.org/maplibre-gl-js/docs): map-oriented WebGL layer stack; normal geographic coordinate assumptions require assessment for fictional levels.
- Libraries are **candidates**, not dependencies installed by this spike.

## Contract / Parnas boundaries
- `src/domains/world/map/atlas-camera.ts`: hides world/screen conversions, zoom anchoring and hierarchical affine coordinate mapping. In: finite camera+anchor, out: bounded finite camera/point; NO React/Supabase.
- `src/app/world/map/WorldAtlasZoomSpike.tsx`: hides **sample rendering** / interaction only; consumes existing `WorldMapData` without altering its schema.
- `WorldMapEditorScreen.tsx`: provides opt-in control for the spike and keeps existing persistable editor unaffected.

## LOD technique
One root/world coordinate system and single camera. Detail area rect in parent coordinate system; compose child anchors to world. Focused mousewheel zoom preserves world point beneath cursor by exact camera transformation. Clip detail artwork within spatial bounds. Two independent thresholds support city and interior overlay, with interpolation; no branch of the UI mounts another editor or alters session state.

The sample city and room are explicitly marked **technical sample / non-canonical**. Future content must be explicitly authored, imported or confirmed.

## Cross-domain review
- KISS: pass – existing HTML Canvas, no new dependencies.
- SOLID/DRY: pass – pure math isolated; no duplicate map state.
- Security: pass – no writes or new endpoints; no hidden data loaded.
- UI/UX: caution – proof only; real ink brushes/assets not implemented.
- Scaling: caution – Canvas redraw approach not final.
- Testability: pass – pure geometry math unit assertions.
- Maintainability: pass – opt-in and removable as one module.

Ponytail: stops at existing Canvas (rung 4); no speculative GPU dependencies.

## Not delivered by this ticket
Azgaar integration, high-res texture painting, asset browser, rooms authoring, real map hierarchy persistence, per-saga detail overlays, scene renderer selection, arbitrary uploaded child map alignment, Steam packaging.

## Subsequent dependency chain
1. Proof camera/LOD + branch demos (**this ticket**).
2. Bench GPU renderer and choose rendering/editing stack.
3. Persist multi-map hierarchy (new normalized DB model + RLS + migration).
4. Implement real linked map LOD using stored maps, cross-scale brushes and assets.
5. Azgaar/import pipeline (native format preserved).
6. Saga-permission scoped fog/reveal and Live Session overlays.

## Exit gates
- Screen wheel zoom is cursor anchored across viewport sizes.
- Child city/room overlays follow same camera & can be exited by zoom-out.
- No persistence changes or player information exposure.
- Existing editor functionality untouched.
