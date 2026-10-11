# Feature: Saga als eigene Geschichte mit versionierten Fassungen

<!-- #574 — migration 063 (062 taken by session-recap-ai) -->

## Intent
Führe Saga als eigene Story-Entität mit versionierten Fassungen ein. `projects` bleiben Gruppen-Spielstände und verweisen auf eine gepinnte Fassung.

## Happy Path
- [x] Tabellen `saga_definitions` + `saga_definition_versions` + FKs on projects (`063_saga_definitions.sql`)
- [x] Dornhain native seed (`dornhain.whisper` v1) with gm_only facts in DB only
- [x] Backfill aller bestehenden projects (`private_backfill`)
- [x] Player cannot read gm_only fact texts from client bundle
- [x] Zweite Gruppe via `create_project_from_saga_version` (same version_id)
- [x] docs/navigation-public-ids.md updated (SA- = Gruppen-Spielstand)
- [x] Checks + test-gate
- [x] Zero type escape hatches

## Edge Cases
- [x] Version payloads RPC-only (table SELECT revoked)
- [x] Native insert blocked for non-service_role
- [x] Overview exposes sagaDefinitionId / versionLabel / newerVersionAvailable

## Security Coverage
- B-04/B-07: version payload projected; gm_only stripped for non-GM
- P-04: secrets not in client Dornhain package

## Composition Gate
- Verdict: CLEAR
- Proof: `.qa/runs/composition-gate-saga-definitions-versions.md`
