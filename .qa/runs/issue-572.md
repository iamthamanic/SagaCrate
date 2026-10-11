# Issue #572 — session-recap-persist-handover

## Status
implement → verify PASS → composition CLEAR → review ACCEPT → ecc READY → shipping

## Delivered
- `061_session_recaps_and_handover.sql` — table, upsert on complete, hydrate create, audience-safe get/overview
- Domain session-window highlights + persisted parse
- `session-recap-service` + hook prefer persisted when completed
- Recap UI optional summary section
- Check wired in test-gate

## Notes
Local DB may lag apply-migrations for older RPCs; migration is self-contained for CI/full chain.
