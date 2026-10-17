# Composition Gate: Unified Atlas pin / LOD / globe

## Scope
Phase-2 atlas authoring: place pin + marquee, DB place LOD nav, planet globe presentation.

## Verdict
CLEAR (WORKTREE)

## Proof
- Domain: `buildAtlasPlaceNav` + `resolveAtlasLodFromPlaces` (`src/domains/world/places/atlas-place-nav.ts`)
- Self-test: `scripts/atlas-place-nav.self-test.mjs` wired in `checkWorldAtlasEditor` (`test-gate.mjs`)
- UI: `AtlasDefinePlacePanel` pin/marquee; `UnifiedAtlasEditor` uses pin coords; `placeNav` from Workbench
- Globus: `AtlasSpatialViewport` `globeMode` when level is WELT
- Acceptance: `.qa/acceptance/unified-atlas-2d-3d-editor.md` updated

## Skip reason
n/a
