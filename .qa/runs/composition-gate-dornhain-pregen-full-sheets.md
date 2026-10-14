# Composition Gate — dornhain-pregen-full-sheets

- HEAD_SHA: a6a494e0a8d0d4e758307fbaeb2351493f4623ff
- BASE_SHA: f165fb8182244f35be9e83de38d31b5a6fd780a0
- Date: 2026-10-14
- Verdict: CLEAR

## Event
Dornhain native starter provision/backfill produces complete SagaTree sheets consumed by Character Editor hydrate, Library meta, and session join.

## Hop chain
1. Domain catalog builds validated profiles (templates + race traits + assertValidSagaTreeCharacterPersistence).
2. Migration 082 / `seed_dornhain_starter_characters` persists race + sagatree_profile + skills; backfill only for nativeAssetId stubs without archetype; version stamped on attributes.
3. Character Editor hydrate maps race via normalizeSagaTreeRaceKey and loads archetype/essence/traits/skills.
4. Library meta shows German race labels via getCharacterCreationOptionLabel.

## Simulations
| Case | Expected | Result |
|------|----------|--------|
| N-actors | Many owners + same-name draft: upgrade predicate is per-row, not global | OK |
| N-actors-legacy | Many owners: backfill keyed by nativeAssetId (name only with Dornhain-Starter description) | OK |
| Invalid/missing | Customized sheet with archetype set is not overwritten; missing archetype thin stubs upgrade | OK |
| Two consumers / crash | Editor save strips profile version; attributes version + archetype guard prevent wipe on re-seed | OK |

## Flags
None open. Greptile P1 same-name draft: fixed via per-row CASE.
