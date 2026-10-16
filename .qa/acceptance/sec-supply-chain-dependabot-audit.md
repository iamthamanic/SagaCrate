# Feature: sec: supply-chain Dependabot + npm audit gate

## Intent
Reproduzierbare `npm ci` Builds; High/Critical Advisories blocken CI; wöchentliche Dependabot-Updates.

## Happy Path
- [x] `.github/dependabot.yml` weekly npm at `/`
- [x] CI `npm audit --audit-level=high` in verify.yml
- [x] test-gate Dependency audit blocking on high+
- [x] Critical/high cleared (`vite@6.4.4` + `npm audit fix`); no waivers

## Edge Cases
- [x] Full-tree audit (not only `--omit=dev`) so Playwright/Vite advisories stay gated

## Regression
- [x] `npm ci` + `npm run test-gate` green after lockfile update

## Assumptions
N/A

## Screenshots
N/A

## Composition Gate
- Verdict: SKIPPED — see `.qa/runs/composition-gate-sec-supply-chain-dependabot-audit.md`

## Launch Checklist (SC)
- SC-04 PASS
