# Feature: media-opt-contracts (#625)

## Intent
Pure, streng typisierte Verträge für MediaKind, AssetProfile, Größe, Qualität und differenzierte Optimize-Ergebnisse unter `src/domains/media/` — ohne React, Browser-APIs oder Supabase.

## Preconditions
- Epic #624 Designkern ist bekannt; Milestone `media-optimizer-v1` aktiv.
- Keine Infrastructure-Engines in diesem Slice.

## Happy Path
- [ ] Types und Ergebnisunion für image/video/model3d/audio plus optimized/unchanged/unsupported/over-budget/aborted/failed
- [ ] Portrait-, Map-, Look- und Item-Profile spiegeln aktuell unterstützte Formate und Limitierungen (`targetBytes` ≠ `maxUploadBytes`; Look 12 MiB Aggregat; Item ohne WebP-Output)
- [ ] Unit-/Domain-Check deckt Ergebnisinvarianten und Limits ab (`scripts/media-optimizer-contracts-check.mjs` via test-gate)
- [ ] Domain-Code enthält keine React-, Browser- oder Supabase-Abhängigkeiten
- [ ] Touched files: zero type escape hatches (typed-strict / Boy Scout)

## Edge Cases
- [ ] `unchanged` nur bei validem Original (MIME/Größe echo)
- [ ] GIF bei Map/Look/Item abgelehnt; Portrait erlaubt mit convert-static Policy
- [ ] Look: >10 Bilder oder >12 MiB Aggregat → Policy fail
- [ ] Alpha-Preserve-Flag bleibt profilgebunden (keine stille Flatten-Erlaubnis)

## Security Coverage
- F-03 / B-01 (uploads): Client MIME/size claims untrusted — documented; server gates unchanged (out of scope this slice).
- Secrets: none introduced.
- Non-applicable: B-04/B-07/B-08/B-09/P-04 — no new endpoints/auth.

## Regression
- [ ] Existing domain barrels / architecture-boundary-check still pass
- [ ] Item/Look MIME constants elsewhere unchanged in this PR

## Assumptions
- Item WebP stays disabled until later coordinated migration issue.

## Screenshots
N/A (domain-only)

## Implementation Notes
- Added `src/domains/media/optimization-contract.ts`, `optimization-policy.ts`, barrel `index.ts`.
- Design artifact: `.qa/design/universal-media-optimizer.md`.
- Domain check wired: `scripts/media-optimizer-contracts-check.mjs` → `test-gate`.
