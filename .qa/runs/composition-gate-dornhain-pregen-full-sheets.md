# Composition gate — dornhain-pregen-full-sheets

## Verdict
CLEAR (WORKTREE)

## HEAD
fix/dornhain-pregen-full-sheets (local)

## Producer → consumer
1. Domain catalog `dornhain-pregen-sheets.ts` builds validated SagaTree profiles from starting templates + race traits.
2. Migration `082_dornhain_pregen_full_sheets.sql` replaces `seed_dornhain_starter_characters` and backfills existing native starters (`nativeStarterSheetVersion < 1`).
3. Character Editor hydrate reads `race` (EN key via `normalizeSagaTreeRaceKey`) + `sagatree_profile` archetype/essence/traits/skills.
4. Library meta maps race keys to German labels via `getCharacterCreationOptionLabel`.

## N-actors / invalid-fallback / concurrent
- Idempotent seed: version marker prevents overwrite after v1 applied.
- Name or `nativeAssetId` match scopes updates to Dornhain natives only.
- Invalid legacy `Mensch` + empty profile rows are upgraded on migration apply / re-provision.

## Proof
- `node scripts/dornhain-pregen-full-sheets-check.mjs`
- Wired into `npm run test-gate`
