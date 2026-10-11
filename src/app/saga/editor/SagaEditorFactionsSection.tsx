/**
 * SagaEditorFactionsSection — Faction clock + relationship templates (#579).
 * Location: src/app/saga/editor/SagaEditorFactionsSection.tsx
 */
import { Button } from '../../../shared/ui/button';
import { Input } from '../../../shared/ui/input';
import { Label } from '../../../shared/ui/label';
import type {
  SagaDefinitionDraft,
  SagaDefinitionFactionTemplate,
  SagaDefinitionSimulationSlice,
} from '../../../domains/saga/contracts/saga-definition';

type Props = {
  readonly draft: SagaDefinitionDraft;
  readonly readOnly: boolean;
  readonly onChange: (simulation: SagaDefinitionSimulationSlice) => void;
};

function newId(): string {
  return `faction.${Date.now().toString(36)}`;
}

export function SagaEditorFactionsSection({ draft, readOnly, onChange }: Props) {
  const factions = draft.simulation.factions;
  const setFactions = (next: SagaDefinitionFactionTemplate[]) => {
    onChange({ ...draft.simulation, factions: next });
  };
  const updateAt = (index: number, patch: Partial<SagaDefinitionFactionTemplate>) => {
    setFactions(factions.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  return (
    <section className="flex flex-col gap-4" data-saga-editor-section="factions">
      <p className="text-sm text-muted-foreground">
        Fraktionen mit Uhr und Beziehungs-Label — Daten für den Simulationskern.
      </p>
      <ul className="flex flex-col gap-4">
        {factions.map((f, index) => (
          <li
            key={f.id}
            className="flex flex-col gap-2 rounded-md border border-border/50 p-3"
            data-saga-editor-faction={f.id}
          >
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor={`fac-label-${f.id}`}>Fraktion</Label>
                <Input
                  id={`fac-label-${f.id}`}
                  className="min-h-11"
                  value={f.label}
                  disabled={readOnly}
                  onChange={(e) => updateAt(index, { label: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`fac-clock-${f.id}`}>Uhr-Label</Label>
                <Input
                  id={`fac-clock-${f.id}`}
                  className="min-h-11"
                  value={f.clockLabel}
                  disabled={readOnly}
                  onChange={(e) => updateAt(index, { clockLabel: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`fac-max-${f.id}`}>Uhr max</Label>
                <Input
                  id={`fac-max-${f.id}`}
                  type="number"
                  min={1}
                  className="min-h-11"
                  value={f.clockMax}
                  disabled={readOnly}
                  onChange={(e) =>
                    updateAt(index, {
                      clockMax: Math.max(1, Math.floor(Number(e.target.value) || 1)),
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`fac-rel-${f.id}`}>Beziehung</Label>
                <Input
                  id={`fac-rel-${f.id}`}
                  className="min-h-11"
                  value={f.relationshipLabel}
                  disabled={readOnly}
                  onChange={(e) => updateAt(index, { relationshipLabel: e.target.value })}
                />
              </div>
            </div>
            {!readOnly ? (
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={() => setFactions(factions.filter((_, i) => i !== index))}
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
          data-saga-editor-add-faction
          onClick={() =>
            setFactions([
              ...factions,
              {
                id: newId(),
                label: 'Neue Fraktion',
                clockLabel: 'Spannung',
                clockMax: 4,
                relationshipLabel: 'Vertrauen',
                visibility: 'shared',
              },
            ])
          }
        >
          Fraktion hinzufügen
        </Button>
      ) : null}
    </section>
  );
}
