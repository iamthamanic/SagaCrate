# Review Ticket — world-map-party-position (#581)

## Verdict
ACCEPT

## Summary
Party position correctly owned by adventure runtime; map asset stays in world_maps. UI reuses existing op; hub/player marker + GM controls are scoped and audience-safe.

## Findings
None blocking.

## Notes
- Encoding `map:x,y` keeps coords optional without schema change.
- Architecture: cross-area imports via `app/world` barrel.
