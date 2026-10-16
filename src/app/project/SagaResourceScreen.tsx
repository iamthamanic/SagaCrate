/**
 * SagaResourceScreen — Canonical /sagas/** workspace shell (#276 / #489 / #571 / #saga-workspace-ia).
 * Location: src/app/project/SagaResourceScreen.tsx
 *
 * Top chrome: Übersicht · Welt · Einstellungen. Sessions + party live on Overview;
 * NSCs / Items / Quests / Lore nest under Welt subtabs. Deep-link section ids stay.
 */
import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '../../shared/ui/button';
import { AdaptivePage } from '../../shared/ui/adaptive';
import { Skeleton } from '../../shared/ui/skeleton';
import { buildSessionJoinPath } from '../../domains/session/contracts/session-entry-routing';
import { resolveHubSessionEntryPhase } from '../../domains/session/contracts/session-prepare-recap';
import { resolveSagaPrimaryAction } from '../../domains/project/use-cases/saga-primary-action';
import {
  resolveSagaWorldSub,
  resolveSagaWorkspaceTop,
} from '../../domains/project/contracts/saga-workspace-nav';
import type { SagaEpisodeVm } from '../../domains/project/contracts/saga-overview';
import type { SagaSectionId } from '../shell';
import { pathForSagaList, pathForSagaSection, pathForSessionPhase } from '../shell';
import { SagaCreateForm } from './SagaCreateForm';
import { SagaListPanel } from './SagaListPanel';
import { SagaWorkspaceNav } from './SagaWorkspaceNav';
import { SagaWorldSubNav } from './SagaWorldSubNav';
import { SagaVisualStyleSettings } from './SagaVisualStyleSettings';
import { SagaPermissionSettings } from './SagaPermissionSettings';
import { WorldLookPreviewPanel } from './WorldLookPreviewPanel';
import { SagaWorldCatalogPanel } from './SagaWorldCatalogPanel';
import { SagaWorkspaceCatalogSection } from './SagaWorkspaceCatalogSection';
import { toast } from 'sonner';
import { sessionService } from '../../infrastructure/session/session-service';
import { useSagaOverview } from './hooks/useSagaOverview';
import { SagaOverviewHero } from './overview/SagaOverviewHero';
import { SagaEpisodeList } from './overview/SagaEpisodeList';
import { SagaEnsembleStrip } from './overview/SagaEnsembleStrip';

type SagaResourceScreenProps = {
  mode: 'list' | 'new' | 'section';
  sagaPublicId?: string | null;
  section?: SagaSectionId;
  onNavigateHome: () => void;
  onNavigate?: (view: string) => void;
};

const SECTION_LABELS: Record<SagaSectionId, string> = {
  overview: 'Übersicht',
  characters: 'Spieler-Charaktere',
  world: 'Welt',
  'npc-creatures': 'NSCs / Kreaturen',
  items: 'Gegenstände',
  quests: 'Quests',
  lore: 'Lore / Verlauf',
  sessions: 'Sessions',
  settings: 'Einstellungen',
};

const WORLD_CONTENT = new Set<SagaSectionId>([
  'world',
  'npc-creatures',
  'items',
  'quests',
  'lore',
]);

const HUB_SECTIONS = new Set<SagaSectionId>(['overview', 'sessions', 'characters']);

export function SagaResourceScreen({
  mode,
  sagaPublicId,
  section = 'overview',
  onNavigateHome,
  onNavigate,
}: SagaResourceScreenProps) {
  const navigate = (view: string) => {
    if (onNavigate) {
      onNavigate(view);
      return;
    }
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', view.startsWith('/') ? view : `/${view}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  if (mode === 'list') {
    return (
      <AdaptivePage data-au-surface="saga-list" className="h-full w-full">
        <SagaListPanel onNavigate={navigate} onNavigateHome={onNavigateHome} />
      </AdaptivePage>
    );
  }

  if (mode === 'new') {
    return (
      <AdaptivePage data-au-surface="saga-new" className="h-full w-full">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4 md:p-6" data-saga-new>
          <h1 className="text-2xl font-semibold text-foreground">Neue Saga</h1>
          <p className="text-sm text-muted-foreground">
            Nach dem Erstellen öffnet sich die Saga-Übersicht. Die Public ID (SA-XXXXX) wird
            serverseitig vergeben.
          </p>
          <SagaCreateForm
            onCancel={() => navigate(pathForSagaList())}
            onCreated={(publicId) => navigate(pathForSagaSection(publicId, 'overview'))}
          />
        </div>
      </AdaptivePage>
    );
  }

  const id = sagaPublicId?.trim() || null;
  const top = resolveSagaWorkspaceTop(section);

  const topTitle =
    top === 'overview' ? 'Übersicht' : top === 'world' ? 'Welt' : 'Einstellungen';

  const header = (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Saga</p>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-2xl font-semibold text-foreground">{topTitle}</h1>
          {id ? (
            <span
              className="rounded-md border border-border bg-card px-2 py-0.5 font-mono text-xs text-muted-foreground"
              translate="no"
            >
              {id}
            </span>
          ) : (
            <span className="text-sm text-destructive">Unbekannte Saga</span>
          )}
        </div>
        {top === 'world' && section !== 'world' ? (
          <p className="text-sm text-muted-foreground">{SECTION_LABELS[section]}</p>
        ) : null}
      </div>
      {id ? (
        <SagaWorkspaceNav sagaPublicId={id} active={section} onNavigate={navigate} />
      ) : null}
    </div>
  );

  if (!id) {
    return (
      <AdaptivePage data-au-surface="saga-section" className="h-full w-full">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
          {header}
          <p className="text-sm text-destructive" role="alert">
            Diese Saga-URL ist ungültig oder die Saga existiert nicht.
          </p>
          <Button type="button" variant="ghost" className="min-h-11 self-start" onClick={onNavigateHome}>
            Zurück
          </Button>
        </div>
      </AdaptivePage>
    );
  }

  if (section === 'settings') {
    return (
      <AdaptivePage data-au-surface="saga-section" className="h-full w-full">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 p-4 md:p-6" data-saga-section="settings">
          {header}
          <SagaVisualStyleSettings sagaPublicId={id} onNavigate={onNavigate} />
          <SagaPermissionSettings sagaPublicId={id} />
          <Button type="button" variant="ghost" className="min-h-11 self-start" onClick={onNavigateHome}>
            Zurück
          </Button>
        </div>
      </AdaptivePage>
    );
  }

  if (WORLD_CONTENT.has(section)) {
    return (
      <SagaWorldShell
        sagaPublicId={id}
        section={section}
        header={header}
        onNavigate={navigate}
        onNavigateHome={onNavigateHome}
      />
    );
  }

  if (HUB_SECTIONS.has(section)) {
    return (
      <SagaOverviewSection
        sagaPublicId={id}
        section={section}
        onNavigate={navigate}
        onNavigateHome={onNavigateHome}
      />
    );
  }

  return (
    <AdaptivePage data-au-surface="saga-section" className="h-full w-full">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4 md:p-6" data-saga-section={section}>
        {header}
        <p className="text-sm text-muted-foreground" data-saga-section-unavailable>
          {`Bereich „${SECTION_LABELS[section]}“ ist noch nicht verfügbar.`}
        </p>
        <Button type="button" variant="ghost" className="min-h-11 self-start" onClick={onNavigateHome}>
          Zurück
        </Button>
      </div>
    </AdaptivePage>
  );
}

/**
 * Welt shell — subtabs + places catalog or scoped catalog sections.
 */
function SagaWorldShell({
  sagaPublicId,
  section,
  header,
  onNavigate,
  onNavigateHome,
}: {
  sagaPublicId: string;
  section: SagaSectionId;
  header: ReactNode;
  onNavigate: (view: string) => void;
  onNavigateHome: () => void;
}) {
  const sub = resolveSagaWorldSub(section) ?? 'places';

  return (
    <AdaptivePage data-au-surface="saga-section" className="h-full w-full">
      <div
        className="@container mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6"
        data-saga-section={section}
        data-saga-world-shell
        data-au-content-width="saga-world"
      >
        {header}
        <SagaWorldSubNav
          sagaPublicId={sagaPublicId}
          active={section}
          onNavigate={onNavigate}
        />

        {sub === 'places' ? (
          <>
            <SagaWorldCatalogPanel sagaPublicId={sagaPublicId} />
            <WorldLookPreviewPanel sagaPublicId={sagaPublicId} onNavigate={onNavigate} />
          </>
        ) : (
          <SagaWorkspaceCatalogSection
            sagaPublicId={sagaPublicId}
            section={sub}
            onNavigate={onNavigate}
          />
        )}

        <Button type="button" variant="ghost" className="min-h-11 self-start" onClick={onNavigateHome}>
          Zurück
        </Button>
      </div>
    </AdaptivePage>
  );
}

/**
 * Overview hub — story title as H1, Library tabs, episodes + ensemble (#saga-workspace-ia).
 */
function SagaOverviewSection({
  sagaPublicId,
  section,
  onNavigate,
  onNavigateHome,
}: {
  sagaPublicId: string;
  section: SagaSectionId;
  onNavigate: (view: string) => void;
  onNavigateHome: () => void;
}) {
  const { model, isLoading, error, refresh } = useSagaOverview({ sagaPublicId });
  const showCharacterCatalog = section === 'characters';
  const pageTitle =
    section === 'characters'
      ? 'Spieler-Charaktere'
      : section === 'sessions'
        ? 'Sessions'
        : model?.title?.trim() || 'Übersicht';

  const openEpisode = (episode: SagaEpisodeVm) => {
    const phase = resolveHubSessionEntryPhase(episode.status);
    onNavigate(pathForSessionPhase(sagaPublicId, episode.sessionPublicId, phase));
  };

  const deleteEpisode = async (episode: SagaEpisodeVm) => {
    if (!model?.isGm && model?.selfRole !== 'gamemaster') {
      toast.error('Nur der Gamemaster kann Sessions löschen.');
      return;
    }
    const title = episode.name?.trim() || `Session ${episode.sessionNumber}`;
    if (
      !window.confirm(
        `Möchtest du die Session „${title}“ (${episode.sessionPublicId}) wirklich löschen?`,
      )
    ) {
      return;
    }
    try {
      await sessionService.deleteSession(episode.sessionId);
      toast.success('Session gelöscht');
      await refresh({ force: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Löschen fehlgeschlagen');
    }
  };

  const runPrimary = () => {
    if (!model) return;
    const action = resolveSagaPrimaryAction(model, model.selfRole);
    if (action.kind === 'wait') return;
    if (action.kind === 'host-session') {
      onNavigate(
        buildSessionJoinPath({
          sagaPublicId,
          projectId: model.projectId,
          intent: 'create',
        }),
      );
      return;
    }
    if (action.sessionPublicId) {
      const episode = model.episodes.find((e) => e.sessionPublicId === action.sessionPublicId);
      const phase = episode
        ? resolveHubSessionEntryPhase(episode.status)
        : 'lobby';
      onNavigate(pathForSessionPhase(sagaPublicId, action.sessionPublicId, phase));
    }
  };

  return (
    <AdaptivePage data-au-surface="saga-section" className="h-full w-full">
      <div
        className="@container mx-auto flex w-full max-w-7xl flex-col gap-3 p-4 md:p-6"
        data-saga-section={section === 'sessions' ? 'sessions' : section === 'characters' ? 'characters' : 'overview'}
        data-saga-hub
        data-au-content-width="saga-overview"
      >
        <div className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Saga
              </p>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                {isLoading && !model ? (
                  <Skeleton className="h-8 w-64" />
                ) : (
                  <h1
                    id="saga-overview-title"
                    className="text-balance text-2xl font-bold text-foreground md:text-3xl"
                  >
                    {pageTitle}
                  </h1>
                )}
                <span
                  className="rounded-md border border-border bg-card px-2.5 py-0.5 font-mono text-xs text-muted-foreground"
                  translate="no"
                >
                  {sagaPublicId}
                </span>
              </div>
            </div>
            {model ? (
              <span
                className="inline-flex min-h-8 items-center rounded-full bg-cyan-500/15 px-2.5 text-[13px] font-semibold text-cyan-600 dark:text-cyan-400"
                data-saga-hub-role
              >
                {model.isGm || model.selfRole === 'gamemaster'
                  ? 'Gamemaster'
                  : model.selfRole === 'viewer'
                    ? 'Beobachter'
                    : 'Spieler'}
              </span>
            ) : null}
          </div>
          <SagaWorkspaceNav
            sagaPublicId={sagaPublicId}
            active={section}
            onNavigate={onNavigate}
          />
        </div>

        {error ? (
          <div className="space-y-3" role="alert" data-saga-overview-error>
            <p className="text-sm text-destructive">{error}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={() => {
                  void refresh({ force: true });
                }}
              >
                Erneut laden
              </Button>
              <Button type="button" variant="ghost" className="min-h-11" onClick={onNavigateHome}>
                Zurück zur Liste
              </Button>
            </div>
          </div>
        ) : null}

        {!error && isLoading && !model ? (
          <div className="space-y-4" data-saga-overview-loading aria-busy="true">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-11 w-44" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Übersicht wird geladen…
            </div>
          </div>
        ) : null}

        {!error && model && !showCharacterCatalog ? (
          <>
            <SagaOverviewHero
              model={model}
              primaryAction={resolveSagaPrimaryAction(model, model.selfRole)}
              onPrimary={runPrimary}
            />
            <div className="mt-3 min-w-0 space-y-3">
              <SagaEpisodeList
                episodes={model.episodes}
                sagaTitle={model.title}
                onOpenEpisode={openEpisode}
                canDeleteEpisodes={model.isGm || model.selfRole === 'gamemaster'}
                onDeleteEpisode={deleteEpisode}
              />
              {section === 'sessions' ? (
                <Button
                  type="button"
                  className="min-h-11 self-start"
                  onClick={runPrimary}
                  data-saga-sessions-join
                >
                  Session starten / beitreten
                </Button>
              ) : null}
            </div>
            <div className="mt-3 min-w-0 max-w-md" data-saga-hub-ensemble>
              <SagaEnsembleStrip
                ensemble={model.ensemble}
                onManageCharacters={() =>
                  onNavigate(pathForSagaSection(sagaPublicId, 'characters'))
                }
              />
            </div>
          </>
        ) : null}

        {showCharacterCatalog ? (
          <div className="space-y-3" data-saga-hub-character-catalog>
            <SagaWorkspaceCatalogSection
              sagaPublicId={sagaPublicId}
              section="characters"
              onNavigate={onNavigate}
            />
          </div>
        ) : null}

        <Button type="button" variant="ghost" className="min-h-11 self-start" onClick={onNavigateHome}>
          Zurück
        </Button>
      </div>
    </AdaptivePage>
  );
}
