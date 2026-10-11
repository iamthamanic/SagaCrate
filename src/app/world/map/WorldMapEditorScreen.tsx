/**
 * WorldMapEditorScreen — Composition root for world tile map editor (#580).
 * Location: src/app/world/map/WorldMapEditorScreen.tsx
 */
import { useState } from 'react';
import { useWorldMapEditor } from './useWorldMapEditor';
import { WorldMapToolbar } from './WorldMapToolbar';
import { WorldMapCanvas } from './WorldMapCanvas';
import { WorldMapSidebar } from './WorldMapSidebar';
import { WorldMapPinDialogs } from './WorldMapPinDialogs';

type Props = {
  worldProfileId: string;
};

export function WorldMapEditorScreen({ worldProfileId }: Props) {
  const editor = useWorldMapEditor({ worldProfileId });
  const [pinDraft, setPinDraft] = useState<{ x: number; y: number } | null>(null);

  return (
    <div
      className="flex flex-col gap-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      data-world-map-editor-screen
      data-au-surface="journey"
    >
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">Weltkarte</h2>
        <p className="text-sm text-muted-foreground">
          Kacheln und Pins — speichert serverseitig, keine Base64-Bilder.
        </p>
      </header>

      {editor.isLoading ? (
        <p className="text-sm text-muted-foreground">Karte wird geladen…</p>
      ) : null}
      {editor.error ? (
        <p className="text-sm text-destructive" role="alert" data-world-map-error>
          {editor.error}
        </p>
      ) : null}

      <WorldMapToolbar
        tool={editor.tool}
        brushType={editor.brushType}
        size={editor.data.size}
        maxSize={editor.maxSize}
        zoom={editor.zoom}
        isSaving={editor.isSaving}
        isDirty={editor.isDirty}
        onTool={editor.setTool}
        onBrush={editor.setBrushType}
        onSize={editor.setSize}
        onZoom={editor.setZoom}
        onUndo={editor.undo}
        onRedo={editor.redo}
        onSave={() => {
          void editor.saveNow();
        }}
      />

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="min-w-0 flex-1">
          <WorldMapCanvas
            data={editor.data}
            zoom={editor.zoom}
            tool={editor.tool}
            onPaint={editor.paintAt}
            onPinPlace={(x, y) => setPinDraft({ x, y })}
          />
        </div>
        <WorldMapSidebar
          data={editor.data}
          onSelectPin={() => undefined}
          onRemovePin={editor.removePin}
        />
      </div>

      <WorldMapPinDialogs
        open={pinDraft}
        worldProfileId={worldProfileId}
        onClose={() => setPinDraft(null)}
        onConfirm={(title, imagePath) => {
          if (!pinDraft) return;
          editor.addPin(pinDraft.x, pinDraft.y, title, imagePath);
          setPinDraft(null);
        }}
      />
    </div>
  );
}
