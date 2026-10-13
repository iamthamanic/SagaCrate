# Feature: media-opt-image-engine (#630)

## Intent
Scriptony WebP-Optimierung portieren: lossless first, Qualitätsstufen, Downscale mit Mindestauflösung; `@jsquash/webp` lazy laden.

## Happy Path
- [ ] Lossless→Quality-Ladder→Downscale funktioniert mit @jsquash/webp
- [ ] Unterschreitet Output das Limit nicht: Engine liefert `over-budget` statt Fake-Erfolg
- [ ] Validierte kleine Originale bleiben `unchanged`, kein Dateiwachstum
- [ ] Pixel-, Alpha-, GIF- und MIME-Fälle sind testabgedeckt (policy + ladder)
- [ ] Touched files: zero type escape hatches (typed-strict / Boy Scout)

## Edge Cases
- [ ] Abort → `aborted`
- [ ] Item profile `allowWebpOutput: false` → no WebP emit
- [ ] GIF convert-static for portrait; map/look reject GIF

## Implementation Notes
- `encodeWebpUnderBudget` pure ladder; browser decode in `raster-decode.ts`
- Facade passes `bytes` into lazy image engine
