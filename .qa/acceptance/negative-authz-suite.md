# Feature: test: negative authz suite on promoted compose

## Intent
Negativ-Berechtigungstests dauerhaft gegen den übernommenen Compose absichern (anon, ungültiges JWT, fremde Session, unberechtigter Spieler).

## Happy Path
- [x] anon / invalid JWT / foreign session / non-member → deny
- [x] Local Admin in production build aus (`import.meta.env.DEV`)
- [x] Weak admin/1234 nicht auf internet-facing Config (loopback DB/Edge + DEV-only docs)
- [x] Suite im test-gate (`negative-authz-suite-check.mjs`)
- [x] Evidence unter `.qa/runs/negative-authz-suite/`

## Edge Cases
- [x] OPTIONS preflight bypasses JWT gate
- [x] `VERIFY_JWT=false` local opt-out still documented (#605)

## Regression
- [x] Member JWT still reaches `dm-tools/dice`
- [x] Core workflows edge neg no longer accepts `BLOCKED_605`

## Assumptions
- Live gateway has Edge main mounted from this repo (JWT gate in dispatcher)

## Screenshots
N/A (API suite)

## Implementation Notes
- `_shared/edge-jwt-gate.ts` + call from `main/index.ts`
- Live: `node scripts/negative-authz-suite.mjs`
- Contract: `node scripts/negative-authz-suite-check.mjs` (test-gate)
