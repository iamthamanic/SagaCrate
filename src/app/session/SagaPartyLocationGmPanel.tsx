/**
 * SagaPartyLocationGmPanel — GM sets party location via set_party_location (#581).
 * Location: src/app/session/SagaPartyLocationGmPanel.tsx
 *
 * Adaptive: label or map coords → one primary confirm. AU: min-h-11.
 */
import { useEffect, useRef, useState } from 'react';
import type { LiveSessionAccess } from '../../domains/session/contracts/live-session-access';
import {
  formatPartyMapLocation,
  partyLocationDisplayLabel,
  parsePartyLocation,
} from '../../domains/session/contracts/party-location';
import { upgradeAdventureRuntimeV1toV2 } from '../../domains/session/contracts/adventure-runtime-state';
import { Button } from '../../shared/ui/button';
import { Label } from '../../shared/ui/label';
import { useAdventureRuntime } from './hooks/useAdventureRuntime';

type Props = {
  sessionId: string | null;
  access: LiveSessionAccess | null;
};

export function SagaPartyLocationGmPanel({ sessionId, access }: Props) {
  const adventure = useAdventureRuntime({ sessionId, access });
  const v2 = upgradeAdventureRuntimeV1toV2(adventure.state);
  const [label, setLabel] = useState('');
  const [mapX, setMapX] = useState(0);
  const [mapY, setMapY] = useState(0);
  const [mode, setMode] = useState<'label' | 'map'>('label');
  const [note, setNote] = useState<string | null>(null);
  const seeded = useRef(false);
  const disabled = adventure.isBusy || access?.role !== 'gamemaster';

  useEffect(() => {
    if (seeded.current) return;
    const parsed = parsePartyLocation(v2.partyLocationRef);
    if (!parsed) return;
    seeded.current = true;
    if (parsed.kind === 'map') {
      setMode('map');
      setMapX(parsed.position.x);
      setMapY(parsed.position.y);
    } else {
      setMode('label');
      setLabel(parsed.label);
    }
  }, [v2.partyLocationRef]);

  const currentLabel = partyLocationDisplayLabel(v2.partyLocationRef);

  const apply = async (locationRef: string) => {
    setNote(null);
    const ok = await adventure.run({ op: 'set_party_location', locationRef });
    setNote(ok ? 'Position gespeichert.' : adventure.error ?? 'Speichern fehlgeschlagen');
  };

  return (
    <div
      className="space-y-3 rounded-md border border-border/70 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      data-saga-party-location-gm="v1"
      data-au-surface="journey"
    >
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-foreground">Gruppenposition</h3>
        <p className="text-xs text-muted-foreground" data-saga-party-location-current>
          {currentLabel ? `Ihr seid hier: ${currentLabel}` : 'Noch keine Position gesetzt'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={mode === 'label' ? 'default' : 'outline'}
          className="min-h-11"
          disabled={disabled}
          onClick={() => setMode('label')}
          data-saga-party-mode-label
        >
          Ortstext
        </Button>
        <Button
          type="button"
          variant={mode === 'map' ? 'default' : 'outline'}
          className="min-h-11"
          disabled={disabled}
          onClick={() => setMode('map')}
          data-saga-party-mode-map
        >
          Kartenkoordinaten
        </Button>
      </div>

      {mode === 'label' ? (
        <div className="space-y-1">
          <Label htmlFor="saga-party-label">Ort</Label>
          <input
            id="saga-party-label"
            className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={label}
            disabled={disabled}
            maxLength={80}
            placeholder="z. B. Tor von Dornhain"
            onChange={(e) => setLabel(e.target.value)}
            data-saga-party-label
          />
          <Button
            type="button"
            className="min-h-11"
            disabled={disabled || !label.trim()}
            onClick={() => void apply(label.trim())}
            data-saga-party-set-label
          >
            Position setzen
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor="saga-party-x">X</Label>
            <input
              id="saga-party-x"
              type="number"
              min={0}
              max={99}
              className="flex h-11 w-20 rounded-md border border-input bg-background px-2 text-sm"
              value={mapX}
              disabled={disabled}
              onChange={(e) => setMapX(Math.max(0, Math.min(99, Math.floor(Number(e.target.value) || 0))))}
              data-saga-party-x
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="saga-party-y">Y</Label>
            <input
              id="saga-party-y"
              type="number"
              min={0}
              max={99}
              className="flex h-11 w-20 rounded-md border border-input bg-background px-2 text-sm"
              value={mapY}
              disabled={disabled}
              onChange={(e) => setMapY(Math.max(0, Math.min(99, Math.floor(Number(e.target.value) || 0))))}
              data-saga-party-y
            />
          </div>
          <Button
            type="button"
            className="min-h-11"
            disabled={disabled}
            onClick={() => void apply(formatPartyMapLocation(mapX, mapY))}
            data-saga-party-set-map
          >
            Auf Karte setzen
          </Button>
        </div>
      )}

      {note || adventure.error ? (
        <p
          className={`text-xs ${adventure.error && !note?.includes('gespeichert') ? 'text-destructive' : 'text-muted-foreground'}`}
          role="status"
        >
          {note ?? adventure.error}
        </p>
      ) : null}
    </div>
  );
}
