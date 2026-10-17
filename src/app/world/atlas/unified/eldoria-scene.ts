/**
 * eldoria-scene — nested demo rects + labels for Unified Atlas LOD.
 * Location: src/app/world/atlas/unified/eldoria-scene.ts
 * Sample geometry only — not canonical world lore (IV spatial aid).
 */
import type { AtlasRect } from '../../../../domains/world/map';
import type {
  UnifiedCanvasObject,
  UnifiedCanvasStampType,
} from '../../../../domains/world/atlas';

export const WORLD_RECT: AtlasRect = { x: 0, y: 0, width: 1440, height: 900 };
export const NORTH_RECT: AtlasRect = { x: 710, y: 236, width: 510, height: 398 };
export const REGION_RECT: AtlasRect = { x: 772, y: 285, width: 360, height: 270 };
export const CITY_RECT: AtlasRect = { x: 900, y: 402, width: 153, height: 116 };
export const INN_RECT: AtlasRect = { x: 979, y: 449, width: 21, height: 15 };

export type EldoriaNodeId = 'world' | 'north' | 'region' | 'city' | 'inn' | 'room';

export type EldoriaNode = {
  readonly id: EldoriaNodeId;
  readonly label: string;
  readonly level: string;
  readonly area: AtlasRect;
};

export const ELDORIA_NODES: readonly EldoriaNode[] = [
  { id: 'world', label: 'Eldoria', level: 'WELT', area: WORLD_RECT },
  { id: 'north', label: 'Nordreich', level: 'LAND', area: NORTH_RECT },
  { id: 'region', label: 'Dornhainer Mark', level: 'REGION', area: REGION_RECT },
  { id: 'city', label: 'Dornhain', level: 'STADT', area: CITY_RECT },
  { id: 'inn', label: 'Kupferlaterne', level: 'GEBÄUDE', area: INN_RECT },
  {
    id: 'room',
    label: 'Schankraum',
    level: 'INNENRAUM',
    area: {
      x: INN_RECT.x + INN_RECT.width * 0.17,
      y: INN_RECT.y + INN_RECT.height * 0.14,
      width: INN_RECT.width * 0.67,
      height: INN_RECT.height * 0.68,
    },
  },
];

export const MATERIAL_COLORS: Readonly<Record<string, string>> = {
  gras: '#4f7957',
  erde: '#8d7357',
  sand: '#c5ad81',
  wasser: '#286d7d',
  stein: '#a3a49a',
  holz: '#98694b',
  pflaster: '#95938a',
};

export const STAMP_CATALOG: readonly {
  readonly id: UnifiedCanvasStampType;
  readonly label: string;
  readonly icon: string;
}[] = [
  { id: 'baum', label: 'Baum', icon: '♣' },
  { id: 'tanne', label: 'Tanne', icon: '♠' },
  { id: 'fels', label: 'Fels', icon: '◆' },
  { id: 'haus', label: 'Haus', icon: '⌂' },
  { id: 'turm', label: 'Turm', icon: '♜' },
  { id: 'tisch', label: 'Tisch', icon: '▤' },
  { id: 'stuhl', label: 'Stuhl', icon: '▣' },
  { id: 'fass', label: 'Fass', icon: '◉' },
  { id: 'bett', label: 'Bett', icon: '▱' },
  { id: 'kiste', label: 'Kiste', icon: '▥' },
  { id: 'lampe', label: 'Licht', icon: '✧' },
  { id: 'teppich', label: 'Teppich', icon: '▦' },
];

export const LAYER_LABELS: readonly { readonly id: string; readonly label: string }[] = [
  { id: 'terrain', label: 'Gelände' },
  { id: 'roads', label: 'Wege & Straßen' },
  { id: 'region', label: 'Regionen' },
  { id: 'city', label: 'Stadt & Gebäude' },
  { id: 'interior', label: 'Innenräume' },
  { id: 'drawings', label: 'Zeichnungen' },
  { id: 'objects', label: 'Objekte & Einrichtung' },
  { id: 'grid', label: 'Kampfgrid' },
];

export function pointInRect(
  p: { readonly x: number; readonly y: number },
  r: AtlasRect,
): boolean {
  return p.x >= r.x && p.y >= r.y && p.x <= r.x + r.width && p.y <= r.y + r.height;
}

export function demoSeedObjects(): UnifiedCanvasObject[] {
  const inn = INN_RECT;
  return [
    { id: 'o1', type: 'baum', x: 932.7, y: 466.2, size: 2.1 },
    { id: 'o2', type: 'tanne', x: 1013, y: 428, size: 2.5 },
    { id: 'o3', type: 'tisch', x: inn.x + inn.width * 0.4, y: inn.y + inn.height * 0.33, size: 1.35 },
    { id: 'o4', type: 'tisch', x: inn.x + inn.width * 0.66, y: inn.y + inn.height * 0.57, size: 1.25 },
    { id: 'o5', type: 'fass', x: inn.x + inn.width * 0.79, y: inn.y + inn.height * 0.28, size: 0.62 },
    { id: 'o6', type: 'stuhl', x: inn.x + inn.width * 0.38, y: inn.y + inn.height * 0.22, size: 0.65 },
    { id: 'o7', type: 'stuhl', x: inn.x + inn.width * 0.27, y: inn.y + inn.height * 0.36, size: 0.65 },
    { id: 'o8', type: 'stuhl', x: inn.x + inn.width * 0.63, y: inn.y + inn.height * 0.46, size: 0.65 },
    { id: 'o9', type: 'bett', x: inn.x + inn.width * 0.8, y: inn.y + inn.height * 0.79, size: 1.1 },
    {
      id: 'o10',
      type: 'teppich',
      x: inn.x + inn.width * 0.44,
      y: inn.y + inn.height * 0.56,
      size: 3.1,
    },
  ];
}
