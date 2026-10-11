/**
 * world-map.types — Tile map domain model (#580).
 * Location: src/domains/world/map/world-map.types.ts
 */

export type WorldMapTileType =
  | 'grass'
  | 'forest'
  | 'water'
  | 'mountain'
  | 'road'
  | 'city'
  | 'empty';

export type WorldMapTool = 'brush' | 'eraser' | 'pin' | 'pan';

export type WorldMapTile = {
  readonly type: WorldMapTileType;
  readonly countryId: string | null;
};

export type WorldMapCountry = {
  readonly id: string;
  readonly name: string;
  readonly color: string;
};

/** Pin metadata — imagePath is Storage path, never Base64. */
export type WorldMapPin = {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly title: string;
  readonly imagePath: string | null;
  readonly discovered: boolean;
};

export type WorldMapData = {
  readonly size: number;
  readonly tiles: Readonly<Record<string, WorldMapTile>>;
  readonly countries: readonly WorldMapCountry[];
  readonly pins: readonly WorldMapPin[];
};

export type WorldMapVm = {
  readonly worldProfileId: string;
  readonly revision: number;
  readonly data: WorldMapData;
  readonly updatedAt: string | null;
};

export function tileKey(x: number, y: number): string {
  return `${x},${y}`;
}

export function emptyWorldMapData(size: number): WorldMapData {
  return {
    size,
    tiles: {},
    countries: [],
    pins: [],
  };
}
