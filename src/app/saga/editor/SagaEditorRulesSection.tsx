/**
 * SagaEditorRulesSection — when/then rule templates (#579).
 * Location: src/app/saga/editor/SagaEditorRulesSection.tsx
 */
import { Button } from '../../../shared/ui/button';
import { Input } from '../../../shared/ui/input';
import { Label } from '../../../shared/ui/label';
import type {
  SagaDefinitionDraft,
  SagaDefinitionSimulationSlice,
} from '../../../domains/saga/contracts/saga-definition';

type Rule = SagaDefinitionSimulationSlice['rules'][number];

type Props = {
  readonly draft: SagaDefinitionDraft;
  readonly readOnly: boolean;
  readonly onChange: (simulation: SagaDefinitionSimulationSlice) => void;
  readonly fieldError?: string;
};

const WHEN_KINDS = ['flag', 'threat-at-least', 'day-at-least'] as const;
const THEN_KINDS = ['tick-threat', 'set-flag', 'emit-event'] as const;

function newId(): string {
  return `rule.${Date.now().toString(36)}`;
}

export function SagaEditorRulesSection({ draft, readOnly, onChange, fieldError }: Props) {
  const rules = draft.simulation.rules;
  const setRules = (next: Rule[]) => {
    onChange({ ...draft.simulation, rules: next });
  };
  const updateAt = (index: number, patch: Partial<Rule>) => {
    setRules(rules.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  return (
    <section className="flex flex-col gap-4" data-saga-editor-section="rules">
      <p className="text-sm text-muted-foreground">
        Wenn-dann-Regeln — minimale DSL (keine freie Programmiersprache).
      </p>
      {fieldError ? (
        <p className="text-sm text-destructive" role="alert" data-saga-editor-rules-error>
          {fieldError}
        </p>
      ) : null}
      <ul className="flex flex-col gap-4">
        {rules.map((r, index) => (
          <li
            key={r.id}
            className="flex flex-col gap-2 rounded-md border border-border/50 p-3"
            data-saga-editor-rule={r.id}
          >
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor={`rule-label-${r.id}`}>Label</Label>
                <Input
                  id={`rule-label-${r.id}`}
                  className="min-h-11"
                  value={r.label}
                  disabled={readOnly}
                  onChange={(e) => updateAt(index, { label: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`rule-when-${r.id}`}>Wenn</Label>
                <select
                  id={`rule-when-${r.id}`}
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={r.whenKind}
                  disabled={readOnly}
                  onChange={(e) => updateAt(index, { whenKind: e.target.value })}
                >
                  {WHEN_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor={`rule-threat-${r.id}`}>Bedrohungs-ID</Label>
                <Input
                  id={`rule-threat-${r.id}`}
                  className="min-h-11"
                  value={r.whenThreatId}
                  disabled={readOnly || r.whenKind !== 'threat-at-least'}
                  placeholder="z. B. danger"
                  onChange={(e) => updateAt(index, { whenThreatId: e.target.value })}
                  list={`threat-ids-${draft.sagaId}`}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Dann (Effekte)</Label>
                <div className="flex flex-wrap gap-2">
                  {THEN_KINDS.map((kind) => {
                    const on = r.thenKinds.includes(kind);
                    return (
                      <Button
                        key={kind}
                        type="button"
                        variant={on ? 'default' : 'outline'}
                        className="min-h-11"
                        disabled={readOnly}
                        onClick={() => {
                          const next = on
                            ? r.thenKinds.filter((k) => k !== kind)
                            : [...r.thenKinds, kind];
                          updateAt(index, { thenKinds: next });
                        }}
                      >
                        {kind}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
            {!readOnly ? (
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={() => setRules(rules.filter((_, i) => i !== index))}
              >
                Entfernen
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
      <datalist id={`threat-ids-${draft.sagaId}`}>
        {draft.simulation.threats.map((t) => (
          <option key={t.id} value={t.id} />
        ))}
      </datalist>
      {!readOnly ? (
        <Button
          type="button"
          variant="secondary"
          className="min-h-11 w-full sm:w-auto"
          data-saga-editor-add-rule
          onClick={() =>
            setRules([
              ...rules,
              {
                id: newId(),
                label: 'Neue Regel',
                whenKind: 'day-at-least',
                whenThreatId: '',
                thenKinds: ['emit-event'],
              },
            ])
          }
        >
          Regel hinzufügen
        </Button>
      ) : null}
    </section>
  );
}
