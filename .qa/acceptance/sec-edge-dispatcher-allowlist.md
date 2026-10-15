# Acceptance — sec-edge-dispatcher-allowlist (#668)

## Intent

Edge `main` dispatcher may only start hardened Edge Functions. Unknown and legacy unauthenticated mounts return 404 without spawning a worker.

## Acceptance

- [x] Dispatcher allowlist is explicit (`EDGE_DISPATCHER_ALLOWLIST`); non-listed names return 404 without starting a worker.
- [x] Unauthenticated GET/PUT/DELETE against previously open legacy character/session paths no longer reaches those workers via main.
- [x] Hardened functions remain on the allowlist (character-lore, item-thumbnail, item-model3d, session-recap, ai-provider-credentials, …) and still pass JWT gate.
- [x] Deterministic check wired into `npm run test-gate` (`scripts/edge-dispatcher-allowlist-check.mjs`) + Deno unit tests.
- [x] Touched files: zero type escape hatches.

## Secure-by-Default / Launch Checklist (SC)

- B-01 / B-02 / B-08: deny-by-default Edge mounts
- SC-01 (inline): legacy IDOR surfaces unreachable via dispatcher
- SC-02: N/A field whitelist (no new client body trust)
- SC-06: N/A secrets

## Out of scope

- Full rewrite of blocked legacy workers
- Frontend product rewiring for removed legacy invokes (follow-up)
