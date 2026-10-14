# Composition Gate — dornhain-pregen-full-sheets

- HEAD_SHA: PENDING_COMMIT
- Date: 2026-10-14
- Verdict: CLEAR

## Event
Dornhain native starter character provision / backfill → Character Editor hydrate + Library meta + Session join (`sheet_status=complete`).

## Producer → consumer
1. Domain catalog `dornhain-pregen-sheets.ts` builds validated SagaTree profiles (templates + race traits).
2. Migration `082` / `seed_dornhain_starter_characters` persists race + `sagatree_profile` + skills; one-shot backfill only when `nativeAssetId` matches and sheet is still a thin stub.
3. Character Editor hydrate: `normalizeSagaTreeRaceKey(race)` + profile archetype/essence/traits/skills.
4. Library meta: German race label via `getCharacterCreationOptionLabel`.

## Simulations
| Case | Expected | Result |
|------|----------|--------|
| N-actors (many owners) | Backfill keyed by `nativeAssetId` only — no name-only overwrite of unrelated PCs | OK |
| Invalid fallback | Customized sheet with archetype set + version&lt;1 is **not** overwritten | OK |
| Concurrent re-seed | `nativeStarterSheetVersion=1` → idempotent no-op on full sheet fields | OK |

## Proof
- `node scripts/dornhain-pregen-full-sheets-check.mjs`
- Wired into `npm run test-gate`
