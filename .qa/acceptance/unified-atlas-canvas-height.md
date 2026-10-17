# Feature: Unified Atlas canvas height containment

## Intent
Map viewport stays viewport-bounded in the Saga hub scroll shell. Canvas must not expand page scroll via ResizeObserver feedback.

## Happy Path
- [ ] `[data-unified-atlas-viewport]` CSS height ≤ `min(70dvh, 36rem)` (plus border)
- [ ] Canvas is out of document flow (`absolute`); does not grow parent height
- [ ] Tool chrome scrolls inside its column; does not stretch the map row
- [ ] Map still pans/zooms and draws Eldoria demo

## Edge Cases
- [ ] Narrow main pane: width follows container; height still capped
- [ ] Library full-page atlas: same cap (readable workstation, no runaway)

## Composition Gate
- Verdict: SKIPPED
- Reason: pure layout / ResizeObserver containment; no producer→consumer fan-out
- Proof: `.qa/runs/composition-gate-unified-atlas-canvas-height.md`
