/**
 * SagaEditorPregensSection — Pregen refs from prepared adventure catalog (#575).
 * Location: src/app/saga/editor/SagaEditorPregensSection.tsx
 */
import { Button } from '../../../shared/ui/button';
import { Label } from '../../../shared/ui/label';
import type { SagaDefinitionDraft, SagaPregenRef } from '../../../domains/saga/contracts/saga-definition';
import { listPreparedAdventurePregens } from '../../../domains/session/contracts/prepared-adventure-fixture';

type Props = {
  readonly draft: SagaDefinitionDraft;
  readonly readOnly: boolean;
  readonly onChange: (pregens: SagaPregenRef[]) => void;
};

export function SagaEditorPregensSection({ draft, readOnly, onChange }: Props) {
  const catalog = listPreparedAdventurePregens();
  const selected = new Set(draft.pregens.map((p) => p.id));

  const toggle = (id: string, displayName: string) => {
    if (readOnly) return;
    if (selected.has(id)) {
      onChange(draft.pregens.filter((p) => p.id !== id));
      return;
    }
    onChange([...draft.pregens, { id, displayName }]);
  };

  return (
    <section className="flex flex-col gap-4" data-saga-editor-section="pregens">
      <p className="text-sm text-muted-foreground">
        Vorgefertigte Charaktere als Referenzen (keine vollständige Charakter-Erstellung).
      </p>
      <ul className="flex flex-col gap-2">
        {catalog.map((pregen) => {
          const active = selected.has(pregen.id);
          return (
            <li key={pregen.id}>
              <Label className="sr-only" htmlFor={`saga-pregen-${pregen.id}`}>
                {pregen.displayName}
              </Label>
              <Button
                id={`saga-pregen-${pregen.id}`}
                type="button"
                variant={active ? 'default' : 'outline'}
                className="min-h-11 w-full justify-start"
                disabled={readOnly}
                aria-pressed={active}
                onClick={() => toggle(pregen.id, pregen.displayName)}
                data-saga-editor-pregen={pregen.id}
              >
                <span className="text-left">
                  {pregen.displayName}
                  <span className="ml-2 text-xs opacity-80">
                    {pregen.classLabel} · Stufe {pregen.level}
                  </span>
                </span>
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
