/**
 * useWorldMapEditor — Load/edit/save world tile map (#580).
 * Location: src/app/world/map/useWorldMapEditor.ts
 *
 * Hooks: useState / useEffect / useRef only.
 */
import { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_MAP_SIZE,
  MAX_MAP_SIZE,
  emptyWorldMapData,
  setTileAt,
  type WorldMapData,
  type WorldMapPin,
  type WorldMapTileType,
  type WorldMapTool,
} from '../../../domains/world/map';
import { worldMapService } from '../../../infrastructure/world/world-map-service';

const SAVE_DEBOUNCE_MS = 1000;
const HISTORY_CAP = 40;

export function useWorldMapEditor(input: { worldProfileId: string | null }) {
  const [data, setData] = useState<WorldMapData>(() => emptyWorldMapData(DEFAULT_MAP_SIZE));
  const [revision, setRevision] = useState(0);
  const [isLoading, setIsLoading] = useState(Boolean(input.worldProfileId));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tool, setTool] = useState<WorldMapTool>('brush');
  const [brushType, setBrushType] = useState<WorldMapTileType>('grass');
  const [zoom, setZoom] = useState(1);
  const [isDirty, setIsDirty] = useState(false);

  const history = useRef<WorldMapData[]>([]);
  const future = useRef<WorldMapData[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ data, revision, worldProfileId: input.worldProfileId });

  useEffect(() => {
    latest.current = { data, revision, worldProfileId: input.worldProfileId };
  }, [data, revision, input.worldProfileId]);

  useEffect(() => {
    const id = input.worldProfileId?.trim() ?? '';
    if (!id) {
      setData(emptyWorldMapData(DEFAULT_MAP_SIZE));
      setRevision(0);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    void worldMapService
      .getMap(id, false)
      .then((vm) => {
        if (cancelled) return;
        setData(vm.data);
        setRevision(vm.revision);
        history.current = [];
        future.current = [];
        setIsDirty(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Karte laden fehlgeschlagen');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [input.worldProfileId]);

  const pushHistory = (prev: WorldMapData) => {
    history.current = [...history.current.slice(-(HISTORY_CAP - 1)), prev];
    future.current = [];
  };

  const saveNowRef = useRef<() => Promise<boolean>>(async () => false);

  const saveNow = async (): Promise<boolean> => {
    const { worldProfileId, data: d, revision: rev } = latest.current;
    if (!worldProfileId) return false;
    setIsSaving(true);
    setError(null);
    try {
      const vm = await worldMapService.saveMap(worldProfileId, rev, d);
      setRevision(vm.revision);
      setData(vm.data);
      setIsDirty(false);
      latest.current = {
        data: vm.data,
        revision: vm.revision,
        worldProfileId,
      };
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen');
      return false;
    } finally {
      setIsSaving(false);
    }
  };
  saveNowRef.current = saveNow;

  const applyData = (next: WorldMapData, recordHistory: boolean) => {
    setData((prev) => {
      if (recordHistory) pushHistory(prev);
      return next;
    });
    setIsDirty(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveNowRef.current();
    }, SAVE_DEBOUNCE_MS);
  };

  const paintAt = (x: number, y: number) => {
    if (tool === 'pan' || tool === 'pin' || tool === 'party') return;
    const next =
      tool === 'eraser'
        ? setTileAt(data, x, y, { type: 'empty', countryId: null })
        : setTileAt(data, x, y, { type: brushType, countryId: null });
    applyData(next, true);
  };

  const setSize = (size: number) => {
    const n = Math.max(1, Math.min(MAX_MAP_SIZE, Math.floor(size)));
    applyData({ ...data, size: n }, true);
  };

  const undo = () => {
    const prev = history.current.pop();
    if (!prev) return;
    future.current.push(data);
    setData(prev);
    setIsDirty(true);
  };

  const redo = () => {
    const next = future.current.pop();
    if (!next) return;
    history.current.push(data);
    setData(next);
    setIsDirty(true);
  };

  const addPin = (x: number, y: number, title: string, imagePath: string | null) => {
    const pin: WorldMapPin = {
      id: `pin.${Date.now().toString(36)}`,
      x,
      y,
      title,
      imagePath,
      discovered: true,
    };
    applyData({ ...data, pins: [...data.pins, pin] }, true);
  };

  const updatePin = (pinId: string, patch: Partial<WorldMapPin>) => {
    applyData(
      {
        ...data,
        pins: data.pins.map((p) => (p.id === pinId ? { ...p, ...patch } : p)),
      },
      true,
    );
  };

  const removePin = (pinId: string) => {
    applyData({ ...data, pins: data.pins.filter((p) => p.id !== pinId) }, true);
  };

  return {
    data,
    revision,
    isLoading,
    isSaving,
    error,
    isDirty,
    tool,
    setTool,
    brushType,
    setBrushType,
    zoom,
    setZoom,
    paintAt,
    setSize,
    undo,
    redo,
    canUndo: history.current.length > 0,
    canRedo: future.current.length > 0,
    addPin,
    updatePin,
    removePin,
    saveNow,
    maxSize: MAX_MAP_SIZE,
  };
}
