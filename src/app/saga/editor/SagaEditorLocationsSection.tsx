/**
 * SagaEditorLocationsSection — Location list editor (#575).
 * Location: src/app/saga/editor/SagaEditorLocationsSection.tsx
 */
import { Button } from '../../../shared/ui/button';
import { Input } from '../../../shared/ui/input';
import { Label } from '../../../shared/ui/label';
import type { SagaDefinitionDraft, SagaLocationRef } from '../../../domains/saga/contracts/saga-definition';

type Props = {
  readonly draft: SagaDefinitionDraft;
  readonly readOnly: boolean;
  readonly onChange: (locations: SagaLocationRef[]) => void;
};

function newLocationId(): string {
  return `loc.${Date.now().toString(36)}`;
}

export function SagaEditorLocationsSection({ draft, readOnly, onChange }: Props) {
  const updateAt = (index: number, patch: Partial<SagaLocationRef>) => {
    onChange(
      draft.locations.map((loc, i) => (i === index ? { ...loc, ...patch } : loc)),
    );
  };

  return (
    <section className="flex flex-col gap-4" data-saga-editor-section="locations">
      <p className="text-sm text-muted-foreground">
        Orte der Geschichte — Labels sind spielersicher.
      </p>
      <ul className="flex flex-col gap-3">
        {draft.locations.map((loc, index) => (
          <li key={loc.id} className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1">
              <Label htmlFor={`saga-loc-${loc.id}`}>Ort</Label>
              <Input
                id={`saga-loc-${loc.id}`}
                value={loc.label}
                disabled={readOnly}
                onChange={(e) => updateAt(index, { label: e.target.value })}
                data-saga-editor-location={loc.id}
              />
            </div>
            {!readOnly ? (
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={() => onChange(draft.locations.filter((_, i) => i !== index))}
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
            onChange([...draft.locations, { id: newLocationId(), label: 'Neuer Ort' }])
          }
          data-saga-editor-add-location
        >
          Ort hinzufügen
        </Button>
      ) : null}
    </section>
  );
}
