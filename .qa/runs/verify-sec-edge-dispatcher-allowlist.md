# Verify — sec-edge-dispatcher-allowlist (#668)

**Verdict:** PASS

| Acceptance | Evidence |
|---|---|
| Explicit allowlist; non-listed → 404 without worker | `isEdgeDispatcherAllowed` before `userWorkers.create` in `main/index.ts` |
| Legacy character/session paths no longer succeed via main | Legacy names denied in allowlist + Deno tests |
| Hardened mounts remain callable (w/ JWT) | Allowlist includes character-lore, item-*, session-*, ai-provider-credentials, …; JWT gate still after allowlist |
| test-gate check | `scripts/edge-dispatcher-allowlist-check.mjs` + wired in `test-gate.mjs` |
| typed-strict | No `any` / `@ts-nocheck` in touched TS |

## Checks run

- `node scripts/edge-dispatcher-allowlist-check.mjs` → OK
- `deno test …/edge-dispatcher-allowlist_test.ts` → 3 passed
