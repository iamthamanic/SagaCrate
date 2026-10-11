/**
 * SagaEditorGeneralSection — Title + player-safe blurb (#575).
 * Location: src/app/saga/editor/SagaEditorGeneralSection.tsx
 */
import { Input } from '../../../shared/ui/input';
import { Label } from '../../../shared/ui/label';
import { Textarea } from '../../../shared/ui/textarea';
import type { SagaDefinitionDraft, SagaDefinitionFieldErrors } from '../../../domains/saga/contracts/saga-definition';

type Props = {
  readonly draft: SagaDefinitionDraft;
  readonly readOnly: boolean;
  readonly fieldErrors: SagaDefinitionFieldErrors;
  readonly onChange: <K extends keyof SagaDefinitionDraft>(
    key: K,
    value: SagaDefinitionDraft[K],
  ) => void;
};

export function SagaEditorGeneralSection({ draft, readOnly, fieldErrors, onChange }: Props) {
  return (
    <section className="flex flex-col gap-4" data-saga-editor-section="general">
      <div className="space-y-2">
        <Label htmlFor="saga-editor-title">Titel</Label>
        <Input
          id="saga-editor-title"
          value={draft.title}
          disabled={readOnly}
          onChange={(e) => onChange('title', e.target.value)}
          aria-invalid={Boolean(fieldErrors.title)}
          data-saga-editor-field="title"
        />
        {fieldErrors.title ? (
          <p className="text-sm text-destructive" role="alert">
            {fieldErrors.title}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="saga-editor-blurb">Klappentext (spielersicher)</Label>
        <Textarea
          id="saga-editor-blurb"
          value={draft.blurb}
          disabled={readOnly}
          rows={5}
          onChange={(e) => onChange('blurb', e.target.value)}
          data-saga-editor-field="blurb"
        />
        <p className="text-xs text-muted-foreground">
          Sichtbar für Spieler. Keine Geheimnisse hier ablegen.
        </p>
      </div>
    </section>
  );
}
