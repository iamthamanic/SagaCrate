# Composition Gate — dornhain-default-all-accounts

- HEAD_SHA: e2a0ad26432bc900d7febcaac5827eba0a2a5a88
- BASE_SHA: a04b362a4d2446ea60ad2df8d855f672acedf708
- Date: 2026-10-12
- Verdict: CLEAR

## Event

New or existing account → Dornhain starter project + catalog bindings + world map + pregen characters provisioned → Library / Catalog / Welt show defaults without manual seed.

## Hop chain

`auth.users` INSERT trigger / `ensure_native_starter_project` / login client → `provision_dornhain_starter_for_user` → `projects` + `world_profiles` + `world_maps` + `saga_asset_bindings` + `characters` + GM grants → Library list / `list_saga_bindings` / Welt panel.

No queue/outbox/webhook fan-out.

## Simulations

| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | Every auth user gets own Dornhain project | Backfill loops users; trigger on INSERT | pass |
| Invalid/missing | Missing saga returns ok=false; trigger WARN and continues signup | EXCEPTION handler in trigger | pass |
| Two consumers / crash | Login RPC + signup trigger both idempotent | ON CONFLICT / existing project path + re-seed | pass |

## Flags

| Tag | Severity | Hops | Why local review missed it | Fix |
|-----|----------|------|----------------------------|-----|
| — | — | — | — | n/a |
