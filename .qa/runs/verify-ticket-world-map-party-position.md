# Verify Ticket — world-map-party-position (#581)

## Ergebnis
PASS

## Checks (@test-gate)
- `node scripts/test-gate.mjs` → Test Gate passed
- `node scripts/world-map-party-position-check.mjs` → OK
- Architecture boundary check → passed (public `app/world` barrel)

## Acceptance
- [x] GM moves party via `set_party_location` (panel + map drop)
- [x] Position in project adventure runtime (not world_maps)
- [x] Hub shows „Ihr seid hier“ + optional map marker
- [x] Player read-only (`canMoveParty` false on hub)
- [x] Overview RPC `partyLocationRef` + `worldProfileId` (069)
- [x] Checks + test-gate; zero type escape hatches

## Diff scope
party-location domain, overview VM/panel, WorldMapCanvas/PlayerView, SagaPartyLocationGmPanel, live/between-sessions wiring, 069 migration, check script.

## BASE_SHA
fef75f7138878dda025a6171920733a7e8e1d920
