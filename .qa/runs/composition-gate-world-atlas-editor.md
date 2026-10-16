# Composition Gate — world-atlas-editor

- HEAD_SHA: WORKTREE
- BASE_SHA: b73e1544dfe9f7def986abd0348005acc343750e
- Date: 2026-10-16
- Verdict: CLEAR

## Event

GM opens World Atlas from Library (`/library/worlds/WO-…/map`) or Saga (`/sagas/SA-…/world/map`), edits GeoJSON layers / legacy tiles, saves; optional Azgaar `.map` upload to Storage.

## Hop chain

1. Route → `WorldAtlasScreen` / `SagaWorldMapPanel` resolves `worldProfileId` (public id or saga overview RPC).
2. `worldAtlasService.ensureRoot/listMaps/getMap` → SECURITY DEFINER RPCs on `world_atlas_maps` (RLS via world profile helpers).
3. `WorldAtlasWorkbench` + Leaflet/Geoman mutate FeatureCollection in memory → `upsert_world_atlas_map` with revision.
4. Legacy root `kind=legacy_tiles` → existing `WorldMapEditorScreen` / `world_maps` RPCs (no dual write of tile JSON into atlas layers).
5. Azgaar `.map` → Storage `world-atlas` under `auth.uid()` folder → path stored on map row (`generator_meta.engine=azgaar`).

Cardinality: one upsert per explicit Save; one Storage object per import; no fan-out to other sagas.

## Simulations

| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | Two GMs editing same map | Revision check fail-closed on stale upsert | pass |
| Invalid/missing | Missing world / bad GeoJSON / oversized layers | Empty state or RPC reject; no invented world UUID | pass |
| Two consumers / crash | Library + Saga share same `world_atlas_maps` rows; discovery not yet dual-written | Same workbench; player_view strips secret features server-side | pass |

## Flags

| Tag | Severity | Hops | Why local review missed it | Fix |
|-----|----------|------|----------------------------|-----|
| (none) | | | | |

## Notes

Azgaar iframe self-host deferred (Phase 4); native `.map` storage ships. Saga discovery overlays beyond player_view filter remain follow-up.
