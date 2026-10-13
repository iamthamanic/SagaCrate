/**
 * LookReferenceAdaptionFlow — Upload/classify/analyze visual references (#353/#639).
 * Location: src/app/look/create/LookReferenceAdaptionFlow.tsx
 *
 * Preview Object URL first, then look-reference optimize before Base64 analysis.
 * Does not save silently — success hands an editable UI draft to the parent.
 */
import { useEffect, useRef, useState } from 'react';
import {
  LOOK_REFERENCE_ANALYSIS_MAX_IMAGES,
  LOOK_REFERENCE_ANALYSIS_MIN_IMAGES,
  type LookReferenceKind,
} from '../../../domains/look';
import { analyzeLookReferencesForDraft } from '../../../infrastructure/look';
import { Button } from '../../../shared/ui/button';
import { uiDraftFromAnalysisDraft, type LookEditorUiDraft } from '../editor/look-editor-draft';
import {
  LOOK_ADAPTION_AGGREGATE_MAX_BYTES,
  canAddMoreReferences,
  createAdaptionReferenceId,
  prepareLookReferenceFileForAnalysis,
  validateAdaptionFile,
  type LookAdaptionReference,
} from './look-reference-adaption';
import { LookReferenceItemRow } from './LookReferenceItemRow';

export type LookReferenceAdaptionFlowProps = {
  title?: string;
  displayNameHint?: string;
  onBack: () => void;
  onAnalyzed: (draft: LookEditorUiDraft) => void;
};

type AnalysisPhase = 'idle' | 'running' | 'error';

export function LookReferenceAdaptionFlow({
  title = 'Von Referenzbildern',
  displayNameHint,
  onBack,
  onAnalyzed,
}: LookReferenceAdaptionFlowProps) {
  const [references, setReferences] = useState<LookAdaptionReference[]>([]);
  const [phase, setPhase] = useState<AnalysisPhase>('idle');
  const [progressLabel, setProgressLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const referencesRef = useRef(references);
  referencesRef.current = references;

  useEffect(() => {
    return () => {
      for (const ref of referencesRef.current) {
        URL.revokeObjectURL(ref.previewUrl);
      }
    };
  }, []);

  const addFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    setProgressLabel('Vorschau und Optimierung…');
    const next: LookAdaptionReference[] = [...references];
    let aggregateBytes = next.reduce((sum, r) => sum + Math.ceil((r.contentBase64.length * 3) / 4), 0);

    for (const file of Array.from(fileList)) {
      if (!canAddMoreReferences(next.length)) {
        setError(`Maximal ${LOOK_REFERENCE_ANALYSIS_MAX_IMAGES} Bilder.`);
        break;
      }
      const validationError = validateAdaptionFile(file);
      if (validationError) {
        setError(validationError);
        continue;
      }

      // Immediate local preview before encode/Base64.
      const previewUrl = URL.createObjectURL(file);
      const provisionalId = createAdaptionReferenceId();
      setReferences([
        ...next,
        {
          id: provisionalId,
          kind: 'style',
          mime: 'image/png',
          weight: 1,
          label: file.name,
          previewUrl,
          contentBase64: '',
          fileName: file.name,
        },
      ]);

      const projectedAggregate = aggregateBytes + file.size;
      if (projectedAggregate > LOOK_ADAPTION_AGGREGATE_MAX_BYTES) {
        URL.revokeObjectURL(previewUrl);
        setError(
          `Gesamtgröße der Referenzbilder überschreitet ${(LOOK_ADAPTION_AGGREGATE_MAX_BYTES / (1024 * 1024)).toFixed(0)} MB.`,
        );
        setReferences(next);
        break;
      }

      try {
        const prepared = await prepareLookReferenceFileForAnalysis(file, {
          imageCountInRequest: next.length + 1,
          aggregateRequestBytes: projectedAggregate,
        });
        aggregateBytes += prepared.optimizedByteSize;
        next.push({
          id: provisionalId,
          kind: 'style',
          mime: prepared.mime,
          weight: 1,
          label: file.name,
          previewUrl,
          contentBase64: prepared.contentBase64,
          fileName: file.name,
        });
        setReferences([...next]);
      } catch (err) {
        URL.revokeObjectURL(previewUrl);
        setReferences(next);
        setError(
          err instanceof Error
            ? err.message
            : 'Look-Referenz konnte nicht optimiert werden. Bisherige Referenzen bleiben erhalten.',
        );
        break;
      }
    }
    setProgressLabel(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const updateKind = (id: string, kind: LookReferenceKind) => {
    setReferences((prev) => prev.map((r) => (r.id === id ? { ...r, kind } : r)));
  };

  const updateWeight = (id: string, weight: number) => {
    const clamped = Math.min(1, Math.max(0, weight));
    setReferences((prev) => prev.map((r) => (r.id === id ? { ...r, weight: clamped } : r)));
  };

  const removeRef = (id: string) => {
    setReferences((prev) => {
      const target = prev.find((r) => r.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((r) => r.id !== id);
    });
    setError(null);
  };

  const runAnalysis = async () => {
    if (phase === 'running') return;
    const readyRefs = references.filter((r) => r.contentBase64.length > 0);
    if (
      readyRefs.length < LOOK_REFERENCE_ANALYSIS_MIN_IMAGES ||
      readyRefs.length > LOOK_REFERENCE_ANALYSIS_MAX_IMAGES
    ) {
      setError(`Bitte ${LOOK_REFERENCE_ANALYSIS_MIN_IMAGES}–${LOOK_REFERENCE_ANALYSIS_MAX_IMAGES} Bilder wählen.`);
      return;
    }
    setPhase('running');
    setProgressLabel('Stil wird analysiert…');
    setError(null);
    try {
      const outcome = await analyzeLookReferencesForDraft({
        displayNameHint,
        references: readyRefs.map((r) => ({
          id: r.id,
          kind: r.kind,
          mime: r.mime,
          uri: `look-ref:local:${r.id}`,
          weight: r.weight,
          label: r.label,
          contentBase64: r.contentBase64,
        })),
      });
      if (outcome.ok === false) {
        setPhase('error');
        setProgressLabel(null);
        setError(outcome.messageDe);
        return;
      }
      setPhase('idle');
      setProgressLabel(null);
      onAnalyzed(uiDraftFromAnalysisDraft(outcome.draft));
    } catch (err) {
      setPhase('error');
      setProgressLabel(null);
      setError(err instanceof Error ? err.message : 'Analyse fehlgeschlagen.');
    }
  };

  const analyzing = phase === 'running';

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col gap-4 p-4" data-look-reference-adaption>
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" className="min-h-11" onClick={onBack} disabled={analyzing}>
          Zurück
        </Button>
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Lade 1–10 PNG/JPEG/WebP hoch. Markiere jedes Bild als STYLE oder CONTENT, bevor du
        analysierst.
      </p>

      <div className="flex flex-wrap gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
          multiple
          className="hidden"
          onChange={(e) => void addFiles(e.target.files)}
          data-look-ref-file-input
        />
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={analyzing || !canAddMoreReferences(references.length)}
          onClick={() => fileInputRef.current?.click()}
          data-look-ref-add
        >
          Bilder hinzufügen
        </Button>
        <Button
          type="button"
          className="min-h-11"
          disabled={analyzing || references.length < LOOK_REFERENCE_ANALYSIS_MIN_IMAGES}
          onClick={() => void runAnalysis()}
          data-look-ref-analyze
        >
          {analyzing ? 'Analysiert…' : 'Stil analysieren'}
        </Button>
        {phase === 'error' ? (
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={analyzing || references.length < LOOK_REFERENCE_ANALYSIS_MIN_IMAGES}
            onClick={() => void runAnalysis()}
            data-look-ref-retry
          >
            Erneut versuchen
          </Button>
        ) : null}
      </div>

      {progressLabel ? (
        <p className="text-sm text-muted-foreground" role="status" data-look-ref-progress>
          {progressLabel}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert" data-look-ref-error>
          {error}
        </p>
      ) : null}

      <p className="text-xs text-muted-foreground" data-look-ref-count>
        {references.length} / {LOOK_REFERENCE_ANALYSIS_MAX_IMAGES} Bilder
      </p>

      <ul className="space-y-3 overflow-y-auto pb-6">
        {references.map((ref) => (
          <LookReferenceItemRow
            key={ref.id}
            reference={ref}
            disabled={analyzing}
            onKindChange={updateKind}
            onWeightChange={updateWeight}
            onRemove={removeRef}
          />
        ))}
      </ul>
    </div>
  );
}
