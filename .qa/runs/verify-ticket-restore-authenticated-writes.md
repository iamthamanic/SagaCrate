# Verify Ticket — restore-authenticated-writes (#603)
## Ergebnis
PASS
## Checks
test-gate PASS; saga-state-column-privileges-check PASS (059+071)
## Acceptance
- [x] Writes restored via 071 INSERT/UPDATE/DELETE
- [x] Secrets still non-selectable
- [x] createProject uses PROJECT_SAFE_COLUMNS
- [x] saga_id/saga_version_id on SELECT allow-list
