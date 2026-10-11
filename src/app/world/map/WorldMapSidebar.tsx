/**
 * WorldMapSidebar — Pin list + stats (#580).
 * Location: src/app/world/map/WorldMapSidebar.tsx
 */
import { Button } from '../../../shared/ui/button';
import { PIN_COLOR_CYAN, type WorldMapData } from '../../../domains/world/map';

type Props = {
  data: WorldMapData;
  onSelectPin: (pinId: string) => void;
  onRemovePin: (pinId: string) => void;
  readOnly?: boolean;
};

export function WorldMapSidebar({ data, onSelectPin, onRemovePin, readOnly }: Props) {
  const painted = Object.keys(data.tiles).length;
  return (
    <aside
      className="flex w-full flex-col gap-3 sm:max-w-xs"
      data-world-map-sidebar
    >
      <div className="text-sm text-muted-foreground">
        {data.size}×{data.size} · {painted} bemalte Felder · {data.pins.length} Pins
      </div>
      <p className="text-xs text-muted-foreground">
        Pins in Markenfarben (Cyan/Gold). Rot nur für Löschen.
      </p>
      <ul className="max-h-64 space-y-2 overflow-y-auto">
        {data.pins.length === 0 ? (
          <li className="text-sm text-muted-foreground">Noch keine Pins.</li>
        ) : (
          data.pins.map((pin) => (
            <li
              key={pin.id}
              className="flex items-center justify-between gap-2 rounded border border-border/50 px-2 py-1.5"
              data-world-map-pin-row={pin.id}
            >
              <button
                type="button"
                className="min-h-11 flex-1 text-left text-sm"
                style={{ color: PIN_COLOR_CYAN }}
                onClick={() => onSelectPin(pin.id)}
              >
                {pin.title}{' '}
                <span className="text-muted-foreground">
                  ({pin.x},{pin.y})
                </span>
              </button>
              {!readOnly ? (
                <Button
                  type="button"
                  variant="destructive"
                  className="min-h-11"
                  onClick={() => onRemovePin(pin.id)}
                >
                  Löschen
                </Button>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </aside>
  );
}
