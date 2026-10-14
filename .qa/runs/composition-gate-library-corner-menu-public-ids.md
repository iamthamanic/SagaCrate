# Composition Gate — library-corner-menu-public-ids

- HEAD_SHA: 72f610029683a4c28b240668d3779cc1be9d3753
- BASE_SHA: f165fb8182244f35be9e83de38d31b5a6fd780a0
- Date: 2026-10-14
- Verdict: CLEAR

## Event
Library entity actions (copy public id, duplicate/fork personal, archive/delete, NPC spawn/promotion) open from a shared Embla-safe ⋮ portal; view mode (list/grid/carousel) is shared per tab via localStorage; Core/native rows expose stable public ids for copy without inventing elevated ownership.

## Hop chain
Library card ⋮ trigger (`EntityBrowserCornerMenuTrigger`) → parent-owned portal (`EntityBrowserCornerMenuPortal` / `useLibraryCornerMenu`) → infrastructure facade (`forkDefinition` / `duplicateNpcCreatureDefinition` / `duplicateCharacter` / `duplicatePlaythrough` / look duplicate) → DB insert with owner scope + `ensure_public_id` trigger (persisted) or `deriveStablePublicResourceId` (Core/builtin display only) → Library refresh → toast with optional public id. View mode: `useLibraryViewMode` → `EntityBrowser` layout switch (no network).

## Simulations
| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | Each user duplicates only own-visible catalog into personal scope; public id is identifier not auth | RLS + service owner checks; Core fork writes personal row for caller | pass |
| Invalid/missing | Missing public id disables copy; Core without DB id uses derived IT-/NPCC- for label/copy only | Menu item disabled when empty; deriveStablePublicResourceId only stamps scope=core display defs | pass |
| Two consumers / crash | Menu survives Embla remount; scroll keeps portal anchored or closes when trigger off-screen | Portal re-queries trigger on scroll/resize; busyKey on menuKey | pass |

## Flags
none

## Skip reason
n/a
