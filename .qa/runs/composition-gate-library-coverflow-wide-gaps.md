# Composition Gate — library-coverflow-wide-gaps

- HEAD_SHA: cf58cc635e7677145ee60c49577f78408e995bb2
- BASE_SHA: cf58cc635e7677145ee60c49577f78408e995bb2
- Date: 2026-10-13
- Verdict: CLEAR

## Event
Library coverflow slide changes selection; each slide gets a signed circular distance (`--cf-delta`) used by CSS to tuck it linearly toward the center.

## Hop chain
Embla select → `useCenterFocusCarousel.current` → `getItemStyle(index)` → inline CSS var on `CarouselItem` → scoped CSS `calc(var(--cf-delta) * -40%)` on card.

## Simulations
| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | Every slide positioned independently by its own delta | Pure function per index; no shared state | pass |
| Invalid/missing | No `--cf-delta` → no tuck, no layout break | CSS var fallback `0` | pass |
| Two consumers / crash | Focus-mode pickers unaffected; EntityBrowser only coverflow user | Only coverflow CSS reads the var; focus CSS unchanged | pass |

## Flags
none

## Skip reason
n/a
