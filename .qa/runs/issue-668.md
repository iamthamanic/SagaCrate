# Issue #668 — Edge dispatcher allowlist

## Implement
- Added `edge-dispatcher-allowlist.ts` + Deno tests
- `main/index.ts` deny-by-default before JWT / worker create
- `scripts/edge-dispatcher-allowlist-check.mjs` wired into test-gate
- Acceptance: `.qa/acceptance/sec-edge-dispatcher-allowlist.md`

## Next
verify → composition-gate → review → ecc-check → PR → merge
