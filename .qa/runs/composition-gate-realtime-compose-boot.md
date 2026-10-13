# Composition Gate — realtime-compose-boot

- HEAD_SHA: WORKTREE
- Date: 2026-10-13
- Verdict: CLEAR

## Event
Client opens Realtime WS via Kong; tenant `localhost` connects; channel subscribe succeeds.

## Hop chain
1. `.env` secrets → Compose `supabase-realtime` boot (SECRET_KEY_BASE)
2. `seed-realtime-tenant.mjs` → migrate + `Realtime.Api.create_tenant` (CDC encrypted)
3. Kong/nginx `/realtime/v1/` → Phoenix `/socket/`
4. Supabase-js User JWT → SUBSCRIBED
5. Unsubscribe cleans channel

## Simulations

| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | 1 user → 1 socket → N channels | channel join per topic | pass |
| Invalid/missing | no SECRET_KEY_BASE → no boot | compose required env | pass |
| Two consumers | reconnect/unsubscribe | client removeAllChannels | pass |

## Flags
none
