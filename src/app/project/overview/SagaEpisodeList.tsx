/**
 * SagaEpisodeList — Sessions as Library EntityBrowser (Liste / Grid / Karussell).
 * Same card chrome as Bibliothek → Abenteuer / Charaktere.
 * Location: src/app/project/overview/SagaEpisodeList.tsx
 */
import { useMemo } from 'react';
import { BookOpen, Trash2 } from 'lucide-react';
import type { SagaEpisodeVm } from '../../../domains/project/contracts/saga-overview';
import { sagatreeNativeSagaCoverUrlByTitle } from '../../../domains/saga/use-cases/sagatree-native-saga-covers';
import { sessionStatusLabelDe } from '../../../domains/session/contracts/session-prepare-recap';
import {
  EntityBrowser,
  EntityBrowserCard,
  EntityBrowserCornerMenuPortal,
  EntityBrowserCornerMenuTrigger,
  useLibraryCornerMenu,
  type EntityBrowserChip,
  type EntityBrowserCornerMenuItem,
  type EntityBrowserRenderContext,
} from '../../library';
import { Button } from '../../../shared/ui/button';

export type SagaEpisodeListProps = {
  episodes: readonly SagaEpisodeVm[];
  sagaTitle: string;
  onOpenEpisode: (episode: SagaEpisodeVm) => void;
  /** GM-only: show Session löschen in the ⋮ menu. */
  canDeleteEpisodes?: boolean;
  onDeleteEpisode?: (episode: SagaEpisodeVm) => void | Promise<void>;
};

const VIEW_MODE_KEY = 'sagatree_saga_hub_episodes_view_mode';

type EpisodeBrowserItem = SagaEpisodeVm & { id: string };

function statusChip(status: string): EntityBrowserChip {
  const label = sessionStatusLabelDe(status);
  if (status === 'active' || status === 'live') {
    return { label, tone: 'success' };
  }
  if (status === 'completed' || status === 'ended') {
    return { label, tone: 'muted' };
  }
  return { label, tone: 'default' };
}

export function SagaEpisodeList({
  episodes,
  sagaTitle,
  onOpenEpisode,
  canDeleteEpisodes = false,
  onDeleteEpisode,
}: SagaEpisodeListProps) {
  const completed = episodes.filter((e) => e.status === 'completed').length;
  const coverUrl = sagatreeNativeSagaCoverUrlByTitle(sagaTitle) ?? undefined;
  const corner = useLibraryCornerMenu();

  const items = useMemo<EpisodeBrowserItem[]>(
    () =>
      episodes.map((ep) => ({
        ...ep,
        id: ep.sessionId,
      })),
    [episodes],
  );

  const openMenuEpisode = useMemo(() => {
    if (!corner.anchor) return null;
    return items.find((ep) => ep.sessionPublicId === corner.anchor?.menuKey) ?? null;
  }, [corner.anchor, items]);

  const emptyState = (
    <p className="px-1 py-6 text-sm text-muted-foreground" data-saga-overview-episodes-empty>
      Noch keine Sessions in dieser Saga. Starte die erste über „Session hosten“.
    </p>
  );

  const renderItem = (episode: EpisodeBrowserItem, context: EntityBrowserRenderContext) => {
    const title = episode.name?.trim() || `Session ${episode.sessionNumber}`;
    const menuKey = episode.sessionPublicId;
    const chips: EntityBrowserChip[] = [
      { label: `#${episode.sessionNumber}`, tone: 'muted' },
      statusChip(episode.status),
    ];
    const stopBubble = (event: { stopPropagation: () => void }) => {
      event.stopPropagation();
    };

    return (
      <EntityBrowserCard
        title={title}
        meta={
          episode.recapSnippet?.trim() ||
          `${sagaTitle} · Episode ${episode.sessionNumber}`
        }
        imageUrl={coverUrl}
        imageFallback={title}
        imageAlt={`Session ${title}`}
        imageAspect="landscape"
        imageObjectFit="cover"
        imageObjectPosition="center bottom"
        metaChips={chips}
        variant={context.variant}
        isCenter={context.isCenter}
        onOpen={
          context.variant === 'list' ||
          context.variant === 'grid' ||
          context.isCenter
            ? () => onOpenEpisode(episode)
            : undefined
        }
        cornerAction={
          <EntityBrowserCornerMenuTrigger
            compact={context.variant === 'list'}
            busy={corner.isBusy(menuKey)}
            label={`Aktionen für ${title}`}
            menuKey={menuKey}
            open={corner.isOpen(menuKey)}
            onToggle={(rect, triggerEl) => corner.toggle(menuKey, rect, triggerEl)}
            dataAttr="saga-hub-episode-menu"
          />
        }
        actions={
          <Button
            type="button"
            variant="default"
            size="sm"
            className="min-h-11 w-full min-w-0 bg-cyan-600 text-white hover:bg-cyan-500"
            onClick={(event) => {
              stopBubble(event);
              onOpenEpisode(episode);
            }}
            data-saga-overview-episode={episode.sessionPublicId}
          >
            <BookOpen className="mr-1 size-3 shrink-0" aria-hidden />
            <span className="truncate text-xs">Öffnen</span>
          </Button>
        }
      />
    );
  };

  const menuItems: EntityBrowserCornerMenuItem[] = openMenuEpisode
    ? [
        {
          id: 'open',
          label: 'Session öffnen',
          icon: <BookOpen className="size-4" aria-hidden />,
          onSelect: () => {
            onOpenEpisode(openMenuEpisode);
            corner.close();
          },
        },
        ...(canDeleteEpisodes && onDeleteEpisode
          ? [
              {
                id: 'delete',
                label: 'Session löschen',
                icon: <Trash2 className="size-4" aria-hidden />,
                destructive: true,
                separatorBefore: true,
                onSelect: () => {
                  const target = openMenuEpisode;
                  corner.close();
                  void onDeleteEpisode(target);
                },
              } satisfies EntityBrowserCornerMenuItem,
            ]
          : []),
      ]
    : [];

  return (
    <section
      className="@container w-full min-w-0 space-y-3"
      data-saga-overview-episodes
      aria-labelledby="saga-overview-episodes-title"
    >
      <div className="space-y-0.5">
        <h3
          id="saga-overview-episodes-title"
          className="text-[1.05rem] font-bold text-foreground"
        >
          Sessions
        </h3>
        <p className="text-[13px] text-muted-foreground">
          {episodes.length === 0
            ? 'Noch keine Sessions in dieser Saga.'
            : `${completed} von ${episodes.length} abgeschlossen`}
        </p>
      </div>

      <EntityBrowser
        storageKey={VIEW_MODE_KEY}
        items={items}
        getId={(item) => item.id}
        renderItem={renderItem}
        onOpenItem={(item) => onOpenEpisode(item)}
        emptyState={emptyState}
        toolbarLeft={
          <span>
            {episodes.length === 1
              ? '1 Session'
              : `${episodes.length} Sessions`}
          </span>
        }
      />

      {corner.anchor && openMenuEpisode ? (
        <EntityBrowserCornerMenuPortal
          anchor={corner.anchor}
          busy={corner.isBusy(openMenuEpisode.sessionPublicId)}
          dataAttr="saga-hub-episode-menu"
          contentDataAttr="saga-hub-episode-menu-content"
          onClose={corner.close}
          items={menuItems}
        />
      ) : null}
    </section>
  );
}
