/**
 * Party location helpers (#581).
 * Encodes map coords in adventure.partyLocationRef as `map:x,y` (0–99 grid).
 * Plain text refs stay human-readable location labels.
 */

export type PartyMapPosition = {
  readonly x: number;
  readonly y: number;
};

export type ParsedPartyLocation =
  | { readonly kind: 'map'; readonly position: PartyMapPosition; readonly raw: string }
  | { readonly kind: 'label'; readonly label: string; readonly raw: string };

const MAP_RE = /^map:(\d{1,2}),(\d{1,2})$/i;

export function formatPartyMapLocation(x: number, y: number): string {
  const nx = Math.max(0, Math.min(99, Math.floor(x)));
  const ny = Math.max(0, Math.min(99, Math.floor(y)));
  return `map:${nx},${ny}`;
}

export function parsePartyLocation(raw: string | null | undefined): ParsedPartyLocation | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().slice(0, 80);
  if (!trimmed) return null;
  const m = MAP_RE.exec(trimmed);
  if (m) {
    return {
      kind: 'map',
      position: { x: Number(m[1]), y: Number(m[2]) },
      raw: trimmed,
    };
  }
  return { kind: 'label', label: trimmed, raw: trimmed };
}

export function partyLocationDisplayLabel(raw: string | null | undefined): string | null {
  const parsed = parsePartyLocation(raw);
  if (!parsed) return null;
  if (parsed.kind === 'map') {
    return `Karte (${parsed.position.x}, ${parsed.position.y})`;
  }
  return parsed.label;
}
