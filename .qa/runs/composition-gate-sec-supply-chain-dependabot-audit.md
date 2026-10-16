# Composition Gate — sec-supply-chain-dependabot-audit

- HEAD_SHA: WORKTREE
- BASE_SHA: 3965a1cc6801020d9b3bb507a727413b6f31b196
- Date: 2026-10-15
- Verdict: SKIPPED

## Skip reason
Supply-chain tooling only (Dependabot + npm audit + lockfile); no dual SoT, outbox, or multi-consumer product hop.

## Event
CI / Dependabot consume `package-lock.json` for install and advisory gates.

## Hop chain
PR push → verify.yml `npm ci` → `npm audit --audit-level=high` → test-gate.

## Simulations
| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | N/A tooling | — | skip |
| Invalid/missing | N/A | — | skip |
| Two consumers / crash | N/A | — | skip |

## Flags
| Tag | Severity | Hops | Why local review missed it | Fix |
|-----|----------|------|----------------------------|-----|
| (none) | — | — | — | — |
