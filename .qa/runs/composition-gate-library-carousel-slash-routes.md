# Composition Gate — library-carousel-slash-routes

- HEAD_SHA: a4835a752ea43637d0ab502492743e7356c572c5
- BASE_SHA: dd6f2edf (origin/main tip at branch cut)
- Date: 2026-10-13
- Verdict: CLEAR

## Event
Bibliothek tab selection and deep links resolve through History API slash paths (`pathForLibraryTab` → `/library/player-characters|npc-creatures|sagas|worlds|items|looks`). EntityBrowser carousel cards size from container-query slide basis; saga/world covers use landscape `contain` framing; character portraits stay square with face-biased crop. Legacy `?tab=` bookmarks normalize onto slash paths once.

## Hop chain
Shell / Dashboard / SagaWorkspace → `pathForLibraryTab` / `pathForView('library')` → `history.pushState|replaceState` → `resolvePathname` (`view: library`) → `Library.readLibraryTabFromLocation` (query legacy then path segment) → tab panel → `EntityBrowser` → `EntityBrowserCard` (imageAspect / objectFit). No DB write; no RLS change; identity/authorization unchanged.

## Simulations
| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | Each client navigates its own library tab URL independently | Pure path helpers + History API; no shared mutable tab store | pass |
| Invalid/missing | Unknown `/library/foo` → not-found; bare `/library` → characters; `?tab=items` → items then `/library/items` | `resolvePathname` rejects unknown segment; Library prefers query then path; replaceState canonicalizes | pass |
| Two consumers / crash | Carousel + list share EntityBrowserCard; shell remount key follows pathname | Same renderItem; App `key={pathname}` under `/library/*`; coverflow CSS unchanged for identity | pass |

## Flags
none

## Skip reason
n/a
