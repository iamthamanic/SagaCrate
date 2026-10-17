# Feature: Local Admin login race hardening

## Intent
Fast GoTrue success for `admin`/`1234` must keep the JWT. Anti-resurrection must not discard a live Local Admin sign-in. Recurrence is gated by e2e + smoke.

## Happy Path
- [x] Local Admin shortcut → GoTrue 200 → Dashboard with `auth-token` present
- [x] Timeout still falls back without hanging
- [x] Logout still blocks late JWT resurrection

## Edge Cases
- [x] `SIGNED_IN` before `applyUser` while Local Admin flag set → adopt, do not discard
- [x] Non-admin current user → late admin JWT still scrubbed

## Composition Gate
- Verdict: SKIPPED
- Reason: in-process AuthProvider listener race; no producer→consumer fan-out
- Proof: `.qa/runs/composition-gate-local-admin-login-race.md`
