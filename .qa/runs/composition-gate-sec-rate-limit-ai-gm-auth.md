# Composition Gate — sec-rate-limit-ai-gm-auth

- HEAD_SHA: 8d87271c570724d0a72dcd58b74a36a144f2787d
- BASE_SHA: de60a0112db090e75f4838cda1373850ba626bff
- Date: 2026-10-15
- Verdict: CLEAR

## Event
Authenticated member floods `ai-gm`, or anonymous client floods `/auth/v1` login/signup.

## Hop chain
AI: JWT → Edge `ai-gm` → membership gate → `consume_ai_gm_rate_limit` → (allow LLM | 429/503).
Auth: Client → Kong `/auth/v1` rate-limiting → GoTrue (or 429 at gateway).

## Simulations
| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | Per-user AI quota; per-IP auth throttle | Postgres RPC + Kong local policy | pass |
| Invalid/missing | No service-role / RPC → no LLM | 503 fail-closed before Ollama | pass |
| Two consumers / crash | Multi-Edge shares AI counter | Single row upsert per user_id | pass |

## Flags
| Tag | Severity | Hops | Why local review missed it | Fix |
|-----|----------|------|----------------------------|-----|
| (none) | — | — | — | — |
