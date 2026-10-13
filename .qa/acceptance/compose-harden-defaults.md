# Feature: compose-harden-defaults (#605)

## Intent
Adopt Phase-3 compose hardening: Kong 1 worker default, private DB/Edge binds, VERIFY_JWT true, Local Admin DEV-only.

## Happy Path
- [x] Kong workers Default=1; =2 documented
- [x] Localhost binds for DB/Edge
- [x] VERIFY_JWT=true default; Local Admin DEV notes
- [x] No Kong key-auth on all routes
- [x] Volumes unantastet (docs + no down -v)
- [x] Contract check in test-gate

## Composition Gate
SKIPPED — config/docs only; no producer→consumer cardinality change.
