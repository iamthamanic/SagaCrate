/**
 * WorldMapPlayerView — Read-only map + party marker (#580 / #581).
 * Location: src/app/world/map/WorldMapPlayerView.tsx
 *
 * GM may place party via tool=party; players stay pan-only.
 */
import { useEffect, useRef, useState } from 'react';
import { WorldMapCanvas } from './WorldMapCanvas';
import { WorldMapSidebar } from './WorldMapSidebar';
import {
  DEFAULT_MAP_SIZE,
  emptyWorldMapData,
  type WorldMapData,
} from '../../../domains/world/map';
import {
  formatPartyMapLocation,
  parsePartyLocation,
  partyLocationDisplayLabel,
  type PartyMapPosition,
} from '../../../domains/session/contracts/party-location';
import { worldMapService } from '../../../infrastructure/world/world-map-service';
import { Button } from '../../../shared/ui/button';

type Props = {
  worldProfileId: string;
  partyLocationRef?: string | null;
  /** When true, GM can drop/drag the party marker (optimistic local + confirm callback). */
  canMoveParty?: boolean;
  onPartyLocationChange?: (locationRef: string) => void | Promise<void>;
};

export function WorldMapPlayerView({
  worldProfileId,
  partyLocationRef = null,
  canMoveParty = false,
  onPartyLocationChange,
}: Props) {
  const [data, setData] = useState<WorldMapData>(() => emptyWorldMapData(DEFAULT_MAP_SIZE));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [localParty, setLocalParty] = useState<PartyMapPosition | null>(null);
  const [placing, setPlacing] = useState(false);
  const lastDrop = useRef<string | null>(null);

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

  useEffect(() => {
    const parsed = parsePartyLocation(partyLocationRef);
    if (parsed?.kind === 'map') {
      setLocalParty(parsed.position);
    } else if (!placing) {
      setLocalParty(null);
    }
  }, [partyLocationRef, placing]);

  const displayLabel = partyLocationDisplayLabel(partyLocationRef);
  const partyPos = localParty;

  return (
    <div
      className="flex flex-col gap-3 sm:flex-row"
      data-world-map-player-view
      data-au-surface="world-map-player"
    >
      <div className="min-w-0 flex-1 space-y-2">
        {loading ? (
          <p className="text-sm text-muted-foreground">Karte wird geladen…</p>
        ) : null}
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <p className="text-sm text-foreground" data-world-map-party-label>
          {displayLabel
            ? `Ihr seid hier: ${displayLabel}`
            : partyPos
              ? `Ihr seid hier: Karte (${partyPos.x}, ${partyPos.y})`
              : 'Noch keine Gruppenposition'}
        </p>
        {canMoveParty ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={placing ? 'default' : 'outline'}
              className="min-h-11"
              data-world-map-party-place-toggle
              onClick={() => setPlacing((v) => !v)}
            >
              {placing ? 'Platzieren aktiv' : 'Gruppe platzieren'}
            </Button>
          </div>
        ) : null}
        <WorldMapCanvas
          data={data}
          zoom={1}
          tool={canMoveParty && placing ? 'party' : 'pan'}
          partyPosition={partyPos}
          onPaint={() => undefined}
          onPinPlace={() => undefined}
          onPartyPlace={(x, y) => {
            if (!canMoveParty || !placing) return;
            setLocalParty({ x, y });
            const ref = formatPartyMapLocation(x, y);
            lastDrop.current = ref;
            void Promise.resolve(onPartyLocationChange?.(ref));
          }}
        />
      </div>
      <WorldMapSidebar
        data={data}
        readOnly
        onSelectPin={() => undefined}
        onRemovePin={() => undefined}
      />
    </div>
  );
}
