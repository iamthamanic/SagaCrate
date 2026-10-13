# Composition Gate — center-focus-carousel-pregens

- HEAD_SHA: (pending commit on feat/library-coverflow-pregens)
- Date: 2026-10-13
- Verdict: CLEAR

## Event
Bibliothek EntityBrowser uses shared center-focus Embla coverflow; Dornhain native characters/sagas/worlds resolve public cover/portrait URLs once per card render.

## Hop chain
Library renderItem → sagatreeNative* cover/portrait resolvers → static `/assets/marketplace/dornhain/*` (Vite public) → EntityBrowserCard img. Auth email path (080) remains separate: GoTrue JWT → PostgREST.

## Simulations
| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | Each library card resolves its own image URL independently | Pure functions by name/slug/modules; no shared mutable cache | pass |
| Invalid/missing | Unknown name/slug → initials fallback | resolvers return null; EntityBrowserCard shows imageFallback | pass |
| Two consumers / crash | Carousel + list share same renderItem | EntityBrowser variants only change layout; same imageUrl props | pass |

## Flags
none

## Skip reason
n/a
