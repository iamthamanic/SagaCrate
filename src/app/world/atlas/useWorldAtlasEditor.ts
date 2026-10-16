/**
 * useWorldAtlasEditor — load/list/save hierarchical atlas maps (#702).
 * Location: src/app/world/atlas/useWorldAtlasEditor.ts
 */
import { useCallback, useEffect, useState } from 'react';
import type {
  WorldAtlasFeatureCollection,
  WorldAtlasMapSummary,
  WorldAtlasMapVm,
} from '../../../domains/world/atlas';
import { worldAtlasService } from '../../../infrastructure/world/world-atlas-service';

export type UseWorldAtlasEditorOptions = {
  readonly worldProfileId: string | null;
  readonly playerView?: boolean;
  readonly canEdit?: boolean;
};

export function useWorldAtlasEditor({
  worldProfileId,
  playerView = false,
  canEdit = false,
}: UseWorldAtlasEditorOptions) {
  const [summaries, setSummaries] = useState<WorldAtlasMapSummary[]>([]);
  const [activeMapId, setActiveMapId] = useState<string | null>(null);
  const [map, setMap] = useState<WorldAtlasMapVm | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirtyLayers, setDirtyLayers] = useState<WorldAtlasFeatureCollection | null>(null);

  const reloadList = useCallback(async () => {
    const id = worldProfileId?.trim() ?? '';
    if (!id) {
      setSummaries([]);
      setActiveMapId(null);
      setMap(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = canEdit
        ? await worldAtlasService.ensureRoot(id)
        : await worldAtlasService.listMaps(id);
      setSummaries(list);
      setActiveMapId((prev) => {
        if (prev && list.some((m) => m.id === prev)) return prev;
        return list[0]?.id ?? null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Atlas konnte nicht geladen werden.');
      setSummaries([]);
    } finally {
      setLoading(false);
    }
  }, [worldProfileId, canEdit]);

  useEffect(() => {
    void reloadList();
  }, [reloadList]);

  useEffect(() => {
    let cancelled = false;
    const id = activeMapId;
    if (!id) {
      setMap(null);
      setDirtyLayers(null);
      return;
    }
    setLoading(true);
    setError(null);
    void worldAtlasService
      .getMap(id, playerView)
      .then((vm) => {
        if (cancelled) return;
        setMap(vm);
        setDirtyLayers(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Karte konnte nicht geladen werden.');
        setMap(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeMapId, playerView]);

  const saveLayers = useCallback(
    async (layers: WorldAtlasFeatureCollection) => {
      if (!map || !canEdit) return;
      setSaving(true);
      setError(null);
      try {
        const next = await worldAtlasService.upsertMap({
          worldProfileId: map.worldProfileId,
          mapId: map.id,
          parentMapId: map.parentMapId,
          kind: map.kind,
          title: map.title,
          sortOrder: map.sortOrder,
          bounds: map.bounds,
          layers,
          basemapStoragePath: map.basemapStoragePath,
          azgaarMapStoragePath: map.azgaarMapStoragePath,
          generatorMeta: map.generatorMeta,
          expectedRevision: map.revision,
        });
        setMap(next);
        setDirtyLayers(null);
        await reloadList();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.');
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [map, canEdit, reloadList],
  );

  const createChildMap = useCallback(
    async (title: string) => {
      if (!map || !canEdit || !worldProfileId) return;
      setSaving(true);
      setError(null);
      try {
        const next = await worldAtlasService.upsertMap({
          worldProfileId,
          mapId: null,
          parentMapId: map.id,
          kind: 'region',
          title: title.trim() || 'Detailkarte',
          bounds: map.bounds,
          layers: { type: 'FeatureCollection', features: [] },
          generatorMeta: { engine: 'manual' },
        });
        await reloadList();
        setActiveMapId(next.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Detailkarte fehlgeschlagen.');
      } finally {
        setSaving(false);
      }
    },
    [map, canEdit, worldProfileId, reloadList],
  );

  const importAzgaarMap = useCallback(
    async (file: File) => {
      if (!map || !canEdit || !worldProfileId) return;
      setSaving(true);
      setError(null);
      try {
        const path = await worldAtlasService.uploadAzgaarMapFile(worldProfileId, file);
        const next = await worldAtlasService.upsertMap({
          worldProfileId,
          mapId: map.id,
          parentMapId: map.parentMapId,
          kind: map.kind === 'legacy_tiles' ? 'world' : map.kind,
          title: map.title,
          sortOrder: map.sortOrder,
          bounds: map.bounds,
          layers: dirtyLayers ?? map.layers,
          basemapStoragePath: map.basemapStoragePath,
          azgaarMapStoragePath: path,
          generatorMeta: { ...map.generatorMeta, engine: 'azgaar', importedAt: new Date().toISOString() },
          expectedRevision: map.revision,
        });
        setMap(next);
        await reloadList();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Azgaar-Import fehlgeschlagen.');
      } finally {
        setSaving(false);
      }
    },
    [map, canEdit, worldProfileId, dirtyLayers, reloadList],
  );

  const breadcrumb = (() => {
    if (!map) return [] as WorldAtlasMapSummary[];
    const byId = new Map(summaries.map((s) => [s.id, s]));
    const chain: WorldAtlasMapSummary[] = [];
    let cur: WorldAtlasMapSummary | undefined = byId.get(map.id);
    const guard = new Set<string>();
    while (cur && !guard.has(cur.id)) {
      guard.add(cur.id);
      chain.unshift(cur);
      cur = cur.parentMapId ? byId.get(cur.parentMapId) : undefined;
    }
    return chain;
  })();

  return {
    summaries,
    activeMapId,
    setActiveMapId,
    map,
    loading,
    saving,
    error,
    dirtyLayers,
    setDirtyLayers,
    saveLayers,
    createChildMap,
    importAzgaarMap,
    breadcrumb,
    reloadList,
  };
}
