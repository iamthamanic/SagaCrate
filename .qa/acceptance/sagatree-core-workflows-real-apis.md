# Acceptance — sagatree-core-workflows-real-apis (#606)

## Intent
Verify SagaTree core happy paths against the **regular** sagatree Compose stack
via real Auth/REST/RPC/Storage/Edge APIs (no SQL seed bypass from minproof).

## Preconditions
- `sagatree-kong` + auth/rest/storage/edge/db healthy on `:8000`
- Migrations through **071** applied (authenticated project/session writes)
- `.env` has `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
  `VITE_SUPABASE_URL` (or `API_EXTERNAL_URL`)

## Happy Path
1. Login (GoTrue password grant) for GM + player + stranger
2. Project create + list via REST (authenticated)
3. Session create (`create_play_session`) + join (`join_session_by_code`) — 2 clients
4. Runtime mutate (REST UPDATE `sessions.name`) observed by second client read
5. Storage: authenticated upload + read on `character-portraits`
6. Edge: member `dm-tools/dice` → 200; anon/stranger denied as appropriate

## Realtime
- Prefer postgres_changes sync after mutate on regular Kong `/realtime/v1`
- If `sagatree-realtime` is down (known #604 `SECRET_KEY_BASE`), record
  `realtime.status=BLOCKED_604` with container log evidence — do not fake pass

## Edge negative authz
- Prefer anon → 401 and stranger session → 403/404
- If regular compose has `VERIFY_JWT=false` / loose Edge defaults (#605), record
  `edgeAuthz.status=BLOCKED_605` with observed statuses — do not fake pass

## Non-Goals
- Minproof-only evidence as sole proof
- Paid Meshy/OpenAI
- UI pixel polish
- Fixing #604/#605/#609 (needs-human)

## Security Coverage
- B-01: JWT required for writes / edge member paths
- B-04: no SQL bypass; secrets columns not selected
- P-xx: stranger/anon negative checks in same report

## Evidence
- Live report: `.qa/runs/sagatree-core-workflows/report.json`
- Runner: `scripts/sagatree-core-workflows-check.mjs`
- Static contract: `scripts/sagatree-core-workflows-contract-check.mjs`
