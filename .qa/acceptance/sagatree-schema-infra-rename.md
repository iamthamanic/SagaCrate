# Acceptance — sagatree-schema-infra-rename

## Intent
Rename remaining SagaTree infrastructure and schema identifiers to SagaTree **without breaking** existing saves, presets, RLS RPCs, or a running self-host volume.

## Preconditions
- Migrations through `072` applied (or equivalent schema)
- Characters/presets may still store `ruleset_key = sagatree-core` and `sagatree_profile`

## Happy Path
- [ ] `characters.sagatree_profile` is canonical; `sagatree_profile` remains readable/writable via sync for one transition window
- [ ] New/updated characters persist `ruleset_key = sagatree-core`; legacy `sagatree-core` rows still load
- [ ] SQL helpers exist as `sagatree_*`; `sagatree_*` remain thin wrappers (same signatures)
- [ ] Domain rules live under `src/domains/rules/sagatree`; imports updated
- [ ] Docker containers/network default to `sagatree-*`; apply-migrations resolves `sagatree-db` or legacy `sagatree-db`
- [ ] Preset save/load and character editor round-trip without data loss

## Edge Cases
- [ ] Preset JSON snapshot with only `sagatree_profile` still imports
- [ ] Sheet-complete guard accepts both ruleset keys / both profile columns during transition
- [ ] `generate_sagatree_public_id` works; legacy `generate_sagatree_public_id` still callable

## Out of scope
- Rewriting historical numbered migrations (001–072) text in place
- Renaming the local parent folder on disk / GitHub org (repo already SagaTree)
- Mechanical rename of every `SagaTree*` TypeScript symbol in one PR (aliases kept; primary APIs add `SagaTree*`)

## Security Coverage
- B-xx: RLS policies unchanged in meaning; function renames keep SECURITY DEFINER + grants
- P-xx: No privilege widening; wrappers REVOKE/GRANT mirror originals

## Implementation Notes
- Migration `073_sagatree_schema_rename_compat.sql`: dual profile columns + sync trigger; ruleset rows → `sagatree-core` (legacy still allowed); `sagatree_*` SQL helpers renamed to `sagatree_*` with legacy wrappers; public-id generator dual-named.
- Domain rules folder moved to `src/domains/rules/sagatree` with deprecated re-export shims under `sagatree/`.
- Client writes `sagatree_profile` / `sagatree-core`; reads accept legacy keys/columns.
- Docker `container_name` + network → `sagatree-*` (volumes unchanged). `apply-migrations.sh` auto-detects `sagatree-db` or legacy `sagatree-db`.
- Out of scope kept: historical migration text 001–072; local parent folder path; mechanical rename of every `SagaTree*` TS symbol (aliases remain).
