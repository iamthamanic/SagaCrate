/**
 * SagaEditorDeadlinesSection — Deadline templates for simulation (#579).
 * Location: src/app/saga/editor/SagaEditorDeadlinesSection.tsx
 */
import { Button } from '../../../shared/ui/button';
import { Input } from '../../../shared/ui/input';
import { Label } from '../../../shared/ui/label';
import type {
  SagaDefinitionDraft,
  SagaDefinitionSimulationSlice,
} from '../../../domains/saga/contracts/saga-definition';

type Deadline = SagaDefinitionSimulationSlice['deadlines'][number];

type Props = {
  readonly draft: SagaDefinitionDraft;
  readonly readOnly: boolean;
  readonly onChange: (simulation: SagaDefinitionSimulationSlice) => void;
};

function newId(): string {
  return `dl.${Date.now().toString(36)}`;
}

export function SagaEditorDeadlinesSection({ draft, readOnly, onChange }: Props) {
  const deadlines = draft.simulation.deadlines;
  const setDeadlines = (next: Deadline[]) => {
    onChange({ ...draft.simulation, deadlines: next });
  };
  const updateAt = (index: number, patch: Partial<Deadline>) => {
    setDeadlines(deadlines.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  };

  return (
    <section className="flex flex-col gap-4" data-saga-editor-section="deadlines">
      <p className="text-sm text-muted-foreground">
        Frist-Vorlagen — fällig an Welt-Tag, mit spoilerfreien Spielertexten.
      </p>
      <ul className="flex flex-col gap-4">
        {deadlines.map((d, index) => (
          <li
            key={d.id}
            className="flex flex-col gap-2 rounded-md border border-border/50 p-3"
            data-saga-editor-deadline={d.id}
          >
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor={`dl-label-${d.id}`}>Name</Label>
                <Input
                  id={`dl-label-${d.id}`}
                  className="min-h-11"
                  value={d.label}
                  disabled={readOnly}
                  onChange={(e) => updateAt(index, { label: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`dl-due-${d.id}`}>Fällig Tag</Label>
                <Input
                  id={`dl-due-${d.id}`}
                  type="number"
                  min={0}
                  className="min-h-11"
                  value={d.dueDay}
                  disabled={readOnly}
                  onChange={(e) =>
                    updateAt(index, {
                      dueDay: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                    })
                  }
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor={`dl-sp-${d.id}`}>Text Spieler</Label>
                <Input
                  id={`dl-sp-${d.id}`}
                  className="min-h-11"
                  value={d.summaryPlayer}
                  disabled={readOnly}
                  onChange={(e) => updateAt(index, { summaryPlayer: e.target.value })}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor={`dl-sg-${d.id}`}>Text SL</Label>
                <Input
                  id={`dl-sg-${d.id}`}
                  className="min-h-11"
                  value={d.summaryGm}
                  disabled={readOnly}
                  onChange={(e) => updateAt(index, { summaryGm: e.target.value })}
                />
              </div>
            </div>
            {!readOnly ? (
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={() => setDeadlines(deadlines.filter((_, i) => i !== index))}
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
          data-saga-editor-add-deadline
          onClick={() =>
            setDeadlines([
              ...deadlines,
              {
                id: newId(),
                label: 'Neue Frist',
                dueDay: 3,
                visibility: 'public',
                summaryPlayer: '',
                summaryGm: '',
              },
            ])
          }
        >
          Frist hinzufügen
        </Button>
      ) : null}
    </section>
  );
}
