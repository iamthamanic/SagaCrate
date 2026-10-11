/**
 * GoldenAdventureDornhainPanel — Instantiate Dornhain Golden Package into session (#377 / #574).
 * Location: src/app/session/GoldenAdventureDornhainPanel.tsx
 *
 * Package metadata/secrets load from server (native saga definition); instantiate via runtime ops.
 */
import { useEffect, useState } from 'react';
import type { LiveSessionAccess } from '../../domains/session/contracts/live-session-access';
import {
  dornhainInstantiateCommands,
  GOLDEN_ADVENTURE_DORNHAIN_PACKAGE_ID,
} from '../../domains/session/contracts/golden-adventure-dornhain';
import type { SagaDefinitionVersionVm } from '../../domains/saga/contracts/saga-definition';
import { sagaDefinitionService } from '../../infrastructure/saga/saga-definition-service';
import { Button } from '../../shared/ui/button';
import { useAdventureRuntime } from './hooks/useAdventureRuntime';

type GoldenAdventureDornhainPanelProps = {
  sessionId: string | null;
  access: LiveSessionAccess | null;
};

export function GoldenAdventureDornhainPanel({
  sessionId,
  access,
}: GoldenAdventureDornhainPanelProps) {
  const adventure = useAdventureRuntime({ sessionId, access });
  const [stress, setStress] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [definition, setDefinition] = useState<SagaDefinitionVersionVm | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const def = await sagaDefinitionService.getNativeBySlug('dornhain.whisper');
        if (cancelled) return;
        setDefinition(def);
        setLoadError(null);
      } catch (err) {
        if (cancelled) return;
        setLoadError(
          err instanceof Error
            ? err.message
            : 'Dornhain-Definition konnte nicht vom Server geladen werden',
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const title = definition?.title ?? 'Das Flüstern unter Dornhain';
  const synopsis = definition?.synopsis ?? definition?.payload.synopsis ?? '';
  const packageId =
    definition?.payload.packageId ?? GOLDEN_ADVENTURE_DORNHAIN_PACKAGE_ID;
  const locationCount = definition?.payload.locations.length ?? 0;
  const factCount = definition?.payload.knowledgeFacts.length ?? 0;

  const instantiate = async () => {
    try {
      const cmds = dornhainInstantiateCommands({ stressDeathStart: stress });
      for (const cmd of cmds) {
        const ok = await adventure.run(cmd);
        if (!ok) {
          setMessage(adventure.error ?? 'Instantiate fehlgeschlagen');
          return;
        }
      }
      setMessage(`Dornhain geladen · ${packageId}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Package ungültig');
    }
  };

  return (
    <div
      className="space-y-2 rounded-md border border-border/70 p-3"
      data-golden-adventure-dornhain="v1"
      data-dornhain-source="server"
    >
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="text-xs text-muted-foreground">{synopsis}</p>
      <p className="text-xs text-muted-foreground" data-dornhain-package-id>
        {packageId}
        {definition ? ` · Fassung ${definition.versionLabel}` : ''}
      </p>
      {loadError ? (
        <p className="text-xs text-destructive" role="alert" data-dornhain-load-error>
          {loadError}
        </p>
      ) : null}
      <ul className="text-xs text-muted-foreground">
        <li>{locationCount} Orte (freie Reihenfolge)</li>
        <li>{factCount} Knowledge-Facts (rollengefiltert)</li>
        <li>Items: Siegelstein-Narrativ, Consumable, Equippable</li>
      </ul>
      <label className="flex min-h-11 items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={stress}
          data-dornhain-stress
          onChange={(e) => setStress(e.target.checked)}
        />
        Developer Stress: Death-Start
      </label>
      <Button
        type="button"
        size="sm"
        className="min-h-11"
        disabled={adventure.isBusy || access?.role !== 'gamemaster' || !definition}
        data-dornhain-instantiate
        onClick={() => void instantiate()}
      >
        Dornhain in Session laden
      </Button>
      {message ? (
        <p className="text-xs text-muted-foreground" data-dornhain-message>
          {message}
        </p>
      ) : null}
    </div>
  );
}
