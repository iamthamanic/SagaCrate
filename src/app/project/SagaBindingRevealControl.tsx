/**
 * SagaBindingRevealControl — GM toggle for binding reveal (#617).
 * Location: src/app/project/SagaBindingRevealControl.tsx
 */
import { useState } from 'react';
import {
  revealLabelDe,
  type SagaRevealStatus,
} from '../../domains/saga/permissions';
import { sagaPermissionService } from '../../infrastructure/project/saga-permission-service';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../shared/ui/select';

export type SagaBindingRevealControlProps = {
  projectId: string;
  bindingId: string;
  reveal: SagaRevealStatus;
  disabled?: boolean;
  onChanged?: (next: SagaRevealStatus) => void;
};

export function SagaBindingRevealControl({
  projectId,
  bindingId,
  reveal,
  disabled,
  onChanged,
}: SagaBindingRevealControlProps) {
  const [value, setValue] = useState<SagaRevealStatus>(reveal);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSelect = async (next: string) => {
    if (next !== 'gm_only' && next !== 'party' && next !== 'unlisted') return;
    if (next === value) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await sagaPermissionService.setBindingReveal({
        projectId,
        bindingId,
        reveal: next,
      });
      setValue(updated.reveal);
      onChanged?.(updated.reveal);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sichtbarkeit speichern fehlgeschlagen');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-1" data-saga-reveal={bindingId}>
      <Select
        value={value}
        disabled={disabled || saving}
        onValueChange={(v) => void onSelect(v)}
      >
        <SelectTrigger className="min-h-11 w-[11rem]" aria-label="Sichtbarkeit">
          <SelectValue>{revealLabelDe(value)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="gm_only">{revealLabelDe('gm_only')}</SelectItem>
          <SelectItem value="party">{revealLabelDe('party')}</SelectItem>
          <SelectItem value="unlisted">{revealLabelDe('unlisted')}</SelectItem>
        </SelectContent>
      </Select>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
