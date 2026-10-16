# Supply-chain: Dependabot + npm audit (#671)

## Policy

| Control | Behavior |
|---------|----------|
| Lockfile | `package-lock.json` committed; CI uses `npm ci` |
| CI gate | `npm audit --audit-level=high` in `.github/workflows/verify.yml` (fails on high/critical) |
| Local gate | Same bar inside `npm run test-gate` (`reportDependencyAudit`) |
| Dependabot | `.github/dependabot.yml` — weekly npm updates at `/` |

## 2026-10-15 remediation

Fixed via `npm audit fix` + exact `vite@6.4.4` bump (was 6.3.5; advisory range `<=6.4.2`).

Cleared advisories included critical `tar` and high `postcss` / `nanoid` / `browserslist` / `playwright` / `source-map-js` (transitive) plus Vite GHSA set.

Production-only tree (`npm audit --omit=dev`) was already clean before the full-tree fix; CI still audits the **full** tree so dev tooling vulns cannot regress silently.

## Waivers

None at ship time — `npm audit --audit-level=high` exits 0.
