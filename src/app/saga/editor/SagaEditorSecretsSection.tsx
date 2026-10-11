/**
 * SagaEditorSecretsSection — Knowledge facts with visibility (#575).
 * Location: src/app/saga/editor/SagaEditorSecretsSection.tsx
 */
import { Button } from '../../../shared/ui/button';
import { Label } from '../../../shared/ui/label';
import { Textarea } from '../../../shared/ui/textarea';
import type {
  SagaDefinitionDraft,
  SagaKnowledgeFact,
  SagaKnowledgeVisibility,
} from '../../../domains/saga/contracts/saga-definition';

const VISIBILITY_OPTIONS: readonly { value: SagaKnowledgeVisibility; label: string }[] = [
  { value: 'public', label: 'Öffentlich' },
  { value: 'discovered', label: 'Entdeckt' },
  { value: 'shared', label: 'Geteilt' },
  { value: 'gm_only', label: 'Nur SL' },
  { value: 'character_specific', label: 'Charakterbezogen' },
];

type Props = {
  readonly draft: SagaDefinitionDraft;
  readonly readOnly: boolean;
  readonly onChange: (facts: SagaKnowledgeFact[]) => void;
};

function newFactId(): string {
  return `fact.${Date.now().toString(36)}`;
}

export function SagaEditorSecretsSection({ draft, readOnly, onChange }: Props) {
  const updateAt = (index: number, patch: Partial<SagaKnowledgeFact>) => {
    onChange(
      draft.knowledgeFacts.map((fact, i) => (i === index ? { ...fact, ...patch } : fact)),
    );
  };

  return (
    <section className="flex flex-col gap-4" data-saga-editor-section="secrets">
      <p className="text-sm text-muted-foreground">
        Geheimnisse mit Sichtbarkeit. „Nur SL“ bleibt für Spieler ausgeblendet.
      </p>
      <ul className="flex flex-col gap-4">
        {draft.knowledgeFacts.map((fact, index) => (
          <li
            key={fact.id}
            className="flex flex-col gap-2 border-b border-border/40 pb-4 last:border-0"
          >
            <div className="space-y-1">
              <Label htmlFor={`saga-fact-summary-${fact.id}`}>Zusammenfassung</Label>
              <Textarea
                id={`saga-fact-summary-${fact.id}`}
                value={fact.summary}
                disabled={readOnly}
                rows={3}
                onChange={(e) => updateAt(index, { summary: e.target.value })}
                data-saga-editor-fact={fact.id}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`saga-fact-vis-${fact.id}`}>Sichtbarkeit</Label>
              <select
                id={`saga-fact-vis-${fact.id}`}
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={fact.visibility}
                disabled={readOnly}
                onChange={(e) => updateAt(index, { visibility: e.target.value })}
              >
                {VISIBILITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {!readOnly ? (
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={() => onChange(draft.knowledgeFacts.filter((_, i) => i !== index))}
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
          onClick={() =>
            onChange([
              ...draft.knowledgeFacts,
              { id: newFactId(), visibility: 'gm_only', summary: '' },
            ])
          }
          data-saga-editor-add-secret
        >
          Geheimnis hinzufügen
        </Button>
      ) : null}
    </section>
  );
}
