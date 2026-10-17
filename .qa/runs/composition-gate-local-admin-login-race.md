# Composition Gate — local-admin-login-race

- HEAD_SHA: 6c4678fdc7a248b626796ea444724e60bb8b4e37
- Date: 2026-10-17
- Verdict: SKIPPED

## Event
Local Admin sign-in adopts GoTrue SIGNED_IN while intent flag is set; discard only after logout / non-admin user.

## Why SKIPPED
In-process AuthProvider listener ordering — no producer→consumer fan-out.

## Findings
None
