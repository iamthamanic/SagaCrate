/**
 * SagaEditorScreen — Author draft editor for story definitions (#575).
 * Location: src/app/saga/editor/SagaEditorScreen.tsx
 *
 * Adaptive UI Journey surface: one section focus, ≥44px CTAs, safe-area padding.
 */
import { useEffect, useRef, useState } from 'react';
import { Button } from '../../../shared/ui/button';
import { isSagaDefinitionDraftValid } from '../../../domains/saga/contracts/saga-definition';
import { sagaDefinitionService } from '../../../infrastructure/saga/saga-definition-service';
import { SAGA_EDITOR_NAV, type SagaEditorSectionId } from './saga-editor-sections';
import { SagaEditorGeneralSection } from './SagaEditorGeneralSection';
import { SagaEditorLocationsSection } from './SagaEditorLocationsSection';
import { SagaEditorSecretsSection } from './SagaEditorSecretsSection';
import { SagaEditorPregensSection } from './SagaEditorPregensSection';
import { useSagaDefinitionEditor } from './useSagaDefinitionEditor';

type Props = {
  readonly sagaId: string | null;
  readonly mode: 'edit' | 'create';
  readonly onBack: () => void;
  readonly onNavigateToEditor: (sagaId: string) => void;
};

export function SagaEditorScreen({ sagaId, mode, onBack, onNavigateToEditor }: Props) {
  const [section, setSection] = useState<SagaEditorSectionId>('general');
  const [createTitle, setCreateTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const publishConfirmRef = useRef<HTMLParagraphElement | null>(null);

  const editor = useSagaDefinitionEditor({ sagaId: mode === 'edit' ? sagaId : null });
  const readOnly = Boolean(editor.draft && !editor.draft.canEdit);
  const canPublish = Boolean(
    editor.draft
    && editor.draft.canEdit
    && isSagaDefinitionDraftValid(editor.draft)
    && !editor.isPublishing,
  );

  useEffect(() => {
    if (editor.lastPublishedLabel && publishConfirmRef.current) {
      publishConfirmRef.current.focus();
    }
  }, [editor.lastPublishedLabel]);

  const handleCreate = async () => {
    const title = createTitle.trim();
    if (!title) {
      setCreateError('Titel darf nicht leer sein.');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const created = await sagaDefinitionService.createUserSaga({ title });
      onNavigateToEditor(created.sagaId);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Anlegen fehlgeschlagen');
    } finally {
      setCreating(false);
    }
  };

  if (mode === 'create') {
    return (
      <div
        className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]"
        data-saga-editor-screen="create"
        data-au-surface="journey"
      >
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Neue Saga</h1>
          <Button type="button" variant="ghost" className="min-h-11" onClick={onBack}>
            Zurück
          </Button>
        </header>
        <label className="flex flex-col gap-2 text-sm">
          Titel
          <input
            className="flex h-11 w-full rounded-md border border-input bg-background px-3"
            value={createTitle}
            onChange={(e) => setCreateTitle(e.target.value)}
            data-saga-editor-create-title
          />
        </label>
        {createError ? (
          <p className="text-sm text-destructive" role="alert">
            {createError}
          </p>
        ) : null}
        <Button
          type="button"
          className="min-h-11"
          disabled={creating}
          onClick={() => void handleCreate()}
          data-saga-editor-create-submit
        >
          {creating ? 'Wird angelegt…' : 'Entwurf anlegen'}
        </Button>
      </div>
    );
  }

  if (editor.isLoading) {
    return (
      <div
        className="flex min-h-[40vh] items-center justify-center px-4"
        data-saga-editor-screen="loading"
        data-au-surface="journey"
      >
        <p className="text-sm text-muted-foreground">Saga-Editor wird geladen…</p>
      </div>
    );
  }

  if (!editor.draft) {
    return (
      <div
        className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-8"
        data-saga-editor-screen="error"
        data-au-surface="journey"
      >
        <p className="text-sm text-destructive" role="alert">
          {editor.error || 'Saga nicht gefunden.'}
        </p>
        <Button type="button" className="min-h-11" onClick={onBack}>
          Zurück
        </Button>
      </div>
    );
  }

  const draft = editor.draft;

  return (
    <div
      className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]"
      data-saga-editor-screen="edit"
      data-au-surface="journey"
      data-saga-editor-origin={draft.origin}
      data-saga-editor-can-edit={draft.canEdit ? 'true' : 'false'}
    >
      <header className="flex flex-col gap-3 border-b border-border/50 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Saga-Editor</h1>
          <p className="text-sm text-muted-foreground">
            {draft.title || 'Ohne Titel'}
            {editor.isDirty ? (
              <span className="ml-2 text-amber-600" data-saga-editor-dirty>
                Ungespeichert
              </span>
            ) : null}
            {editor.saveAck ? (
              <span className="ml-2 text-emerald-600" data-saga-editor-saved>
                {editor.saveAck}
              </span>
            ) : null}
            {editor.isSaving ? (
              <span className="ml-2 text-muted-foreground">Speichert…</span>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="ghost" className="min-h-11" onClick={onBack}>
            Zurück
          </Button>
          {draft.origin === 'native' ? (
            <Button
              type="button"
              className="min-h-11"
              onClick={() => {
                void editor.createCopyFromNative().then((r) => onNavigateToEditor(r.sagaId));
              }}
              data-saga-editor-copy-native
            >
              Kopie erstellen
            </Button>
          ) : (
            <Button
              type="button"
              className="min-h-11 min-w-[11rem]"
              disabled={!canPublish}
              onClick={() => {
                void editor.publishVersion().catch(() => undefined);
              }}
              data-saga-editor-publish
            >
              {editor.isPublishing ? 'Veröffentlicht…' : 'Fassung veröffentlichen'}
            </Button>
          )}
        </div>
      </header>

      {readOnly ? (
        <p
          className="rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-sm"
          data-saga-editor-readonly
        >
          Native Saga — nur lesbar. Zum Anpassen bitte eine Kopie erstellen.
        </p>
      ) : null}

      {editor.error ? (
        <p className="text-sm text-destructive" role="alert" data-saga-editor-error>
          {editor.error}
        </p>
      ) : null}

      {editor.lastPublishedLabel ? (
        <p
          ref={publishConfirmRef}
          tabIndex={-1}
          className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm"
          data-saga-editor-published
        >
          Fassung {editor.lastPublishedLabel} veröffentlicht. Bestehende Gruppen behalten ihre
          gepinnte Fassung.
        </p>
      ) : null}

      <nav
        className="flex gap-2 overflow-x-auto pb-1"
        aria-label="Editor-Bereiche"
        data-saga-editor-nav
      >
        {SAGA_EDITOR_NAV.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant={section === item.id ? 'default' : 'outline'}
            className="min-h-11 shrink-0"
            aria-current={section === item.id ? 'page' : undefined}
            onClick={() => setSection(item.id)}
            data-saga-editor-nav-item={item.id}
          >
            {item.labelDe}
          </Button>
        ))}
      </nav>

      <main className="min-h-[16rem]">
        {section === 'general' ? (
          <SagaEditorGeneralSection
            draft={draft}
            readOnly={readOnly}
            fieldErrors={editor.fieldErrors}
            onChange={editor.setField}
          />
        ) : null}
        {section === 'locations' ? (
          <SagaEditorLocationsSection
            draft={draft}
            readOnly={readOnly}
            onChange={(locations) => editor.setField('locations', locations)}
          />
        ) : null}
        {section === 'secrets' ? (
          <SagaEditorSecretsSection
            draft={draft}
            readOnly={readOnly}
            onChange={(facts) => editor.setField('knowledgeFacts', facts)}
          />
        ) : null}
        {section === 'pregens' ? (
          <SagaEditorPregensSection
            draft={draft}
            readOnly={readOnly}
            onChange={(pregens) => editor.setField('pregens', pregens)}
          />
        ) : null}
      </main>
    </div>
  );
}
