# Composition Gate — center-focus-carousel-pregens

- HEAD_SHA: 18ed48cec625c6cd485e682323985f6de1ecccb3
- BASE_SHA: 0a05fb2b6a1a41065d44be486a6dacaa12c31d90
- Date: 2026-10-13
- Verdict: CLEAR

## Event
Bibliothek EntityBrowser uses shared center-focus Embla coverflow; Dornhain native characters/sagas/worlds resolve public cover/portrait URLs once per card render. Local Admin login uses `@sagatree.local` GoTrue JWT (migration 080).

## Hop chain
Library `renderItem` → `sagatreeNative*` cover/portrait resolvers → static `/assets/marketplace/dornhain/*` (Vite public) → `EntityBrowserCard` img. Auth: shortcut → `signInWithPassword(admin@sagatree.local)` → JWT `authenticated` → PostgREST → RLS.

## Simulations
| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | Each library card resolves its own image URL independently | Pure functions by name/slug/modules; no shared mutable cache | pass |
| Invalid/missing | Unknown name/slug → initials fallback; anon still 42501 | resolvers return null; EntityBrowserCard shows imageFallback; grants unchanged for anon | pass |
| Two consumers / crash | Carousel + list share same renderItem; re-apply 080 idempotent | EntityBrowser variants only change layout; same imageUrl props; email UPDATE by seed id | pass |

## Flags
none

## Skip reason
n/a
