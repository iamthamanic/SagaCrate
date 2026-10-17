# Composition Gate — world-atlas-editor

- HEAD_SHA: e6e645bae8f47431a39d52f0f6488a2c67203c17
- BASE_SHA: b73e1544dfe9f7def986abd0348005acc343750e
- Date: 2026-10-17
- Verdict: CLEAR

## Event

GM opens World Atlas from Library (`/library/worlds/WO-…/map`) or Saga (`/sagas/SA-…/world/map`), edits Unified Canvas (strokes/objects/rooms/walls) or legacy tiles, saves; optional Azgaar `.map` upload to Storage.

## Hop chain

1. Route → `WorldAtlasScreen` / `SagaWorldMapPanel` resolves `worldProfileId` (public id or saga overview RPC).
2. `worldAtlasService.ensureRoot/listMaps` → SECURITY DEFINER RPCs; editor ensures a `kind=world` root for Unified Canvas when missing.
3. `getMap` → load `generator_meta.unifiedCanvas` → `UnifiedAtlasEditor` mutates doc in memory.
4. Save → `mergeUnifiedCanvasIntoGeneratorMeta` + size assert → `upsert_world_atlas_map` with revision (layers stay GeoJSON FeatureCollection).
5. Legacy root `kind=legacy_tiles` → existing `WorldMapEditorScreen` / `world_maps` RPCs.
6. Azgaar `.map` → Storage `world-atlas` under `auth.uid()` folder → path on map row.

Cardinality: one upsert per explicit Save; one Storage object per import; no fan-out to other sagas.

## Simulations

| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | Two GMs editing same map | Revision check fail-closed on stale upsert | pass |
| Invalid/missing | Missing world / oversized canvas JSON | Empty state or client/RPC reject; no invented world UUID | pass |
| Two consumers / crash | Library + Saga share same `world_atlas_maps` rows | Same workbench; canvas meta shared | pass |

## Flags

| Tag | Severity | Hops | Why local review missed it | Fix |
|-----|----------|------|----------------------------|-----|
| (none) | | | | |

## Notes

Unified Canvas is default UI; Leaflet demoted. Demo Eldoria art is client-generated sample (IV spatial aid). PixiJS / real nested map LOD deferred.
