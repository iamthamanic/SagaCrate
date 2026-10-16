/**
 * WorldMapToolbar — Tools, size, zoom, save for map editor (#580).
 * Location: src/app/world/map/WorldMapToolbar.tsx
 */
import { Button } from '../../../shared/ui/button';
import { Label } from '../../../shared/ui/label';
import type { WorldMapTileType, WorldMapTool } from '../../../domains/world/map';

const TOOLS: { id: WorldMapTool; label: string }[] = [
  { id: 'brush', label: 'Pinsel' },
  { id: 'eraser', label: 'Radierer' },
  { id: 'pin', label: 'Pin' },
  { id: 'pan', label: 'Verschieben' },
];

const BRUSHES: { id: WorldMapTileType; label: string }[] = [
  { id: 'grass', label: 'Gras' },
  { id: 'forest', label: 'Wald' },
  { id: 'water', label: 'Wasser' },
  { id: 'mountain', label: 'Berg' },
  { id: 'road', label: 'Weg' },
  { id: 'city', label: 'Ort' },
];

type Props = {
  tool: WorldMapTool;
  brushType: WorldMapTileType;
  size: number;
  maxSize: number;
  zoom: number;
  isSaving: boolean;
  isDirty: boolean;
  onTool: (t: WorldMapTool) => void;
  onBrush: (t: WorldMapTileType) => void;
  onSize: (n: number) => void;
  onZoom: (n: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
};

export function WorldMapToolbar({
  tool,
  brushType,
  size,
  maxSize,
  zoom,
  isSaving,
  isDirty,
  onTool,
  onBrush,
  onSize,
  onZoom,
  onUndo,
  onRedo,
  onSave,
}: Props) {
  return (
    <div
      className="flex flex-col gap-3 border-b border-border/60 pb-3"
      data-world-map-toolbar
    >
      <div className="flex flex-wrap gap-2">
        {TOOLS.map((t) => (
          <Button
            key={t.id}
            type="button"
            variant={tool === t.id ? 'default' : 'outline'}
            className="min-h-11"
            data-world-map-tool={t.id}
            onClick={() => onTool(t.id)}
          >
            {t.label}
          </Button>
        ))}
      </div>
      {tool === 'brush' ? (
        <div className="flex flex-wrap gap-2">
          {BRUSHES.map((b) => (
            <Button
              key={b.id}
              type="button"
              variant={brushType === b.id ? 'secondary' : 'outline'}
              className="min-h-11"
              data-world-map-brush={b.id}
              onClick={() => onBrush(b.id)}
            >
              {b.label}
            </Button>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap items-end gap-3">
        <Button
          type="button"
          variant="secondary"
          className="min-h-11"
          disabled={size >= maxSize}
          data-world-map-expand
          onClick={() => onSize(Math.min(maxSize, size + 4))}
        >
          Karte erweitern (+4)
        </Button>
        <div className="space-y-1">
          <Label htmlFor="world-map-size">Größe (max {maxSize})</Label>
          <input
            id="world-map-size"
            type="number"
            min={1}
            max={maxSize}
            className="flex h-11 w-20 rounded-md border border-input bg-background px-2 text-sm"
            value={size}
            onChange={(e) => onSize(Number(e.target.value))}
            data-world-map-size
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="world-map-zoom">Zoom</Label>
          <input
            id="world-map-zoom"
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            className="h-11 w-32"
            value={zoom}
            onChange={(e) => onZoom(Number(e.target.value))}
            data-world-map-zoom
          />
        </div>
        <Button type="button" variant="outline" className="min-h-11" onClick={onUndo}>
          Rückgängig
        </Button>
        <Button type="button" variant="outline" className="min-h-11" onClick={onRedo}>
          Wiederholen
        </Button>
        <Button
          type="button"
          className="min-h-11 min-w-[8rem]"
          disabled={isSaving}
          onClick={onSave}
          data-world-map-save
        >
          {isSaving ? 'Speichert…' : isDirty ? 'Speichern' : 'Gespeichert'}
        </Button>
      </div>
    </div>
  );
}
