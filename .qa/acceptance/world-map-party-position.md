# Acceptance — world-map-party-position (#581)

## Intent
Party position lives in adventure runtime (`partyLocationRef`), not `world_maps`.
GM sets via `set_party_location`; hub + player map show „Ihr seid hier“.

## Checks
- [ ] `scripts/world-map-party-position-check.mjs` PASS
- [ ] Migration `069_party_location_overview.sql` exposes `partyLocationRef` + `worldProfileId`
- [ ] Hub `SagaWorldStatePanel` shows location text + read-only map marker
- [ ] GM live / between-sessions can set label or map coords
- [ ] Player cannot move marker (`canMoveParty` false on hub)
- [ ] Zero type escape hatches on touched files

## Non-goals
- Per-character pins
- Path animation
