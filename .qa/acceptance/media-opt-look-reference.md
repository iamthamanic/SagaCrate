# Feature: media-opt-look-reference (#639)

## Intent
Look-Referenzen vor Base64-Analyse mit look-reference Optimizer und 12 MiB Gesamtbudget optimieren.

## Happy Path
- [ ] Sofortvorschau (Object URL) vor Encode/Base64
- [ ] `look-reference` profile + aggregate 12 MiB enforced (client + analysis service)
- [ ] Failed optimize keeps prior references
- [ ] Touched files: zero type escape hatches
