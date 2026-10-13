# Composition Gate — negative-authz-suite (#607)

- HEAD_SHA: eccbeebc9b066f2a7c59b5d1d4834df876d0f44e
- BASE_SHA: 0e76d818e51fd2f6a6f0ce7a239671f5ed043bd7
- Date: 2026-10-14
- Verdict: CLEAR

## Event
Anonymous or foreign caller hits Edge/REST deny paths; member JWT still reaches `dm-tools`.

## Hop chain
1. Client → Kong `/functions/v1/*` (apikey ± Bearer)
2. Edge `main` → `gateEdgeRequestJwt` (VERIFY_JWT default true)
3. Worker (`dm-tools` / `ai-gm`) only after valid HS256 Bearer
4. `ai-gm` → `assertSessionMemberAccess` (PostgREST sessions + project_members via caller JWT)
5. Evidence: `.qa/runs/negative-authz-suite/report.json` + test-gate contract

## Simulations

| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | GM member allow; stranger deny | membership gate + RLS empty session | pass |
| Invalid/missing | no Bearer / bad JWT → 401 | edge-jwt-gate | pass |
| Two consumers / crash | contract-check + workflows edge neg both require deny | shared deny semantics | pass |

## Flags
none
