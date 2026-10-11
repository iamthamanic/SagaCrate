/**
 * WorldMapPlayerView — Read-only discovered pins (#580).
 * Location: src/app/world/map/WorldMapPlayerView.tsx
 */
import { useEffect, useState } from 'react';
import { WorldMapCanvas } from './WorldMapCanvas';
import { WorldMapSidebar } from './WorldMapSidebar';
import {
  DEFAULT_MAP_SIZE,
  emptyWorldMapData,
  type WorldMapData,
} from '../../../domains/world/map';
import { worldMapService } from '../../../infrastructure/world/world-map-service';

type Props = {
  worldProfileId: string;
};

export function WorldMapPlayerView({ worldProfileId }: Props) {
  const [data, setData] = useState<WorldMapData>(() => emptyWorldMapData(DEFAULT_MAP_SIZE));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void worldMapService
      .getMap(worldProfileId, true)
      .then((vm) => {
        if (!cancelled) setData(vm.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Karte nicht verfügbar');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [worldProfileId]);

  return (
    <div
      className="flex flex-col gap-3 sm:flex-row"
      data-world-map-player-view
      data-au-surface="world-map-player"
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Karte wird geladen…</p>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <WorldMapCanvas
        data={data}
        zoom={1}
        tool="pan"
        onPaint={() => undefined}
        onPinPlace={() => undefined}
      />
      <WorldMapSidebar
        data={data}
        readOnly
        onSelectPin={() => undefined}
        onRemovePin={() => undefined}
      />
    </div>
  );
}
