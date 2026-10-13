# Composition Gate — negative-authz-suite (#607)

**Verdict:** CLEAR  
**HEAD:** (see commit after ship)  
**Date:** 2026-10-14

## Intent
Negativ-Berechtigungstests + Edge JWT gate + Local Admin DEV-only + ai-gm session membership.

## Auth resolution
Browser/API → Kong → Edge `main` (`gateEdgeRequestJwt`) → function workers; `ai-gm` → `assertSessionMemberAccess` (PostgREST RLS + project_members).

## Findings
None blocking. Realtime CDC still local-flake → `BLOCKED_604` when subscribed with 0 events (documented in workflows check).

## Secure-by-Default
| Check | Result |
|-------|--------|
| B-01 authz | PASS — stranger ai-gm 403; anon edge 401 |
| Local Admin prod | PASS — `import.meta.env.DEV` |
| Loopback weak seeds | PASS — compose-harden |
