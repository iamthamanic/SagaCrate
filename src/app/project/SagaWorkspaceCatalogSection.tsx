/**
 * SagaWorkspaceCatalogSection — saga-scoped catalog lists + Lore (#617 Phase 2).
 * Location: src/app/project/SagaWorkspaceCatalogSection.tsx
 *
 * Characters still use library summaries; bindings list + reveal for other kinds;
 * Lore/Verlauf loads get_saga_lore_timeline. Dornhain seed fill remains Phase 3.
 */
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Loader2, Package, Plus, ScrollText, User, Users } from 'lucide-react';
import {
  hasSagaPermission,
  type SagaAssetKind,
  type SagaPermissionKey,
} from '../../domains/saga/permissions';
import { projectService } from '../../infrastructure/project/project-service';
import {
  sagaPermissionService,
  type SagaAssetBindingVm,
  type SagaMyPermissionsVm,
} from '../../infrastructure/project/saga-permission-service';
import { Button } from '../../shared/ui/button';
import { useCharacterSummaries } from '../character';
import { pathForLibraryTab, pathForNpcCreatureCreate, type SagaSectionId } from '../shell';
import { SagaBindingRevealControl } from './SagaBindingRevealControl';
import { SagaLoreTimelinePanel } from './SagaLoreTimelinePanel';

type SagaWorkspaceCatalogSectionProps = {
  sagaPublicId: string;
  section: Extract<
    SagaSectionId,
    'characters' | 'npc-creatures' | 'items' | 'quests' | 'lore'
  >;
  onNavigate: (view: string) => void;
};

function sectionToAssetKind(
  section: SagaWorkspaceCatalogSectionProps['section'],
): SagaAssetKind | null {
  switch (section) {
    case 'characters':
      return 'character';
    case 'npc-creatures':
      return 'npc';
    case 'items':
      return 'item';
    case 'quests':
      return 'quest';
    default:
      return null;
  }
}

function createKeyForSection(
  section: SagaWorkspaceCatalogSectionProps['section'],
): SagaPermissionKey | null {
  switch (section) {
    case 'characters':
      return 'saga.characters.create';
    case 'npc-creatures':
      return 'saga.npc.create';
    case 'items':
      return 'saga.items.create';
    case 'quests':
      return 'saga.quests.create';
    default:
      return null;
  }
}

export function SagaWorkspaceCatalogSection({
  sagaPublicId,
  section,
  onNavigate,
}: SagaWorkspaceCatalogSectionProps) {
  const charactersEnabled = section === 'characters';
  const { characters, isLoading, error, refreshCharacters } = useCharacterSummaries({
    enabled: charactersEnabled,
  });

  const [perms, setPerms] = useState<SagaMyPermissionsVm | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [bindings, setBindings] = useState<SagaAssetBindingVm[]>([]);
  const [bindingsLoading, setBindingsLoading] = useState(false);
  const [bindingsError, setBindingsError] = useState<string | null>(null);

  useEffect(() => {
    if (charactersEnabled) {
      void refreshCharacters({ force: true });
    }
  }, [charactersEnabled, refreshCharacters]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const project = await projectService.getProjectByPublicId(sagaPublicId);
        const my = await sagaPermissionService.getMyPermissions(sagaPublicId);
        if (cancelled) return;
        setProjectId(project.id);
        setPerms(my);
      } catch {
        if (!cancelled) {
          setPerms(null);
          setProjectId(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sagaPublicId]);

  useEffect(() => {
    const kind = sectionToAssetKind(section);
    if (!kind || section === 'lore') {
      setBindings([]);
      return;
    }
    let cancelled = false;
    setBindingsLoading(true);
    setBindingsError(null);
    void (async () => {
      try {
        const rows = await sagaPermissionService.listBindings(sagaPublicId, kind);
        if (!cancelled) setBindings(rows);
      } catch (err) {
        if (!cancelled) {
          setBindings([]);
          setBindingsError(
            err instanceof Error ? err.message : 'Bindings konnten nicht geladen werden',
          );
        }
      } finally {
        if (!cancelled) setBindingsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sagaPublicId, section]);

  const canReveal =
    Boolean(perms?.isGm)
    || hasSagaPermission(perms?.keys, 'saga.secrets.reveal');
  const createKey = createKeyForSection(section);
  const canCreate =
    createKey == null
      ? false
      : Boolean(perms?.isGm) || hasSagaPermission(perms?.keys, createKey);

  if (section === 'lore') {
    return <SagaLoreTimelinePanel sagaPublicId={sagaPublicId} />;
  }

  if (section === 'characters') {
    return (
      <div className="space-y-4" data-saga-catalog="characters">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            Spieler-Charaktere dieser Saga. Gebundene Einträge erscheinen unten; Library-Charaktere
            helfen beim Anlegen.
          </p>
          {canCreate ? (
            <Button
              type="button"
              className="min-h-11"
              onClick={() => onNavigate('character-editor')}
              data-saga-characters-create
            >
              <Plus className="mr-2 size-4" />
              Neuer Charakter
            </Button>
          ) : null}
        </div>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {bindingsError ? (
          <p className="text-sm text-destructive" role="alert">
            {bindingsError}
          </p>
        ) : null}
        {isLoading || bindingsLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Charaktere werden geladen…
          </div>
        ) : null}
        <BindingList
          bindings={bindings}
          projectId={projectId}
          canReveal={canReveal}
        />
        {!isLoading && characters.length === 0 && bindings.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <User className="mx-auto mb-2 size-8 text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">Noch keine Spieler-Charaktere.</p>
          </div>
        ) : null}
        <ul className="space-y-2" data-saga-characters-list>
          {characters.map((c) => (
            <li
              key={c.id}
              className="flex min-h-11 items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
            >
              <span className="truncate text-sm font-medium">{c.name}</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="min-h-11 shrink-0"
                onClick={() => onNavigate('character-editor')}
              >
                Öffnen
              </Button>
            </li>
          ))}
        </ul>
        <Button
          type="button"
          variant="ghost"
          className="min-h-11"
          onClick={() => onNavigate(pathForLibraryTab('characters'))}
        >
          In Bibliothek anzeigen
        </Button>
      </div>
    );
  }

  if (section === 'npc-creatures') {
    return (
      <CatalogWithBindings
        testId="npc-creatures"
        icon={<Users className="mx-auto mb-2 size-8 text-muted-foreground" aria-hidden />}
        title="NSCs & Kreaturen"
        body="An diese Saga gebundene NSCs. Sichtbarkeit steuert Reveal (Party / nur SL)."
        bindings={bindings}
        bindingsLoading={bindingsLoading}
        bindingsError={bindingsError}
        projectId={projectId}
        canReveal={canReveal}
        primaryLabel={canCreate ? 'NSC erstellen' : undefined}
        onPrimary={canCreate ? () => onNavigate(pathForNpcCreatureCreate()) : undefined}
        secondaryLabel="Bibliothek · NSCs"
        onSecondary={() => onNavigate(pathForLibraryTab('npcs'))}
      />
    );
  }

  if (section === 'items') {
    return (
      <CatalogWithBindings
        testId="items"
        icon={<Package className="mx-auto mb-2 size-8 text-muted-foreground" aria-hidden />}
        title="Gegenstände"
        body="Saga-gebundene Items. Ohne Binding bleibt die Bibliothek der Anlege-Ort."
        bindings={bindings}
        bindingsLoading={bindingsLoading}
        bindingsError={bindingsError}
        projectId={projectId}
        canReveal={canReveal}
        primaryLabel="Bibliothek · Items"
        onPrimary={() => onNavigate(pathForLibraryTab('items'))}
      />
    );
  }

  return (
    <CatalogWithBindings
      testId="quests"
      icon={<ScrollText className="mx-auto mb-2 size-8 text-muted-foreground" aria-hidden />}
      title="Quests"
      body="Quests dieser Saga. Dornhain-Starter-Quests kommen mit dem Lern-Seed (Phase 3)."
      bindings={bindings}
      bindingsLoading={bindingsLoading}
      bindingsError={bindingsError}
      projectId={projectId}
      canReveal={canReveal}
    />
  );
}

function BindingList(props: {
  bindings: SagaAssetBindingVm[];
  projectId: string | null;
  canReveal: boolean;
}) {
  if (props.bindings.length === 0) {
    return null;
  }
  return (
    <ul className="space-y-2" data-saga-bindings-list>
      {props.bindings.map((b) => (
        <li
          key={b.id}
          className="flex min-h-11 flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {b.label || b.assetId}
            </p>
            <p className="text-xs text-muted-foreground">{b.assetKind}</p>
          </div>
          {props.canReveal && props.projectId ? (
            <SagaBindingRevealControl
              projectId={props.projectId}
              bindingId={b.id}
              reveal={b.reveal}
            />
          ) : (
            <span className="text-xs text-muted-foreground">{b.reveal}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function CatalogWithBindings(props: {
  icon: ReactNode;
  title: string;
  body: string;
  testId: string;
  bindings: SagaAssetBindingVm[];
  bindingsLoading: boolean;
  bindingsError: string | null;
  projectId: string | null;
  canReveal: boolean;
  primaryLabel?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  return (
    <div className="space-y-4" data-saga-catalog={props.testId}>
      {props.bindingsError ? (
        <p className="text-sm text-destructive" role="alert">
          {props.bindingsError}
        </p>
      ) : null}
      {props.bindingsLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Katalog wird geladen…
        </div>
      ) : null}
      <BindingList
        bindings={props.bindings}
        projectId={props.projectId}
        canReveal={props.canReveal}
      />
      {!props.bindingsLoading && props.bindings.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          {props.icon}
          <p className="text-sm font-medium text-foreground">{props.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{props.body}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {props.primaryLabel && props.onPrimary ? (
              <Button type="button" className="min-h-11" onClick={props.onPrimary}>
                <Plus className="mr-2 size-4" />
                {props.primaryLabel}
              </Button>
            ) : null}
            {props.secondaryLabel && props.onSecondary ? (
              <Button type="button" variant="outline" className="min-h-11" onClick={props.onSecondary}>
                {props.secondaryLabel}
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {props.primaryLabel && props.onPrimary ? (
            <Button type="button" className="min-h-11" onClick={props.onPrimary}>
              <Plus className="mr-2 size-4" />
              {props.primaryLabel}
            </Button>
          ) : null}
          {props.secondaryLabel && props.onSecondary ? (
            <Button type="button" variant="outline" className="min-h-11" onClick={props.onSecondary}>
              {props.secondaryLabel}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
