/**
 * LobbyMediaPreviewSection — Meet-style camera / mic / LiveAct cards for lobby (#678).
 * Location: src/app/session/LobbyMediaPreviewSection.tsx
 */
import { useEffect, useRef } from 'react';
import { Button } from '../../shared/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../shared/ui/select';
import {
  lobbyLiveActStatusLabelDe,
  lobbyMediaDeviceLabel,
  lobbyMediaStatusLabelDe,
} from '../../domains/session/contracts/session-lobby';
import type { UseLobbyMediaPreviewResult } from './hooks/useLobbyMediaPreview';

type LobbyMediaPreviewSectionProps = {
  readonly media: UseLobbyMediaPreviewResult;
};

function CameraPreview({ stream }: { stream: MediaStream | null }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.srcObject = stream;
    if (stream) {
      void el.play().catch(() => undefined);
    }
    return () => {
      el.srcObject = null;
    };
  }, [stream]);
  return (
    <video
      ref={videoRef}
      className="h-full w-full object-cover"
      playsInline
      muted
      autoPlay
      data-session-lobby-camera-preview
    />
  );
}

export function LobbyMediaPreviewSection({ media }: LobbyMediaPreviewSectionProps) {
  const cameraActive = media.cameraStatus === 'granted' && media.cameraStream != null;
  const micActive = media.microphoneStatus === 'granted';
  const levelPct = Math.round(media.microphoneLevel * 100);

  return (
    <section
      className="rounded-lg border border-border bg-card/40 p-4"
      data-session-lobby-media
    >
      <h2 className="text-sm font-medium">Geräte & LiveAct</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Kamera, Mikrofon und LiveAct starten nur nach deinem Klick — nie automatisch.
        Fehlende Geräte blockieren den Session-Start nicht.
      </p>
      <div className="mt-3 grid gap-3 @[40rem]/main:grid-cols-3">
        {/* Camera */}
        <div
          className="flex min-w-0 flex-col rounded-md border border-border/60 p-3"
          data-session-lobby-camera-card
        >
          <p className="text-xs text-muted-foreground">Kamera</p>
          <p className="text-sm" data-lobby-camera-status>
            {lobbyMediaStatusLabelDe(media.cameraStatus)}
          </p>
          <div className="mt-2 aspect-video w-full overflow-hidden rounded-md bg-muted">
            {cameraActive ? (
              <CameraPreview stream={media.cameraStream} />
            ) : (
              <div
                className="flex h-full items-center justify-center px-2 text-center text-xs text-muted-foreground"
                data-session-lobby-camera-idle
              >
                Noch kein Kamerabild
              </div>
            )}
          </div>
          {media.cameraDevices.length > 0 ? (
            <Select
              value={media.selectedCameraId ?? undefined}
              onValueChange={(id) => void media.selectCamera(id)}
            >
              <SelectTrigger
                className="mt-2 min-h-11 w-full"
                aria-label="Kamera wählen"
                data-session-lobby-camera-select
              >
                <SelectValue placeholder="Kamera wählen" />
              </SelectTrigger>
              <SelectContent>
                {media.cameraDevices.map((d, i) => (
                  <SelectItem key={d.deviceId} value={d.deviceId}>
                    {lobbyMediaDeviceLabel(d, i)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <div className="mt-2 flex gap-2">
            {cameraActive ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="min-h-11 flex-1"
                onClick={media.stopCamera}
                data-session-lobby-stop-camera
              >
                Stoppen
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="min-h-11 w-full"
                onClick={() => void media.startCamera()}
                data-session-lobby-probe-camera
              >
                Kamera prüfen
              </Button>
            )}
          </div>
        </div>

        {/* Microphone */}
        <div
          className="flex min-w-0 flex-col rounded-md border border-border/60 p-3"
          data-session-lobby-mic-card
        >
          <p className="text-xs text-muted-foreground">Mikrofon</p>
          <p className="text-sm" data-lobby-mic-status>
            {lobbyMediaStatusLabelDe(media.microphoneStatus)}
          </p>
          <div
            className="mt-2 flex h-[4.5rem] items-end rounded-md bg-muted px-3 py-2"
            data-session-lobby-mic-meter
            aria-label={`Mikrofonpegel ${levelPct} Prozent`}
          >
            <div className="flex h-full w-full items-end gap-0.5">
              {Array.from({ length: 16 }, (_, i) => {
                const threshold = (i + 1) / 16;
                const on = micActive && media.microphoneLevel >= threshold * 0.85;
                return (
                  <div
                    key={i}
                    className={`min-w-0 flex-1 rounded-sm transition-colors ${
                      on ? 'bg-primary' : 'bg-border'
                    }`}
                    style={{ height: `${12 + i * 5}%` }}
                  />
                );
              })}
            </div>
          </div>
          {media.microphoneDevices.length > 0 ? (
            <Select
              value={media.selectedMicrophoneId ?? undefined}
              onValueChange={(id) => void media.selectMicrophone(id)}
            >
              <SelectTrigger
                className="mt-2 min-h-11 w-full"
                aria-label="Mikrofon wählen"
                data-session-lobby-mic-select
              >
                <SelectValue placeholder="Mikrofon wählen" />
              </SelectTrigger>
              <SelectContent>
                {media.microphoneDevices.map((d, i) => (
                  <SelectItem key={d.deviceId} value={d.deviceId}>
                    {lobbyMediaDeviceLabel(d, i)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <div className="mt-2">
            {micActive ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="min-h-11 w-full"
                onClick={media.stopMicrophone}
                data-session-lobby-stop-mic
              >
                Stoppen
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="min-h-11 w-full"
                onClick={() => void media.startMicrophone()}
                data-session-lobby-probe-mic
              >
                Mikrofon prüfen
              </Button>
            )}
          </div>
        </div>

        {/* LiveAct */}
        <div
          className="flex min-w-0 flex-col rounded-md border border-border/60 p-3"
          data-session-lobby-liveact-card
        >
          <p className="text-xs text-muted-foreground">LiveAct</p>
          <p className="text-sm" data-lobby-liveact-status>
            {lobbyLiveActStatusLabelDe(media.liveActStatus)}
          </p>
          <div className="mt-2 flex aspect-video w-full items-center justify-center overflow-hidden rounded-md bg-muted">
            {media.liveActActive && media.liveActPreview ? (
              media.liveActPreview.imageUrl ? (
                <img
                  src={media.liveActPreview.imageUrl}
                  alt={media.liveActPreview.name}
                  className="h-full w-full object-cover"
                  data-session-lobby-liveact-preview
                />
              ) : (
                <div
                  className="flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-center"
                  data-session-lobby-liveact-preview
                >
                  <span className="text-2xl font-semibold text-muted-foreground">
                    {media.liveActPreview.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="text-xs text-muted-foreground line-clamp-2">
                    {media.liveActPreview.name}
                  </span>
                </div>
              )
            ) : (
              <div
                className="px-2 text-center text-xs text-muted-foreground"
                data-session-lobby-liveact-idle
              >
                Noch keine Vorschau
              </div>
            )}
          </div>
          {media.liveActHintDe ? (
            <p className="mt-2 text-xs text-muted-foreground" role="status">
              {media.liveActHintDe}
            </p>
          ) : null}
          {media.liveActActive && media.liveActOptions.length > 1 ? (
            <Select
              value={media.selectedLiveActOptionId ?? undefined}
              onValueChange={media.selectLiveActOption}
            >
              <SelectTrigger
                className="mt-2 min-h-11 w-full"
                aria-label="LiveAct-Vorschau wählen"
                data-session-lobby-liveact-select
              >
                <SelectValue placeholder="NPC wählen" />
              </SelectTrigger>
              <SelectContent>
                {media.liveActOptions.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <div className="mt-2">
            {media.liveActActive ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="min-h-11 w-full"
                onClick={media.stopLiveAct}
                data-session-lobby-stop-liveact
              >
                Stoppen
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="min-h-11 w-full"
                onClick={() => void media.startLiveAct()}
                data-session-lobby-probe-liveact
              >
                LiveAct prüfen
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
