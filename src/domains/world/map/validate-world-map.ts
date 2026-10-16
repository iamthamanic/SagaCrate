/**
 * validate-world-map — Parse/clamp map_data JSON (#580).
 * Location: src/domains/world/map/validate-world-map.ts
 */
import { DEFAULT_MAP_SIZE, MAX_MAP_SIZE } from './constants';
import {
  emptyWorldMapData,
  tileKey,
  type WorldMapCountry,
  type WorldMapData,
  type WorldMapPin,
  type WorldMapTile,
  type WorldMapTileType,
  type WorldMapVm,
} from './world-map.types';

const TILE_TYPES: readonly WorldMapTileType[] = [
  'grass',
  'forest',
  'water',
  'mountain',
  'road',
  'city',
  'empty',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function clampSize(raw: unknown): number {
  const n =
    typeof raw === 'number' && Number.isFinite(raw)
      ? Math.floor(raw)
      : DEFAULT_MAP_SIZE;
  return Math.max(1, Math.min(MAX_MAP_SIZE, n));
}

function parseTileType(raw: unknown): WorldMapTileType {
  if (typeof raw === 'string' && (TILE_TYPES as readonly string[]).includes(raw)) {
    return raw as WorldMapTileType;
  }
  return 'grass';
}

export function parseWorldMapData(raw: unknown): WorldMapData {
  if (!isRecord(raw)) return emptyWorldMapData(DEFAULT_MAP_SIZE);
  const size = clampSize(raw.size);
  const tiles: Record<string, WorldMapTile> = {};
  if (isRecord(raw.tiles)) {
    for (const [key, value] of Object.entries(raw.tiles)) {
      if (!isRecord(value)) continue;
      const parts = key.split(',');
      if (parts.length !== 2) continue;
      const x = Number(parts[0]);
      const y = Number(parts[1]);
      if (!Number.isInteger(x) || !Number.isInteger(y)) continue;
      if (x < 0 || y < 0 || x >= size || y >= size) continue;
      tiles[tileKey(x, y)] = {
        type: parseTileType(value.type),
        countryId: typeof value.countryId === 'string' ? value.countryId : null,
      };
    }
  }
  const countries: WorldMapCountry[] = [];
  if (Array.isArray(raw.countries)) {
    for (const item of raw.countries) {
      if (!isRecord(item)) continue;
      const id = asString(item.id);
      if (!id) continue;
      countries.push({
        id,
        name: asString(item.name, id),
        color: asString(item.color, '#0891b2'),
      });
    }
  }
  const pins: WorldMapPin[] = [];
  if (Array.isArray(raw.pins)) {
    for (const item of raw.pins) {
      if (!isRecord(item)) continue;
      const id = asString(item.id);
      if (!id) continue;
      const x = Math.floor(Number(item.x));
      const y = Math.floor(Number(item.y));
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      if (x < 0 || y < 0 || x >= size || y >= size) continue;
      const imagePath =
        typeof item.imagePath === 'string' && item.imagePath.trim()
          ? item.imagePath.trim()
          : null;
      // Reject accidental data-URL / Base64 blobs
      if (imagePath && (imagePath.startsWith('data:') || imagePath.length > 512)) {
        continue;
      }
      pins.push({
        id,
        x,
        y,
        title: asString(item.title || item.label, 'Pin'),
        imagePath,
        discovered: item.discovered !== false,
      });
    }
  }
  return { size, tiles, countries, pins };
}

/** Player projection: drop undiscovered pins. */
export function projectWorldMapForPlayer(data: WorldMapData): WorldMapData {
  return {
    ...data,
    pins: data.pins.filter((p) => p.discovered),
  };
}

export function parseWorldMapVm(raw: unknown): WorldMapVm | null {
  if (!isRecord(raw)) return null;
  const worldProfileId = asString(raw.worldProfileId || raw.world_profile_id);
  if (!worldProfileId) return null;
  const revision =
    typeof raw.revision === 'number' && Number.isFinite(raw.revision)
      ? Math.max(0, Math.floor(raw.revision))
      : 0;
  return {
    worldProfileId,
    revision,
    data: parseWorldMapData(raw.mapData ?? raw.map_data ?? raw.data),
    updatedAt:
      typeof raw.updatedAt === 'string'
        ? raw.updatedAt
        : typeof raw.updated_at === 'string'
          ? raw.updated_at
          : null,
  };
}

export function setTileAt(
  data: WorldMapData,
  x: number,
  y: number,
  tile: WorldMapTile | null,
): WorldMapData {
  if (x < 0 || y < 0 || x >= data.size || y >= data.size) return data;
  const key = tileKey(x, y);
  const tiles = { ...data.tiles };
  if (!tile) {
    delete tiles[key];
  } else {
    // Keep `empty` as an explicit tile so eraser holes stay dark (missing = grass).
    tiles[key] = tile;
  }
  return { ...data, tiles };
}
