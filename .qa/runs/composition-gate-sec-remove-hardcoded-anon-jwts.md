# Composition Gate — sec-remove-hardcoded-anon-jwts

- HEAD_SHA: WORKTREE
- BASE_SHA: 93f451c570a7b6011f2b9edc5b958fd551a2e042
- Date: 2026-10-16
- Verdict: SKIPPED

## Skip reason
Config/secret hygiene only — removes committed JWT literals; no new producer→consumer business hop.

## Event
Vite boot reads Supabase public config from env.

## Hop chain
`.env` → `import.meta.env` → `src/lib/supabase.ts` → createClient (fail closed if missing).

## Simulations
| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | N/A | — | skip |
| Invalid/missing | Missing env → throw | Fail closed | skip |
| Two consumers / crash | N/A | — | skip |

## Flags
| Tag | Severity | Hops | Why local review missed it | Fix |
|-----|----------|------|----------------------------|-----|
| (none) | — | — | — | — |
