# Acceptance — sagatree-eradicate-legacy-ids

## Intent
Remove remaining SagaDrive identifiers from product surfaces and live schema so only SagaTree names remain (except historical migration files 001–078).

## Happy Path
- [x] Runtime TypeScript / UI / docs / scripts use `SagaTree*` / `sagatree_*` / `sagatree-core`
- [x] `src/domains/rules/sagadrive` shim removed
- [x] Client persists/reads `sagatree_profile` only
- [x] Migration `079_drop_sagadrive_aliases.sql` drops alias column, wrappers, and `sagadrive-core` CHECK
- [x] `scripts/sagatree-name-ban-check.mjs` fails if `sagadrive` reappears outside allowlist

## Edge Cases
- [x] Historical `007_sagadrive_character_profile.sql` / `005_*` keep original text (applied history)
- [x] Preset JSON snapshots rewritten: `sagadrive_profile` → `sagatree_profile`
- [x] Fresh install: 077 may still write alias column; 079 drops it afterward

## Out of scope
- Rewriting migration bodies 001–078
- Renaming Git history / old issue titles

## Security Coverage
- B-xx: RLS meaning unchanged; dropped wrappers no longer callable
- P-xx: No privilege widening
