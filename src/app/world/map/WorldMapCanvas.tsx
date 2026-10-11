/**
 * WorldMapCanvas — Canvas 2D tile grid with pointer events (#580 / #581).
 * Location: src/app/world/map/WorldMapCanvas.tsx
 *
 * Party marker (#581) is runtime overlay — not stored in world_maps.
 */
import { useEffect, useRef } from 'react';
import {
  BASE_TILE_PX,
  PARTY_MARKER_COLOR,
  PARTY_MARKER_RING,
  PIN_COLOR_CYAN,
  PIN_COLOR_GOLD,
  tileKey,
  type WorldMapData,
  type WorldMapTool,
} from '../../../domains/world/map';
import type { PartyMapPosition } from '../../../domains/session/contracts/party-location';

const FILL: Record<string, string> = {
  grass: '#4ade80',
  forest: '#166534',
  water: '#38bdf8',
  mountain: '#78716c',
  road: '#a8a29e',
  city: '#fbbf24',
  empty: '#1e293b',
};

type Props = {
  data: WorldMapData;
  zoom: number;
  tool: WorldMapTool;
  partyPosition?: PartyMapPosition | null;
  onPaint: (x: number, y: number) => void;
  onPinPlace: (x: number, y: number) => void;
  onPartyPlace?: (x: number, y: number) => void;
};

export function WorldMapCanvas({
  data,
  zoom,
  tool,
  partyPosition = null,
  onPaint,
  onPinPlace,
  onPartyPlace,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const painting = useRef(false);
  const draggingParty = useRef(false);
  const tilePx = BASE_TILE_PX * zoom;
  const px = Math.floor(data.size * tilePx);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = px;
    canvas.height = px;
    ctx.fillStyle = FILL.empty;
    ctx.fillRect(0, 0, px, px);
    for (let y = 0; y < data.size; y += 1) {
      for (let x = 0; x < data.size; x += 1) {
        const tile = data.tiles[tileKey(x, y)];
        ctx.fillStyle = FILL[tile?.type ?? 'empty'] ?? FILL.empty;
        ctx.fillRect(x * tilePx, y * tilePx, tilePx + 0.5, tilePx + 0.5);
      }
    }
    ctx.strokeStyle = 'rgba(15,23,42,0.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= data.size; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * tilePx, 0);
      ctx.lineTo(i * tilePx, px);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * tilePx);
      ctx.lineTo(px, i * tilePx);
      ctx.stroke();
    }
    data.pins.forEach((pin, index) => {
      const cx = pin.x * tilePx + tilePx / 2;
      const cy = pin.y * tilePx + tilePx / 2;
      ctx.beginPath();
      ctx.fillStyle = index % 2 === 0 ? PIN_COLOR_CYAN : PIN_COLOR_GOLD;
      ctx.arc(cx, cy, Math.max(4, tilePx * 0.22), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();
    });
    if (
      partyPosition
      && partyPosition.x >= 0
      && partyPosition.y >= 0
      && partyPosition.x < data.size
      && partyPosition.y < data.size
    ) {
      const cx = partyPosition.x * tilePx + tilePx / 2;
      const cy = partyPosition.y * tilePx + tilePx / 2;
      const r = Math.max(8, tilePx * 0.42);
      ctx.beginPath();
      ctx.fillStyle = PARTY_MARKER_COLOR;
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = PARTY_MARKER_RING;
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();
      ctx.fillStyle = PARTY_MARKER_RING;
      ctx.font = `600 ${Math.max(10, Math.floor(tilePx * 0.35))}px system-ui,sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('Ihr seid hier', cx, cy - r - 2);
    }
  }, [data, partyPosition, px, tilePx]);

  const coordsFromEvent = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((clientX - rect.left) / rect.width) * data.size);
    const y = Math.floor(((clientY - rect.top) / rect.height) * data.size);
    if (x < 0 || y < 0 || x >= data.size || y >= data.size) return null;
    return { x, y };
  };

  return (
    <div
      className="max-h-[min(70vh,36rem)] overflow-auto rounded-md border border-border/70 bg-slate-950"
      data-world-map-canvas
    >
      <canvas
        ref={canvasRef}
        className="touch-none"
        style={{ width: px, height: px, maxWidth: '100%' }}
        onPointerDown={(e) => {
          if (tool === 'pan') return;
          canvasRef.current?.setPointerCapture(e.pointerId);
          const c = coordsFromEvent(e.clientX, e.clientY);
          if (!c) return;
          if (tool === 'party') {
            draggingParty.current = true;
            onPartyPlace?.(c.x, c.y);
            return;
          }
          if (tool === 'pin') {
            onPinPlace(c.x, c.y);
            return;
          }
          painting.current = true;
          onPaint(c.x, c.y);
        }}
        onPointerMove={(e) => {
          if (tool === 'party' && draggingParty.current) {
            const c = coordsFromEvent(e.clientX, e.clientY);
            if (c) onPartyPlace?.(c.x, c.y);
            return;
          }
          if (!painting.current || tool === 'pin' || tool === 'pan') return;
          const c = coordsFromEvent(e.clientX, e.clientY);
          if (c) onPaint(c.x, c.y);
        }}
        onPointerUp={() => {
          painting.current = false;
          draggingParty.current = false;
        }}
        onPointerCancel={() => {
          painting.current = false;
          draggingParty.current = false;
        }}
      />
    </div>
  );
}
