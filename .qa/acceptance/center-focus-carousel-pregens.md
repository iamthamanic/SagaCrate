# Acceptance — center-focus-carousel-pregens

## Intent
Shared Embla center-focus carousel kit (21st/shadcn motion) for Library EntityBrowser and character pickers: cover-flow/focus visuals, soft blue-gold center glow (no scale pulse), Dornhain pregen portraits (Kael tattoos/Teufelsauge, Brenna warhammer), race labels Zwergin/Elfin/Ork.

## Scope
### In
- `src/shared/carousel/**`
- Library EntityBrowser / EntityBrowserCard / Library portrait wiring
- Character creation/progression carousels + shared re-exports
- `sagadrive-native-pregen-portraits.ts` + `public/assets/marketplace/dornhain/**`
- Fixture/golden starter weapon Brenna → warhammer
- Species sketch / migration 078 race updates (when present)

### Out
- Unrelated LiveAct QA evidence / world-editor full-screen / auth-session-owner-resolve (separate tickets)
- Embla package upgrades

## Preconditions
- [x] App builds (Vite)
- [x] User can open Bibliothek Charaktere carousel view

## Happy Path
- [x] Library character carousel uses shared hook CSS (`carouselCss`) with center slide `is-center`
- [x] Center card shows subtle blue-gold inset glow pulse (not clipped by Embla overflow)
- [x] Side slides are more faded/blurred than center (coverflow)
- [x] Creation carousels (Species/Essence/Archetype/Background/Attribute) inject same kit CSS via `useCarouselScrollSync`
- [x] Kael/Brenna/Liora/Oskar resolve native pregen portrait URLs by name or `nativeAssetId`
- [x] Brenna starter item is `builtin.fantasy.warhammer` (fixture + Dornhain equippable)

## Edge Cases
- [x] `prefers-reduced-motion: reduce` disables pulse animation (static soft glow remains)
- [x] Empty item list shows emptyState (EntityBrowser)
- [x] List view mode does not require carousel centering
- [x] Hex `--primary` tokens work via `color-mix` (no invalid `hsl(var(--primary))`)

## Composition Gate
- Verdict: CLEAR (WORKTREE 2026-10-12)
- Proof: `.qa/runs/composition-gate-center-focus-carousel-pregens.md`
