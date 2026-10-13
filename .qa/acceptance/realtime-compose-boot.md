# Feature: realtime-compose-boot (#604)

## Intent
Realtime on the regular `docker-compose.yml` stack boots reliably (not only minproof), including secrets, tenant/CDC, and Kong `/socket`.

## Happy Path
- [x] `SECRET_KEY_BASE`, `FLY_APP_NAME`, `DB_ENC_KEY`, JWT secrets in `.env.example` + Compose
- [x] Tenant seed (migrate + `Realtime.Api.create_tenant` as supabase_admin path) for `localhost`
- [x] WS with User-JWT → SUBSCRIBED; unsubscribe works
- [x] Restart checklist without volume deletion (`docs/ops/realtime-restart-checklist.md`)
- [x] Evidence under `.qa/runs/realtime-compose-boot.json` + tenant seed JSON

## Edge Cases
- [x] Missing SECRET_KEY_BASE → container crash (documented; compose requires env)
- [x] Wrong CDC region (`local`) → `Nodes.region_nodes/1` crash — use `us-east-1`
- [x] Kong without `/socket` → Phoenix `/websocket` 404

## Composition Gate
See `.qa/runs/composition-gate-realtime-compose-boot.md`

## Implementation Notes
- Kong: `/realtime/v1/` → `supabase-realtime:4000/socket` (strip_path)
- Nginx include mirrors WS upgrade + `/socket/` proxy
- Live stack may still use `sagadrive-*` container names; compose uses `sagatree-*`
