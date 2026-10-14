# Acceptance — library-coverflow-wide-gaps

## Intent
Library coverflow keeps equal card spacing on wide screens (3+ visible neighbors per side). Previously only ±2 slides were tucked; slides beyond jumped back to un-tucked position and left large gaps.

## Adaptive UI
- Surface: Workstation (Library browse). Gate AU-CONTENT-WIDTH: spacing is relative to card width, independent of viewport/main-pane width.

## Scope
### In
- `src/shared/carousel/centerFocusCarousel.styles.ts` (linear tuck via `--cf-delta`)
- `src/shared/carousel/centerFocusSlideRole.ts` (`resolveCenterFocusSlideDelta`)
- `useCenterFocusCarousel` (`getItemStyle`), `EntityBrowser` (applies style)

### Out
- Embla options, slide basis, focus-mode pickers (no tuck)

## Happy Path
- [x] At 2200px viewport, slide midpoints are spaced equally (110px) for all distances from center (measured in browser)
- [x] Center card unchanged (scale 1, glow); neighbors keep blur/opacity roles
- [x] Typecheck passes

## Edge Cases
- [x] Loop wrap: delta uses signed circular distance
- [x] Single/short lists: delta 0 / small values, no NaN
- [x] Missing `--cf-delta` falls back to 0 (no tuck)

## Composition Gate
- Proof: `.qa/runs/composition-gate-library-coverflow-wide-gaps.md`
