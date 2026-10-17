# Feature: Saga Hub Welt-Atlas (Unified Canvas under Welt)

## Intent
Under `Welt` (default) / `Welt → Karte` the **Unified Atlas** appears. Orte/Lore live in a Side-Sheet (not a separate Orte tab). Dornhain-Sagas keep world profile + maps. Surface: **Journey**. Adaptive: **AU-CONTENT-WIDTH**, Touch ≥ 44px (`AU-TOUCH`).

## Preconditions
- Authenticated user with saga access (`/sagas/SA-…/world` or `/world/map`).
- Dornhain (`dornhain.whisper`): Migration `090` ensures `world_profile_id` + starter maps.
- Other sagas: optional world profile; empty state without.

## Happy Path
- [x] `Welt` default shows Unified Atlas (`data-saga-world-atlas` / `data-saga-world-map`) — no separate Orte tab
- [x] Button `Orte` opens Side-Sheet with Location-/Lore-Bindings + Reveal (GM)
- [x] Look-Preview stays under Einstellungen
- [x] Without world profile: DE empty state + Library › Welten link

## Edge Cases
- [x] Loading spinner „Weltkarte wird geladen…“
- [x] Overview error: German alert
- [x] Non-GM: player view on workbench
- [x] Narrow main pane: `w-full min-w-0` (AU-CONTENT-WIDTH)

## Regression
- [x] Subnav Welt (Karte / NSCs / Items / Quests / Lore) — Orte tab removed
- [x] Library world atlas and deep link `/world/map` still work

## Assumptions
- Legacy tile `SagaWorldAtlasPanel` removed; Hub uses `SagaWorldMapPanel` + Unified workbench
- Party drag stays Live-GM

## Security Coverage
- F-01 / B-01: Map via existing world services / RLS; no client-invented elevated world id
- SC-01: `worldProfileId` from server-resolved saga overview
- SC-02/SC-03/SC-06: N/A — no new API/Auth routes

## Screenshots
| Step | Filename |
|------|----------|
| 1 | `01-places-atlas-map.png` |
| 2 | `02-gm-edit-toggle.png` |
| 3 | `03-empty-no-world-profile.png` |

## Implementation Notes
- `src/app/project/SagaWorldMapPanel.tsx` — Unified Atlas + Orte Sheet
- `src/app/project/SagaResourceScreen.tsx` — world/map → MapPanel
- `src/domains/project/contracts/saga-workspace-nav.ts` — world defaults to map sub

## Composition Gate
- Verdict: CLEAR
- Proof: `.qa/runs/composition-gate-saga-world-atlas.md`
