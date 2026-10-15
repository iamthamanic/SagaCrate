# Feature: sec: rate-limit ai-gm and auth abuse paths

## Intent
`ai-gm` und Login/Signup dürfen nicht unkontrolliert LLM-/Auth-Stürme auslösen; Limits fail-closed.

## Happy Path
- [x] Migration `087_ai_gm_rate_limits.sql` + `consume_ai_gm_rate_limit` (service_role only)
- [x] `ai-gm` Edge: persistent user quota → 429; missing infra → 503 (no LLM)
- [x] Kong rate-limiting on `/auth/v1` (30/min/IP, fail-closed) → 429
- [x] GoTrue `GOTRUE_RATE_LIMIT_*` ceilings in compose
- [x] LoginScreen maps 429 to German copy
- [x] Static check in test-gate; Deno unit tests for RPC consumer

## Edge Cases
- [x] `ai-gm` remains off Edge allowlist (#668); limiter ships before remount
- [x] Distributed Edge instances share Postgres counters (not in-memory)

## Regression
- [x] compose-harden-defaults still green with rate-limiting plugin
- [x] Membership gate still runs before rate limit in `ai-gm`

## Assumptions
- Remount of `ai-gm` is a separate ticket after limiter is on `main`

## Screenshots
N/A

## Implementation Notes
- Docs: `docs/ops/auth-ai-gm-rate-limits.md`
- Live auth probe: Kong returned 429 after ~30 password-grant attempts/min

## Composition Gate
- Verdict: CLEAR — see `.qa/runs/composition-gate-sec-rate-limit-ai-gm-auth.md`

## Launch Checklist (SC)
- SC-03 PASS (AI + auth rate limits)
- SC-01 N/A (no new IDOR surface); SC-02 PASS (server-side quotas); SC-06 PASS
