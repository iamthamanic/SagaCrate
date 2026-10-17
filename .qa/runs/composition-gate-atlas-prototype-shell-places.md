# Composition Gate — atlas-prototype-shell-places

## Verdict
CLEAR

## Scope
- Producer: `AtlasDefinePlacePanel` → `UnifiedAtlasEditor.handleDefinePlace`
- Consumer: `WorldAtlasWorkbench.handleCreatePlaceFromAtlas` → `worldPlaceService.upsertPlace` + `linkMap`
- Canvas stamp via `applyMapEdit(add_object)` after successful RPC (no orphan stamp on failure)

## Actors
1. GM (JWT) defines place at camera center
2. Domain presets map UI → seedKey / stamp size
3. Supabase RPC persists `world_places`; optional map link with anchor `{x,y}`

## Notes
- No HTML prototype iframe; shared `WorldAtlasWorkbench` Library/Saga unchanged
- Planet Weltkarte/Globus is label layer over existing 2D/3D toggle
