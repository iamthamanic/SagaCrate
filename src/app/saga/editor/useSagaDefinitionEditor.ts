/**
 * useSagaDefinitionEditor — Draft load/autosave/publish for Saga Editor v1 (#575).
 * Location: src/app/saga/editor/useSagaDefinitionEditor.ts
 *
 * Hooks: useState / useEffect / useRef only.
 */
import { useEffect, useRef, useState } from 'react';
import {
  editorVmToDraft,
  isSagaDefinitionDraftValid,
  validateSagaDefinitionDraft,
  type SagaDefinitionDraft,
  type SagaDefinitionFieldErrors,
} from '../../../domains/saga/contracts/saga-definition';
import { sagaDefinitionService } from '../../../infrastructure/saga/saga-definition-service';

const AUTOSAVE_MS = 800;

export type UseSagaDefinitionEditorArgs = {
  readonly sagaId: string | null;
};

export type UseSagaDefinitionEditorResult = {
  readonly draft: SagaDefinitionDraft | null;
  readonly isLoading: boolean;
  readonly isSaving: boolean;
  readonly isPublishing: boolean;
  readonly error: string | null;
  readonly isDirty: boolean;
  readonly revision: number;
  readonly fieldErrors: SagaDefinitionFieldErrors;
  readonly saveAck: string | null;
  readonly lastPublishedLabel: string | null;
  readonly setField: <K extends keyof SagaDefinitionDraft>(
    key: K,
    value: SagaDefinitionDraft[K],
  ) => void;
  readonly replaceDraft: (next: SagaDefinitionDraft) => void;
  readonly save: () => Promise<void>;
  readonly publishVersion: () => Promise<{ versionId: string }>;
  readonly createCopyFromNative: () => Promise<{ sagaId: string }>;
};

function cloneDraft(draft: SagaDefinitionDraft): SagaDefinitionDraft {
  return {
    ...draft,
    locations: draft.locations.map((l) => ({ ...l })),
    knowledgeFacts: draft.knowledgeFacts.map((f) => ({ ...f })),
    pregens: draft.pregens.map((p) => ({ ...p })),
  };
}

export function useSagaDefinitionEditor({
  sagaId,
}: UseSagaDefinitionEditorArgs): UseSagaDefinitionEditorResult {
  const [draft, setDraft] = useState<SagaDefinitionDraft | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(sagaId));
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [revision, setRevision] = useState(0);
  const [saveAck, setSaveAck] = useState<string | null>(null);
  const [lastPublishedLabel, setLastPublishedLabel] = useState<string | null>(null);

  const dirtyFlag = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestDraft = useRef<SagaDefinitionDraft | null>(null);
  const revisionRef = useRef(0);
  const saveInFlight = useRef(false);

  const fieldErrors = draft ? validateSagaDefinitionDraft(draft) : {};

  useEffect(() => {
    dirtyFlag.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    latestDraft.current = draft;
  }, [draft]);

  useEffect(() => {
    revisionRef.current = revision;
  }, [revision]);

  useEffect(() => {
    if (!sagaId) {
      setDraft(null);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setIsDirty(false);
    dirtyFlag.current = false;
    void (async () => {
      try {
        const vm = await sagaDefinitionService.getEditor(sagaId);
        if (cancelled) return;
        const next = editorVmToDraft(vm);
        setDraft(next);
        latestDraft.current = next;
        setRevision(vm.revision);
        revisionRef.current = vm.revision;
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Laden fehlgeschlagen');
          setDraft(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sagaId]);

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  const persist = async () => {
    const current = latestDraft.current;
    if (!current || !current.canEdit || !sagaId) return;
    if (!isSagaDefinitionDraftValid(current)) {
      setError('Bitte Pflichtfelder prüfen.');
      return;
    }
    if (saveInFlight.current) return;
    saveInFlight.current = true;
    setIsSaving(true);
    setError(null);
    try {
      const result = await sagaDefinitionService.saveDraft({
        sagaId,
        draft: current,
        expectedRevision: revisionRef.current,
      });
      setRevision(result.revision);
      revisionRef.current = result.revision;
      setIsDirty(false);
      dirtyFlag.current = false;
      setSaveAck('Gespeichert');
      window.setTimeout(() => setSaveAck(null), 1200);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Speichern fehlgeschlagen';
      setError(message);
      if (message.toLowerCase().includes('revision')) {
        try {
          const vm = await sagaDefinitionService.getEditor(sagaId);
          const next = editorVmToDraft(vm);
          setDraft(next);
          latestDraft.current = next;
          setRevision(vm.revision);
          revisionRef.current = vm.revision;
          setIsDirty(false);
          dirtyFlag.current = false;
          setError('Revisionskonflikt — Entwurf neu geladen.');
        } catch {
          /* keep original error */
        }
      }
    } finally {
      saveInFlight.current = false;
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!isDirty || !draft?.canEdit) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      void persist();
    }, AUTOSAVE_MS);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [isDirty, draft]);

  const markDirty = (next: SagaDefinitionDraft) => {
    latestDraft.current = next;
    setDraft(next);
    if (!next.canEdit) return;
    setIsDirty(true);
    dirtyFlag.current = true;
    setSaveAck(null);
  };

  const setField = <K extends keyof SagaDefinitionDraft>(
    key: K,
    value: SagaDefinitionDraft[K],
  ) => {
    if (!draft) return;
    markDirty({ ...cloneDraft(draft), [key]: value });
  };

  const replaceDraft = (next: SagaDefinitionDraft) => {
    markDirty(cloneDraft(next));
  };

  const save = async () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    await persist();
  };

  const publishVersion = async () => {
    if (!draft || !sagaId || !draft.canEdit) {
      throw new Error('Veröffentlichen nicht möglich');
    }
    if (!isSagaDefinitionDraftValid(draft)) {
      setError('Bitte Pflichtfelder prüfen.');
      throw new Error('Validierung fehlgeschlagen');
    }
    setIsPublishing(true);
    setError(null);
    try {
      if (dirtyFlag.current) {
        await persist();
      }
      const result = await sagaDefinitionService.publishVersion({
        sagaId,
        expectedRevision: revisionRef.current,
      });
      setLastPublishedLabel(result.versionLabel);
      return { versionId: result.versionId };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Veröffentlichen fehlgeschlagen';
      setError(message);
      throw err instanceof Error ? err : new Error(message);
    } finally {
      setIsPublishing(false);
    }
  };

  const createCopyFromNative = async () => {
    if (!draft || draft.origin !== 'native') {
      throw new Error('Nur native Sagas können kopiert werden');
    }
    setError(null);
    try {
      return await sagaDefinitionService.createCopyFromNative(draft.sagaId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kopie fehlgeschlagen';
      setError(message);
      throw err instanceof Error ? err : new Error(message);
    }
  };

  return {
    draft,
    isLoading,
    isSaving,
    isPublishing,
    error,
    isDirty,
    revision,
    fieldErrors,
    saveAck,
    lastPublishedLabel,
    setField,
    replaceDraft,
    save,
    publishVersion,
    createCopyFromNative,
  };
}
