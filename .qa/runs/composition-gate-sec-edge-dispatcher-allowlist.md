# Composition Gate — sec-edge-dispatcher-allowlist

- HEAD_SHA: 3adaecf3f799d0bc991f0039b63ea121a819bd57
- BASE_SHA: 84c2ee9df9b674a83e29ef024948239e70093821
- Date: 2026-10-15
- Verdict: SKIPPED

## Skip reason
Edge dispatcher allowlist only (Deno main + shared); no dual SoT, outbox, or multi-consumer UI fan-out.

## Event
Client or Kong routes `/functions/v1/<name>` to custom Edge `main`; allowlist decides whether a userWorker starts.

## Hop chain
Request → `main/index.ts` resolveServiceName → `isEdgeDispatcherAllowed` → (deny 404 | `gateEdgeRequestJwt` → `EdgeRuntime.userWorkers.create` → hardened worker).

## Simulations
| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | Each caller hits only allowlisted mounts | Deny-by-default Set; JWT still required | pass |
| Invalid/missing | Unknown/legacy name → 404 without worker | Fail closed before create | pass |
| Two consumers / crash | No shared mutable SoT in this slice | Stateless gate on pathname | pass |

## Flags
| Tag | Severity | Hops | Why local review missed it | Fix |
|-----|----------|------|----------------------------|-----|
| (none) | — | — | — | — |
