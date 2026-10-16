/**
 * world/map domain public API (#580).
 * Location: src/domains/world/map/index.ts
 */
export {
  WORLD_MAP_MODULE_ID,
  MAX_MAP_SIZE,
  DEFAULT_MAP_SIZE,
  BASE_TILE_PX,
  PIN_COLOR_CYAN,
  PIN_COLOR_GOLD,
  PARTY_MARKER_COLOR,
  PARTY_MARKER_RING,
} from './constants';
export {
  tileKey,
  emptyWorldMapData,
  type WorldMapTileType,
  type WorldMapTool,
  type WorldMapTile,
  type WorldMapCountry,
  type WorldMapPin,
  type WorldMapData,
  type WorldMapVm,
} from './world-map.types';
export {
  parseWorldMapData,
  parseWorldMapVm,
  projectWorldMapForPlayer,
  setTileAt,
} from './validate-world-map';
export { buildDornhainStarterMapData } from './dornhain-starter-map';
