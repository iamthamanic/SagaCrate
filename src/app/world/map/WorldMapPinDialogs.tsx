/**
 * WorldMapPinDialogs — Create/edit pin dialog (#580).
 * Location: src/app/world/map/WorldMapPinDialogs.tsx
 */
import { useRef, useState } from 'react';
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
import { worldMapService } from '../../../infrastructure/world/world-map-service';

type Draft = { x: number; y: number } | null;

type Props = {
  open: Draft;
  worldProfileId: string;
  onClose: () => void;
  onConfirm: (title: string, imagePath: string | null) => void;
};

export function WorldMapPinDialogs({ open, worldProfileId, onClose, onConfirm }: Props) {
  const [title, setTitle] = useState('Ort');
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  return (
    <Dialog
      open={open != null}
      onOpenChange={(v) => {
        if (!v) onClose();
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
        <div className="space-y-2">
          <Label htmlFor="world-map-pin-file">Bild (optional, Storage)</Label>
          <input
            id="world-map-pin-file"
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="block w-full text-sm"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setBusy(true);
              setError(null);
              void worldMapService
                .uploadPinImage(worldProfileId, file)
                .then((path) => setImagePath(path))
                .catch((err) =>
                  setError(err instanceof Error ? err.message : 'Upload fehlgeschlagen'),
                )
                .finally(() => setBusy(false));
            }}
          />
          {imagePath ? (
            <p className="truncate text-xs text-muted-foreground">{imagePath}</p>
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
            disabled={busy || !title.trim()}
            onClick={() => onConfirm(title.trim(), imagePath)}
          >
            Pin speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
