/**
 * AccountAvatarSection — Dropzone box for account avatar (click + drag-drop) (#682).
 * Location: src/app/profile/AccountAvatarSection.tsx
 *
 * Square upload surface is the primary control; Media Optimizer intake unchanged.
 */
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../lib/auth-context';
import {
  initialsFromDisplayName,
  resolveAccountDisplayName,
  type UserProfileVm,
} from '../../domains/user-profile';
import { userProfileService } from '../../infrastructure/user-profile/user-profile-service';
import { useMediaOptimizeIntake } from '../media';
import { Button } from '../../shared/ui/button';
import { Label } from '../../shared/ui/label';
import { cn } from '../../shared/ui/utils';

const ACCEPT_MIME = 'image/png,image/jpeg,image/webp';

function isAcceptedImageFile(file: File): boolean {
  const type = file.type.trim().toLowerCase();
  return type === 'image/png' || type === 'image/jpeg' || type === 'image/webp';
}

export function AccountAvatarSection() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const [profile, setProfile] = useState<UserProfileVm | null>(null);
  const [remoteUrl, setRemoteUrl] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const intake = useMediaOptimizeIntake({
    profileId: 'user-avatar',
    kind: 'image',
  });

  const authMeta = user?.user_metadata ?? {};
  const displayName =
    resolveAccountDisplayName({
      profileDisplayName: profile?.displayName,
      authDisplayName:
        typeof authMeta.display_name === 'string' ? authMeta.display_name : null,
      authUsername: typeof authMeta.username === 'string' ? authMeta.username : null,
      email: user?.email ?? null,
    }) ?? 'User';
  const initials = initialsFromDisplayName(displayName);
  const previewSrc = intake.previewUrl || remoteUrl;
  const busy = uploading || intake.isBusy || loadingProfile;
  const dropHint = previewSrc
    ? 'Profilbild ändern — klicken oder Bild hierher ziehen'
    : 'Profilbild hinzufügen — klicken oder Bild hierher ziehen (PNG/JPEG/WebP)';

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user) {
        setLoadingProfile(false);
        return;
      }
      setLoadingProfile(true);
      try {
        const row = await userProfileService.getOwnProfile();
        if (cancelled) return;
        setProfile(row);
        setRemoteUrl(row?.avatarUrl ?? null);
      } catch (err) {
        console.error('Account profile load failed:', err);
        if (!cancelled) {
          toast.error(
            err instanceof Error ? err.message : 'Profil konnte nicht geladen werden',
          );
        }
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const openFilePicker = () => {
    if (busy) return;
    fileInputRef.current?.click();
  };

  const persistOptimized = async (file: File) => {
    if (!isAcceptedImageFile(file)) {
      toast.error('Nur PNG, JPEG oder WebP sind erlaubt.');
      return;
    }
    setUploading(true);
    try {
      const outcome = await intake.selectFile(file, {
        profileId: 'user-avatar',
        kind: 'image',
      });
      if (outcome.status !== 'ready' || !outcome.ready) {
        toast.error(
          outcome.errorMessage ??
            'Avatar-Optimierung fehlgeschlagen. Bestehendes Avatar bleibt erhalten.',
        );
        return;
      }

      const base = file.name.replace(/\.[^.]+$/, '') || 'avatar';
      const ext =
        outcome.ready.uploadMimeType === 'image/webp'
          ? 'webp'
          : outcome.ready.uploadMimeType === 'image/jpeg'
            ? 'jpg'
            : 'png';
      const uploadFile = new File([outcome.ready.uploadBlob], `${base}.${ext}`, {
        type: outcome.ready.uploadMimeType,
      });

      await intake.upload(async () => {
        const next = await userProfileService.uploadAvatar(uploadFile, {
          alreadyOptimized: true,
        });
        setProfile(next);
        setRemoteUrl(next.avatarUrl);
      });
      toast.success('Profilbild gespeichert');
    } catch (err) {
      console.error('Account avatar upload error:', err);
      // Do not clear remoteUrl — previous avatar survives failed attempts.
      toast.error(err instanceof Error ? err.message : 'Avatar konnte nicht gespeichert werden');
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    void persistOptimized(file);
  };

  const onDragEnter = (event: DragEvent) => {
    if (busy) return;
    event.preventDefault();
    dragDepthRef.current += 1;
    setDragOver(true);
  };

  const onDragOver = (event: DragEvent) => {
    if (busy) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const onDragLeave = (event: DragEvent) => {
    if (busy) return;
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setDragOver(false);
  };

  const onDrop = (event: DragEvent) => {
    if (busy) return;
    event.preventDefault();
    dragDepthRef.current = 0;
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    void persistOptimized(file);
  };

  const onZoneKeyDown = (event: KeyboardEvent) => {
    if (busy) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openFilePicker();
    }
  };

  const retry = async () => {
    if (!intake.sourceFile) return;
    setUploading(true);
    try {
      const outcome = await intake.retry();
      if (!outcome || outcome.status !== 'ready' || !outcome.ready || !intake.sourceFile) {
        toast.error(
          outcome?.errorMessage ??
            'Avatar-Optimierung fehlgeschlagen. Bestehendes Avatar bleibt erhalten.',
        );
        return;
      }
      const file = intake.sourceFile;
      const base = file.name.replace(/\.[^.]+$/, '') || 'avatar';
      const ext =
        outcome.ready.uploadMimeType === 'image/webp'
          ? 'webp'
          : outcome.ready.uploadMimeType === 'image/jpeg'
            ? 'jpg'
            : 'png';
      const uploadFile = new File([outcome.ready.uploadBlob], `${base}.${ext}`, {
        type: outcome.ready.uploadMimeType,
      });
      await intake.upload(async () => {
        const next = await userProfileService.uploadAvatar(uploadFile, {
          alreadyOptimized: true,
        });
        setProfile(next);
        setRemoteUrl(next.avatarUrl);
      });
      toast.success('Profilbild gespeichert');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Avatar konnte nicht gespeichert werden');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4" data-account-avatar-section>
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
        <div
          role="button"
          tabIndex={busy ? -1 : 0}
          className={cn(
            'group relative flex size-28 shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors md:size-32',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            dragOver
              ? 'border-primary bg-primary/10'
              : 'border-border/70 bg-muted/20 hover:border-primary/60 hover:bg-muted/35',
            busy ? 'cursor-wait opacity-80' : 'cursor-pointer',
          )}
          data-account-avatar
          data-account-avatar-dropzone
          data-account-avatar-upload
          aria-label={dropHint}
          aria-busy={busy}
          onClick={openFilePicker}
          onKeyDown={onZoneKeyDown}
          onDragEnter={onDragEnter}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          {previewSrc ? (
            <img
              src={previewSrc}
              alt=""
              className="absolute inset-0 size-full object-cover"
              data-account-avatar-image
            />
          ) : (
            <span
              className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl"
              aria-hidden
            >
              {initials}
            </span>
          )}

          {previewSrc ? (
            <div
              className={cn(
                'absolute inset-0 flex flex-col items-center justify-center gap-1 bg-background/75 px-2 text-center opacity-0 transition-opacity',
                'group-hover:opacity-100 group-focus-visible:opacity-100',
                dragOver && 'opacity-100',
              )}
              aria-hidden
            >
              <ImagePlus className="size-5 text-foreground" />
              <span className="text-[0.7rem] font-medium leading-tight text-foreground">
                Ändern
              </span>
            </div>
          ) : null}

          {busy ? (
            <div
              className="absolute inset-0 flex items-center justify-center bg-background/60"
              aria-hidden
            >
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : null}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <p className="truncate text-base font-medium" data-account-display-name>
            {displayName}
          </p>
          <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
          <p className="text-xs leading-snug text-muted-foreground">{dropHint}</p>
          <div className="flex flex-wrap gap-2">
            {intake.canRetry ? (
              <Button
                type="button"
                variant="secondary"
                className="min-h-11"
                disabled={busy}
                onClick={() => void retry()}
                data-account-avatar-retry
              >
                Erneut
              </Button>
            ) : null}
            {intake.isBusy ? (
              <Button
                type="button"
                variant="ghost"
                className="min-h-11"
                onClick={() => intake.abort()}
                data-account-avatar-abort
              >
                Abbrechen
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT_MIME}
        className="sr-only"
        onChange={onFileChange}
        data-account-avatar-file
        tabIndex={-1}
      />

      <div aria-live="polite" className="text-sm text-muted-foreground" data-account-avatar-status>
        <Label className="sr-only">Avatar-Status</Label>
        {intake.statusLabelDe}
        {intake.errorMessage ? (
          <span className="mt-1 block text-destructive">{intake.errorMessage}</span>
        ) : null}
      </div>
    </div>
  );
}
