/**
 * SagaWorldMapPanel — Saga → Welt default: Unified Atlas + Orte/Lore Sheet.
 * Location: src/app/project/SagaWorldMapPanel.tsx
 *
 * Same WorldAtlasWorkbench as Library. Locations are not a separate subtab —
 * open via the Orte button Sheet (Reveal for GM).
 */
import { useEffect, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { Button } from '../../shared/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../shared/ui/sheet';
import { useSagaOverview } from './hooks/useSagaOverview';
import { WorldAtlasWorkbench } from '../world';
import { pathForLibraryTab } from '../shell';
import {
  hasSagaPermission,
  revealLabelDe,
} from '../../domains/saga/permissions';
import {
  sagaPermissionService,
  type SagaAssetBindingVm,
  type SagaMyPermissionsVm,
} from '../../infrastructure/project/saga-permission-service';
import { SagaBindingRevealControl } from './SagaBindingRevealControl';

export type SagaWorldMapPanelProps = {
  readonly sagaPublicId: string;
  readonly onNavigate: (view: string) => void;
};

function BindingRows(props: {
  rows: SagaAssetBindingVm[];
  projectId: string | null;
  canReveal: boolean;
  empty: string;
}) {
  if (props.rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{props.empty}</p>;
  }
  return (
    <ul className="space-y-2">
      {props.rows.map((b) => (
        <li
          key={b.id}
          className="flex min-h-11 flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {b.label || b.assetId}
            </p>
            <p className="text-xs text-muted-foreground">{revealLabelDe(b.reveal)}</p>
          </div>
          {props.canReveal && props.projectId ? (
            <SagaBindingRevealControl
              projectId={props.projectId}
              bindingId={b.id}
              reveal={b.reveal}
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function SagaWorldMapPanel({ sagaPublicId, onNavigate }: SagaWorldMapPanelProps) {
  const { model, isLoading, error } = useSagaOverview({ sagaPublicId });
  const worldProfileId = model?.worldProfileId?.trim() || null;
  const canEdit = model?.isGm === true;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [locations, setLocations] = useState<SagaAssetBindingVm[]>([]);
  const [lore, setLore] = useState<SagaAssetBindingVm[]>([]);
  const [drawerPerms, setDrawerPerms] = useState<SagaMyPermissionsVm | null>(null);
  const [drawerProjectId, setDrawerProjectId] = useState<string | null>(null);
  const [drawerError, setDrawerError] = useState<string | null>(null);

  useEffect(() => {
    if (!drawerOpen) return;
    let cancelled = false;
    void (async () => {
      try {
        const my = await sagaPermissionService.getMyPermissions(sagaPublicId);
        if (cancelled) return;
        setDrawerPerms(my);
        setDrawerProjectId(my.projectId);
        const [locRows, loreRows] = await Promise.all([
          sagaPermissionService.listBindings(sagaPublicId, 'location'),
          sagaPermissionService.listBindings(sagaPublicId, 'lore'),
        ]);
        if (cancelled) return;
        setLocations(locRows);
        setLore(loreRows);
        setDrawerError(null);
      } catch (err) {
        if (!cancelled) {
          setDrawerError(
            err instanceof Error ? err.message : 'Orte konnten nicht geladen werden',
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [drawerOpen, sagaPublicId]);

  const canReveal =
    Boolean(drawerPerms?.isGm)
    || hasSagaPermission(drawerPerms?.keys, 'saga.secrets.reveal');

  if (isLoading) {
    return (
      <div
        className="flex min-h-[20rem] items-center justify-center gap-2 text-sm text-muted-foreground"
        data-saga-world-map-loading
        data-saga-world-atlas-loading
      >
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Weltkarte wird geladen…
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-lg border border-destructive bg-destructive/10 p-3"
        role="alert"
        data-saga-world-atlas-error
      >
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!worldProfileId) {
    return (
      <div
        className="space-y-3 rounded-lg border border-dashed border-border p-6"
        data-saga-world-map-empty
        data-saga-world-atlas-empty
      >
        <p className="text-sm text-muted-foreground">
          Diese Saga ist noch mit keiner Welt verknüpft. Lege in der Bibliothek eine Welt an
          oder verknüpfe ein Weltprofil, um den Atlas zu nutzen.
        </p>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          onClick={() => onNavigate(pathForLibraryTab('worlds'))}
        >
          Zur Bibliothek › Welten
        </Button>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-[28rem] w-full min-w-0 flex-col gap-3"
      data-saga-world-map
      data-saga-world-atlas
      data-saga-world-atlas-ready
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="min-h-11 min-w-0"
          data-saga-world-atlas-orte
          onClick={() => setDrawerOpen(true)}
        >
          <MapPin className="size-4" aria-hidden />
          Orte
        </Button>
      </div>

      <div className="min-h-[28rem] w-full min-w-0" data-saga-world-atlas-canvas>
        <WorldAtlasWorkbench
          worldProfileId={worldProfileId}
          canEdit={canEdit}
          playerView={!canEdit}
          title="Welt → Karte"
        />
      </div>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md"
          data-saga-world-atlas-drawer
        >
          <SheetHeader className="border-b border-border pb-4 pr-10">
            <SheetTitle>Orte & Lore</SheetTitle>
            <SheetDescription>
              Sichtbarkeit steuert, was die Party auf der Karte und in Listen sieht.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-6 p-4">
            {drawerError ? (
              <p className="text-sm text-destructive" role="alert">
                {drawerError}
              </p>
            ) : null}
            <div className="space-y-2" data-saga-world-group="locations">
              <h3 className="text-sm font-semibold text-foreground">Orte</h3>
              <BindingRows
                rows={locations}
                projectId={drawerProjectId}
                canReveal={canReveal}
                empty="Noch keine Orte gebunden."
              />
            </div>
            <div className="space-y-2" data-saga-world-group="lore">
              <h3 className="text-sm font-semibold text-foreground">Lore (Welt)</h3>
              <BindingRows
                rows={lore}
                projectId={drawerProjectId}
                canReveal={canReveal}
                empty="Noch keine Lore-Einträge gebunden."
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
