/**
 * world map constants — soft caps and brand pin colors (#580).
 * Location: src/domains/world/map/constants.ts
 */

export const WORLD_MAP_MODULE_ID = 'map' as const;

/** Soft-cap map edge length (tiles per side). */
export const MAX_MAP_SIZE = 60;

export const DEFAULT_MAP_SIZE = 24;

export const BASE_TILE_PX = 28;

/** Normal pins: brand cyan / gold — never danger-red. */
export const PIN_COLOR_CYAN = '#0891b2';
export const PIN_COLOR_GOLD = '#ca8a04';
