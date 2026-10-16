# Design / Spike — World Atlas Editor (#702)

Ready for /implement: YES (phased)

## Phase 1 findings

### Licenses

| Component | License | Use in SagaTree |
|-----------|---------|-----------------|
| Leaflet | BSD-2-Clause | OK — interactive viewer |
| `@geoman-io/leaflet-geoman-free` | MIT | OK — draw/edit free tier only |
| Azgaar Fantasy-Map-Generator | MIT (LICENSE file) | OK — self-host / file I/O; GitHub API shows `NOASSERTION` but repo LICENSE is MIT |
| Mapgen4 / SettleMaker | deferred | Do not block |

### Azgaar integration (real constraints)

Azgaar is a **full SPA**, not an embeddable React SDK. No official npm map-engine package.

Viable approaches (tested against public docs/wiki, not invented APIs):

1. **Self-host FMG** under SagaTree infra + iframe; exchange via download/upload of `.map` (native project format). JSON/SVG exports are **not** full round-trip project restores.
2. **File round-trip only:** SagaTree stores `.map` in Storage; user opens FMG (hosted or desktop), edits, re-imports `.map`.
3. **No postMessage API** documented as stable — do not invent one.

**Decision for Phase 4:** Prefer (1) later; ship (2) in foundation (`generator_meta` + Storage path). Never claim “Azgaar React SDK”.

### Leaflet / React

- App uses React 18.3 → `leaflet` + `react-leaflet` v4 + `@geoman-io/leaflet-geoman-free`.
- Fantasy maps: `L.CRS.Simple`, image/SVG overlays, GeoJSON layers.

### Data model

Keep `world_maps` (tile JSONB) as **legacy root**. New `world_atlas_maps`:

- Many maps per `world_profile_id`
- `parent_map_id` hierarchy
- `kind`: `world | region | settlement | scene | legacy_tiles`
- `layers` GeoJSON FeatureCollection (size-capped)
- `basemap_storage_path` / `azgaar_map_storage_path` (Storage, not Base64)
- `revision` optimistic concurrency

Migration: one `legacy_tiles` root per existing `world_maps` row.

### Dual navigation

| Entry | Path |
|-------|------|
| Library | `/library/worlds/:worldPublicId/map` |
| Saga | `/sagas/:sagaPublicId/world/map` |

Shared UI: `src/app/world/atlas/WorldAtlasWorkbench.tsx`.

### World vs Saga state

| World (canonical) | Saga-scoped |
|-------------------|-------------|
| Geography, layers, hierarchy, basemap, Azgaar blob | Discovery, secrets overlay, party position (existing), reveal |

Saga must not write another saga’s discovery; world geometry writes require world-edit permission.

## Out of scope (this epic’s later phases)

- Full Azgaar iframe product chrome
- SettleMaker city gen
- Automatic zoom-to-region navigation (explicit map switch only)
