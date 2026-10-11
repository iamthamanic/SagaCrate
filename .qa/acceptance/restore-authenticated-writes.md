# Acceptance — restore-authenticated-writes (#603)

## Intent
Authenticated clients can INSERT/UPDATE projects/sessions again after 059, without
re-exposing `adventure_runtime` / `world_state` / `notes` via direct SELECT.

## Checks
- [ ] Migration `071_restore_authenticated_project_session_writes.sql`
- [ ] `createProject` uses `.select(PROJECT_SAFE_COLUMNS)` (no bare `.select()`)
- [ ] `PROJECT_SAFE_COLUMNS` includes `saga_id` / `saga_version_id`
- [ ] Secrets remain non-selectable (`saga-state-column-privileges-check` PASS)
- [ ] Zero type escape hatches

## Security
- B-04: secrets stay locked
- B-01: RLS + column privileges; writes via authenticated role only where RLS allows
