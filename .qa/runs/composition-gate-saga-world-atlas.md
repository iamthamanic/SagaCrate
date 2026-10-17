# Composition Gate — saga-world-atlas

- HEAD_SHA: WORKTREE (Welt default = Unified Atlas; Orte tab removed)
- Date: 2026-10-17
- Verdict: CLEAR

## Event

Saga Hub `Welt` (`/world`) and `/world/map` open Unified Atlas via `SagaWorldMapPanel` → `WorldAtlasWorkbench`. Orte/Lore open in a Sheet drawer (no Orte subtab).

## Hop chain

1. **Producer:** `useSagaOverview` → `get_saga_overview` (`worldProfileId`, `isGm`).
2. **Consumer (atlas):** `WorldAtlasWorkbench` / `UnifiedAtlasEditor` → world atlas service (maps + `generator_meta.unifiedCanvas`).
3. **Drawer (lazy):** Sheet open → `listBindings(location|lore)` + reveal controls.
4. **Nav:** `resolveSagaWorldSub('world'|'map')` → `map`; `pathSectionForWorldSub('map')` → `world`.

## Simulations

| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | One overview + atlas load per view | No fan-out | pass |
| Invalid/missing | Missing `worldProfileId` → empty state | `data-saga-world-atlas-empty` | pass |
| Orte tab | Removed from subnav; Sheet only | `SagaWorldSubNav` has no `places` | pass |

## Flags

| Tag | Severity | Hops | Why local review missed it | Fix |
|-----|----------|------|----------------------------|-----|
| (none) | | | | |

## Notes

- Legacy `SagaWorldAtlasPanel` (tile hub) deleted; Library atlas route unchanged.
