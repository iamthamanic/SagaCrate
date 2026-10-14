# Acceptance — dornhain-pregen-full-sheets

## Intent
Dornhain native pregens (Brenna, Kael, Liora, Oskar) must exist as **full SagaTree Core character sheets**: Spezies, Archetyp, Essenz, Speziesmerkmale (Budget 3), Background/Skills und Attribute so, dass Character Editor und Session dieselben vorausgewählten Werte zeigen.

## Surface class
Journey (Character Editor load) + Library meta; seed/provision path

## Adaptive bands in scope
N/A — data/provisioning; no new layout recomposition

## Preconditions
- [ ] Migration `082_dornhain_pregen_full_sheets.sql` applied (or local `provision_dornhain_starter_for_user` re-run)
- [ ] Account has Dornhain starter characters

## Happy Path
- [ ] Opening Brenna Sturmfaust selects Spezies `dwarf`, Archetyp `fighter`, Essenz `physical`, Traits Budget = 3
- [ ] Opening Kael / Liora / Oskar selects their race + archetype + essence + complete skill provenance
- [ ] `sheet_status = complete` remains; Session join still allowed
- [ ] Re-save from Character Editor does not fail Core persistence asserts
- [ ] Library meta shows German race labels (Zwerg / Elf / Ork / Mensch), not raw EN keys

## Edge Cases
- [ ] Existing seeded rows with `race = Mensch` and empty profile are backfilled idempotently
- [ ] Rows the user already customized (non-starter sagatree_profile with archetype) are not overwritten
- [ ] Kael attributes corrected to legal Core start array `[4,3,3,2,2,1]` permutation

## Security Coverage
- Owner-scoped characters only; seed remains SECURITY DEFINER service path — no client elevation of foreign sheets
- N/A launch SC-01…07 — not a launch ticket

## Assumptions
- Race keys persisted as EN carousel values (`dwarf` / `elf` / `orc` / `human`)
- Class display labels stay German (`Kämpferin` …)

## Deviations (§9)
- none

## Implementation Notes
- Domain SoT: `src/domains/character/use-cases/dornhain-pregen-sheets.ts` (Brenna→dwarf/fighter/berserker, Kael→orc/rebel/assassin with legal attrs, Liora→elf/thinker/mage, Oskar→human/diplomat/mentalist).
- Migration `082_dornhain_pregen_full_sheets.sql` rewrites seed + one-shot backfill via `nativeStarterSheetVersion`.
- Editor hydrate + Library labels use `normalizeSagaTreeRaceKey`.
- Kael attrs corrected to Core start array (was illegal `[4,4,2,2,2,2]`).

## Composition Gate
- Verdict: CLEAR
- Proof: `.qa/runs/composition-gate-dornhain-pregen-full-sheets.md`
