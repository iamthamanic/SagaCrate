# Acceptance — Dornhain starter project (default Saga)

## Intent
Native Dornhain story must appear as a selectable Saga playthrough for GMs (Session erstellen / Bibliothek Sagas), analogous to Core/builtin item & NPC catalogs — not only as a definition seed.

## Surface class
Journey (SessionJoin create) + Library list

## Adaptive bands in scope
Phone + Desktop viewport; AU-01 not primary for this slice

## Happy Path
- [x] Authenticated GM with no Dornhain project opens Session erstellen → `ensure_native_starter_project` creates/returns playthrough → dropdown lists „Das Flüstern unter Dornhain“ and preselects it
- [x] Bibliothek → Sagas tab ensures the same starter when missing
- [x] Second visit is idempotent (`created: false`)

## Edge Cases
- [ ] Supabase timeout → clear error + retry CTA; no silent empty forever
- [ ] NPC library server timeout still shows Core/builtin locally (soft banner)

## Adaptive UI (`AU-*`)
- [ ] N/A primary — no layout recomposition in this slice (document)

## Regression
- [ ] Existing user projects still listed
- [ ] createProjectFromVersion / group run still works for native pins

## Assumptions
- Migration `067_ensure_native_starter_project.sql` applied; Dornhain seed from `063` present

## Deviations (§9)
- none
