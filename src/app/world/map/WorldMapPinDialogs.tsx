/**
 * WorldMapPinDialogs — Create/edit pin dialog with preview-first optimize (#580/#637).
 * Location: src/app/world/map/WorldMapPinDialogs.tsx
 */
import { useEffect, useRef, useState } from 'react';
import { Button } from '../../../shared/ui/button';
import { Input } from '../../../shared/ui/input';
import { Label } from '../../../shared/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../shared/ui/dialog';
import { useMediaOptimizeIntake } from '../../media';
import { worldMapService } from '../../../infrastructure/world/world-map-service';

type Draft = { x: number; y: number } | null;

type Props = {
  open: Draft;
  worldProfileId: string;
  onClose: () => void;
  onConfirm: (title: string, imagePath: string | null) => void;
};

const MAP_PIN_MAX_BYTES = 5 * 1024 * 1024;

export function WorldMapPinDialogs({ open, worldProfileId, onClose, onConfirm }: Props) {
  const [title, setTitle] = useState('Ort');
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const intake = useMediaOptimizeIntake({ profileId: 'map-pin', kind: 'image' });
  const previousPathRef = useRef<string | null>(null);

  const resetIntake = intake.reset;
  const wasOpenRef = useRef(false);
  useEffect(() => {
    const isOpen = open != null;
    if (wasOpenRef.current && !isOpen) {
      resetIntake();
      setTitle('Ort');
      setImagePath(null);
      setError(null);
      setBusy(false);
      previousPathRef.current = null;
      if (fileRef.current) fileRef.current.value = '';
    }
    wasOpenRef.current = isOpen;
  }, [open, resetIntake]);

  const runUpload = async (file: File) => {
    setBusy(true);
    setError(null);
    const priorPath = imagePath;
    previousPathRef.current = priorPath;
    try {
      if (file.size > MAP_PIN_MAX_BYTES) {
        throw new Error('Bild ist zu groß. Maximum 5 MB');
      }
      const outcome = await intake.selectFile(file, {
        profileId: 'map-pin',
        kind: 'image',
      });
      if (outcome.status !== 'ready' || !outcome.ready) {
        throw new Error(
          outcome.errorMessage ?? 'Pin-Bild-Optimierung fehlgeschlagen. Bisheriges Bild bleibt erhalten.',
        );
      }
      const base = file.name.replace(/\.[^.]+$/, '') || 'pin';
      const ext =
        outcome.ready.uploadMimeType === 'image/webp'
          ? 'webp'
          : outcome.ready.uploadMimeType === 'image/png'
            ? 'png'
            : 'jpg';
      const uploadFile = new File([outcome.ready.uploadBlob], `${base}.${ext}`, {
        type: outcome.ready.uploadMimeType,
      });
      await intake.upload(async () => {
        const path = await worldMapService.uploadPinImage(worldProfileId, uploadFile, {
          alreadyOptimized: true,
        });
        setImagePath(path);
      });
    } catch (err) {
      // Keep prior Storage path on failure (map JSON still references old path if any).
      if (priorPath) setImagePath(priorPath);
      setError(err instanceof Error ? err.message : 'Upload fehlgeschlagen');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open != null}
      onOpenChange={(v) => {
        if (!v) {
          intake.abort();
          onClose();
        }
      }}
    >
      <DialogContent data-world-map-pin-dialog>
        <DialogHeader>
          <DialogTitle>Pin setzen</DialogTitle>
        </DialogHeader>
        {open ? (
          <p className="text-sm text-muted-foreground">
            Feld ({open.x}, {open.y})
          </p>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="world-map-pin-title">Titel</Label>
          <Input
            id="world-map-pin-title"
            className="min-h-11"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div
          className="space-y-2"
          aria-live="polite"
          aria-busy={busy || intake.isBusy}
        >
          <Label htmlFor="world-map-pin-file">Bild (optional, Storage)</Label>
          <input
            id="world-map-pin-file"
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="block w-full text-sm min-h-11"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              void runUpload(file);
            }}
          />
          {intake.previewUrl ? (
            <img
              src={intake.previewUrl}
              alt="Pin-Bild Vorschau"
              className="h-20 w-20 rounded-md object-cover border border-border"
            />
          ) : null}
          <p className="text-xs text-muted-foreground">
            {intake.status === 'idle' || intake.status === 'complete'
              ? imagePath
                ? imagePath
                : 'Kein Bild'
              : intake.statusLabelDe}
          </p>
          {intake.canRetry && intake.sourceFile ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="min-h-11"
              disabled={busy}
              onClick={() => {
                const file = intake.sourceFile;
                if (file) void runUpload(file);
              }}
              aria-label="Pin-Bild Optimierung erneut versuchen"
            >
              Erneut
            </Button>
          ) : null}
          {intake.isBusy ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="min-h-11"
              onClick={() => intake.abort()}
              aria-label="Pin-Bild Optimierung abbrechen"
            >
              Abbrechen
            </Button>
          ) : null}
        </div>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" className="min-h-11" onClick={onClose}>
            Abbrechen
          </Button>
          <Button
            type="button"
            className="min-h-11"
            disabled={busy || intake.isBusy || !title.trim()}
            onClick={() => onConfirm(title.trim(), imagePath)}
          >
            Pin speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
