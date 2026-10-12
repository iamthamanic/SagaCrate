/**
 * SagaWorldCatalogPanel — Welt maps / locations / lore bindings (#618).
 * Location: src/app/project/SagaWorldCatalogPanel.tsx
 *
 * Fills Phase-1 Look-only Welt shell with seeded Dornhain catalog rows.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { Loader2, Map, MapPin, BookOpen } from 'lucide-react';
import {
  hasSagaPermission,
  revealLabelDe,
} from '../../domains/saga/permissions';
import {
  sagaPermissionService,
  type SagaAssetBindingVm,
  type SagaMyPermissionsVm,
} from '../../infrastructure/project/saga-permission-service';
import { projectService } from '../../infrastructure/project/project-service';
import { SagaBindingRevealControl } from './SagaBindingRevealControl';

export type SagaWorldCatalogPanelProps = {
  sagaPublicId: string;
};

function BindingGroup(props: {
  title: string;
  icon: ReactNode;
  rows: SagaAssetBindingVm[];
  projectId: string | null;
  canReveal: boolean;
  empty: string;
  testId: string;
}) {
  return (
    <section className="space-y-2" data-saga-world-group={props.testId}>
      <div className="flex items-center gap-2">
        {props.icon}
        <h3 className="text-sm font-semibold text-foreground">{props.title}</h3>
      </div>
      {props.rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{props.empty}</p>
      ) : (
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
                <p className="text-xs text-muted-foreground">
                  {revealLabelDe(b.reveal)}
                </p>
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
      )}
    </section>
  );
}

export function SagaWorldCatalogPanel({ sagaPublicId }: SagaWorldCatalogPanelProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [perms, setPerms] = useState<SagaMyPermissionsVm | null>(null);
  const [maps, setMaps] = useState<SagaAssetBindingVm[]>([]);
  const [locations, setLocations] = useState<SagaAssetBindingVm[]>([]);
  const [lore, setLore] = useState<SagaAssetBindingVm[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const project = await projectService.getProjectByPublicId(sagaPublicId);
        const my = await sagaPermissionService.getMyPermissions(sagaPublicId);
        const [mapRows, locRows, loreRows] = await Promise.all([
          sagaPermissionService.listBindings(sagaPublicId, 'map'),
          sagaPermissionService.listBindings(sagaPublicId, 'location'),
          sagaPermissionService.listBindings(sagaPublicId, 'lore'),
        ]);
        if (cancelled) return;
        setProjectId(project.id);
        setPerms(my);
        setMaps(mapRows);
        setLocations(locRows);
        setLore(loreRows);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Welt-Katalog konnte nicht geladen werden');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sagaPublicId]);

  const canReveal =
    Boolean(perms?.isGm)
    || hasSagaPermission(perms?.keys, 'saga.secrets.reveal');

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground" data-saga-world-loading>
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Welt-Katalog wird geladen…
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-destructive" role="alert" data-saga-world-error>
        {error}
      </p>
    );
  }

  return (
    <div className="space-y-6" data-saga-world-catalog>
      <p className="text-sm text-muted-foreground">
        Karten, Orte und Lore dieser Saga (Reveal steuert Party-Sicht).
      </p>
      <BindingGroup
        title="Karten"
        icon={<Map className="size-4 text-muted-foreground" aria-hidden />}
        rows={maps}
        projectId={projectId}
        canReveal={canReveal}
        empty="Noch keine Karten gebunden."
        testId="maps"
      />
      <BindingGroup
        title="Orte"
        icon={<MapPin className="size-4 text-muted-foreground" aria-hidden />}
        rows={locations}
        projectId={projectId}
        canReveal={canReveal}
        empty="Noch keine Orte gebunden."
        testId="locations"
      />
      <BindingGroup
        title="Lore (Welt)"
        icon={<BookOpen className="size-4 text-muted-foreground" aria-hidden />}
        rows={lore}
        projectId={projectId}
        canReveal={canReveal}
        empty="Noch keine Lore-Einträge gebunden."
        testId="lore"
      />
    </div>
  );
}
