# Composition Gate — library-coverflow-wide-gaps

- HEAD_SHA: 852b8df7dd2c8fab383d0ccd5cee894857c63e1b
- BASE_SHA: fa9a4dc6c2b5b7418b8493ec188bdccebddeec16
- Date: 2026-10-14
- Verdict: CLEAR

## Event
Library coverflow browse → Embla slide index →  style → CSS linear tuck () keeps equal neighbor gaps on wide viewports.

## Hop chain
React EntityBrowser → useCenterFocusCarousel.getItemStyle → resolveCenterFocusSlideDelta → CSS custom property → transform on card.

## Simulations
| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | Many visible neighbors keep equal mid-to-mid spacing | Linear tuck for every distance including is-far | pass |
| Invalid/missing | Missing  falls back to 0 |  | pass |
| Two consumers / crash | Pair (length===2) still one-sided neighbor; loop circular delta | length===2 early-return kept; delta helper shared | pass |

## Flags
none

## Skip reason
n/a
