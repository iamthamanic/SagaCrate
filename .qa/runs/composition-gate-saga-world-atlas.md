# Composition Gate — saga-world-atlas

- HEAD_SHA: 49e4f8e910df6402bbd491bf251cf0ae7f06540a
- BASE_SHA: a719d716967837c588170b253592622734499a7e
- Date: 2026-10-16
- Verdict: CLEAR

## Event

Saga Hub opens `Welt → Orte / Karten` (map-only) and resolves the interactive world map; Orte/Lore open in a Sheet drawer. Dornhain seed + overview `worldProfileId` + RLS recursion fix ship in the same PR tip.

## Hop chain

1. **Producer:** `useSagaOverview` → `get_saga_overview` (`worldProfileId`, `isGm`, `partyLocationRef`); helpers use `sagatree_*` (`091`/`093`).
2. **Consumer A (view):** `WorldMapPlayerView` (`hideSidebar`) → `worldMapService.getMap`.
3. **Consumer B (GM edit/expand):** `WorldMapEditorScreen` (`embedded`) → `saveMap` / size+4.
4. **Drawer (lazy):** Sheet open → `listBindings(location|lore)` + reveal controls (same permission RPCs as former catalog panel).
5. **Library list (RLS):** `projects` / `project_members` SELECT via DEFINER helpers (`092`) — no cross-table RLS recursion.

Dornhain seed (`090`) is a one-shot DB producer of `world_profile_id` + starter `world_maps` — not a runtime fan-out.

## Simulations

| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | Each viewer loads overview once per refresh and map once per `worldProfileId` | No email/webhook fan-out; cardinality once per client view load | pass |
| Invalid/missing | Missing `worldProfileId` → empty state; no invented UUID | `data-saga-world-atlas-empty`; fail-closed overview error | pass |
| Two consumers / crash | View vs edit share same overview `worldProfileId`; hub does not race Live party moves | Local `editMode` toggle; `canMoveParty={false}` in hub | pass |

## Flags

| Tag | Severity | Hops | Why local review missed it | Fix |
|-----|----------|------|----------------------------|-----|
| (none) | | | | |

## Notes

- Scriptony full world dossier / pin↔location tree linking deferred (acceptance Out of Scope).
- Licensing follow-up for `public/assets/session/gm-earthspirit.jpg` is inventory-only (no hop change).
