/**
 * SagaEditorThreatsSection — Threat templates for simulation (#579).
 * Location: src/app/saga/editor/SagaEditorThreatsSection.tsx
 */
import { Button } from '../../../shared/ui/button';
import { Input } from '../../../shared/ui/input';
import { Label } from '../../../shared/ui/label';
import type {
  SagaDefinitionDraft,
  SagaDefinitionSimulationSlice,
} from '../../../domains/saga/contracts/saga-definition';

type Threat = SagaDefinitionSimulationSlice['threats'][number];

type Props = {
  readonly draft: SagaDefinitionDraft;
  readonly readOnly: boolean;
  readonly onChange: (simulation: SagaDefinitionSimulationSlice) => void;
};

function newId(): string {
  return `threat.${Date.now().toString(36)}`;
}

export function SagaEditorThreatsSection({ draft, readOnly, onChange }: Props) {
  const threats = draft.simulation.threats;
  const setThreats = (next: Threat[]) => {
    onChange({ ...draft.simulation, threats: next });
  };
  const updateAt = (index: number, patch: Partial<Threat>) => {
    setThreats(threats.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  };

  return (
    <section className="flex flex-col gap-4" data-saga-editor-section="threats">
      <p className="text-sm text-muted-foreground">
        Bedrohungen mit Stufen (0…max) und Doom-Texten für Spieler und Gamemaster.
      </p>
      <ul className="flex flex-col gap-4">
        {threats.map((t, index) => (
          <li
            key={t.id}
            className="flex flex-col gap-2 rounded-md border border-border/50 p-3"
            data-saga-editor-threat={t.id}
          >
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor={`threat-label-${t.id}`}>Name</Label>
                <Input
                  id={`threat-label-${t.id}`}
                  className="min-h-11"
                  value={t.label}
                  disabled={readOnly}
                  onChange={(e) => updateAt(index, { label: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`threat-max-${t.id}`}>Max. Stufe</Label>
                <Input
                  id={`threat-max-${t.id}`}
                  type="number"
                  min={1}
                  max={20}
                  className="min-h-11"
                  value={t.max}
                  disabled={readOnly}
                  onChange={(e) =>
                    updateAt(index, {
                      max: Math.max(1, Math.floor(Number(e.target.value) || 1)),
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`threat-tick-${t.id}`}>Tick / Tag</Label>
                <Input
                  id={`threat-tick-${t.id}`}
                  type="number"
                  min={0}
                  max={10}
                  className="min-h-11"
                  value={t.tickPerDay}
                  disabled={readOnly}
                  onChange={(e) =>
                    updateAt(index, {
                      tickPerDay: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`threat-vis-${t.id}`}>Sichtbarkeit</Label>
                <select
                  id={`threat-vis-${t.id}`}
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={t.visibility}
                  disabled={readOnly}
                  onChange={(e) => updateAt(index, { visibility: e.target.value })}
                >
                  <option value="public">public</option>
                  <option value="shared">shared</option>
                  <option value="gm_only">gm_only</option>
                </select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor={`threat-doom-p-${t.id}`}>Doom (Spieler)</Label>
                <Input
                  id={`threat-doom-p-${t.id}`}
                  className="min-h-11"
                  value={t.doomSummaryPlayer}
                  disabled={readOnly}
                  onChange={(e) => updateAt(index, { doomSummaryPlayer: e.target.value })}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor={`threat-doom-g-${t.id}`}>Doom (SL)</Label>
                <Input
                  id={`threat-doom-g-${t.id}`}
                  className="min-h-11"
                  value={t.doomSummaryGm}
                  disabled={readOnly}
                  onChange={(e) => updateAt(index, { doomSummaryGm: e.target.value })}
                />
              </div>
            </div>
            {!readOnly ? (
              <Button
                type="button"
                variant="outline"
                className="min-h-11 w-full sm:w-auto"
                onClick={() => setThreats(threats.filter((_, i) => i !== index))}
              >
                Entfernen
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
      {!readOnly ? (
        <Button
          type="button"
          variant="secondary"
          className="min-h-11 w-full sm:w-auto"
          data-saga-editor-add-threat
          onClick={() =>
            setThreats([
              ...threats,
              {
                id: newId(),
                label: 'Neue Bedrohung',
                max: 4,
                tickPerDay: 1,
                visibility: 'shared',
                doomSummaryPlayer: '',
                doomSummaryGm: '',
              },
            ])
          }
        >
          Bedrohung hinzufügen
        </Button>
      ) : null}
    </section>
  );
}
