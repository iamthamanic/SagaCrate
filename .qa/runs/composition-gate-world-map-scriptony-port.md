# Composition Gate — world-map-scriptony-port
- HEAD_SHA: 1f107dda35c2e1d8e770e6cbcd505f9255b52240
- BASE_SHA: 34290cd4e5680c6ca92b404f5d85ca475d2f8b03
- Date: 2026-10-11
- Verdict: CLEAR

## Event
World owner edits tile map; save_world_map persists map_data; pin images upload to Storage; player get_world_map filters undiscovered pins.

## Hop chain
WorldMapEditorScreen → useWorldMapEditor → worldMapService.saveMap → save_world_map RPC → world_maps; pins → storage world-map-pins; WorldMapPlayerView → get_world_map(player_view).

## Simulations
| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | Non-editor cannot write | edit RLS + RPC | pass |
| Invalid/missing | size/Base64 | SQL 22023 | pass |
| Two consumers / crash | revision conflict | 40001 | pass |

## Flags
| Tag | Severity | Hops | Why | Fix |
|-----|----------|------|-----|-----|
| (none) | | | | |
