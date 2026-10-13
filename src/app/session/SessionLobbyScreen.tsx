/**
 * SessionLobbyScreen — Canonical Player/GM preflight lobby (#491).
 * Location: src/app/session/SessionLobbyScreen.tsx
 *
 * Shared surface with role-projected CTAs. Media/LiveAct only after user gesture.
 * Join code is the primary share affordance after session create (Peak-End).
 */
import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../shared/ui/button';
import { AdaptivePage } from '../../shared/ui/adaptive';
import { decideLobbyEnterLive, lobbyLiveActStatusLabelDe, lobbyMediaStatusLabelDe } from '../../domains/session/contracts/session-lobby';
import { buildSessionJoinPath } from '../../domains/session/contracts/session-entry-routing';
import { pathForSessionLive } from '../shell';
import { useSessionLobby } from './hooks/useSessionLobby';
import { SessionInviteShareButton } from './SessionInviteShareButton';

type SessionLobbyScreenProps = {
  sagaPublicId: string;
  sessionPublicId: string;
  onNavigateHome: () => void;
  onNavigate: (path: string) => void;
};

export function SessionLobbyScreen({
  sagaPublicId,
  sessionPublicId,
  onNavigateHome,
  onNavigate,
}: SessionLobbyScreenProps) {
  const {
    model,
    isLoading,
    error,
    cameraStatus,
    microphoneStatus,
    liveActStatus,
    setReady,
    probeCamera,
    probeMicrophone,
    probeLiveAct,
    refresh,
  } = useSessionLobby({ sagaPublicId, sessionPublicId });

  const selfReady = model?.roster.find((m) => m.isSelf)?.isReady === true;
  const [codeCopied, setCodeCopied] = useState(false);

  const handleCopyCode = async () => {
    const code = model?.summary.code?.trim();
    if (!code) {
      toast.error('Kein Session-Code verfügbar');
      return;
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = code;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCodeCopied(true);
      toast.success('Code kopiert!');
      window.setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      toast.error('Code konnte nicht kopiert werden');
    }
  };

  const handleEnter = () => {
    if (!model) return;
    const decision = decideLobbyEnterLive({
      role: model.selfRole,
      sagaPublicId: model.summary.sagaPublicId,
      sessionPublicId: model.summary.sessionPublicId,
      characterPublicId: model.selfCharacterPublicId,
    });
    if (decision.kind === 'blocked') {
      return;
    }
    if (decision.kind === 'gamemaster-live') {
      onNavigate(
        pathForSessionLive(decision.sagaPublicId, decision.sessionPublicId, 'gamemaster'),
      );
      return;
    }
    onNavigate(
      pathForSessionLive(
        decision.sagaPublicId,
        decision.sessionPublicId,
        'player',
        decision.characterPublicId,
      ),
    );
  };

  const handleChangeCharacter = () => {
    onNavigate(
      buildSessionJoinPath({
        sagaPublicId,
        intent: 'join',
      }),
    );
  };

  return (
    <AdaptivePage data-au-surface="session-lobby" className="h-full w-full">
      <div
        className="mx-auto flex h-full max-w-3xl flex-col gap-4 overflow-y-auto p-4 sm:p-6"
        data-session-lobby="v1"
      >
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Session-Lobby
            </p>
            <h1 className="text-2xl font-semibold text-foreground">
              {model?.summary.sessionName ?? 'Lobby'}
            </h1>
            {model?.summary.sagaName ? (
              <p className="text-sm text-muted-foreground">{model.summary.sagaName}</p>
            ) : null}
          </div>
          <Button type="button" variant="ghost" className="min-h-11" onClick={onNavigateHome}>
            Verlassen
          </Button>
        </header>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Lobby wird geladen…</p>
        ) : null}

        {error ? (
          <p className="text-sm text-destructive" role="alert" data-session-lobby-error>
            {error}
          </p>
        ) : null}

        {model?.summary.code ? (
          <div
            className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-stretch"
            data-session-lobby-join-hero
          >
            <div
              className="relative mx-auto aspect-[2/3] w-28 shrink-0 overflow-hidden rounded-lg border border-border bg-muted sm:mx-0 sm:w-32"
              data-session-lobby-saga-cover-frame
            >
              {model.summary.sagaCoverUrl ? (
                <img
                  src={model.summary.sagaCoverUrl}
                  alt={
                    model.summary.sagaName
                      ? `Saga-Cover: ${model.summary.sagaName}`
                      : 'Saga-Cover'
                  }
                  className="h-full w-full object-cover"
                  data-session-lobby-saga-cover
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center px-2 text-center text-sm font-medium text-muted-foreground"
                  data-session-lobby-saga-cover-fallback
                  aria-hidden
                >
                  {(model.summary.sagaName ?? 'Saga').slice(0, 1)}
                </div>
              )}
            </div>
            <section
              className="min-w-0 flex-1 rounded-lg border border-primary/40 bg-card/60 p-4 sm:p-5"
              data-session-lobby-join-code
            >
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Session-Code
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Teile diesen Code mit deinen Spielern — Beitritt über Session → Beitreten.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="min-w-0 flex-1 rounded-lg bg-muted px-4 py-3 text-center">
                  <p
                    className="font-mono text-3xl tracking-[0.2em] text-foreground sm:text-4xl"
                    data-session-lobby-code
                  >
                    {model.summary.code}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="min-h-11 min-w-11"
                  onClick={() => void handleCopyCode()}
                  aria-label="Session-Code kopieren"
                  data-session-lobby-copy-code
                >
                  {codeCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
                </Button>
              </div>
              <div className="mt-3">
                <SessionInviteShareButton
                  sessionId={model.summary.sessionId}
                  className="min-h-11 w-full"
                />
              </div>
            </section>
          </div>
        ) : null}

        {/* Media probes are always available after first paint — never gated on roster load. */}
        <section
          className="rounded-lg border border-border bg-card/40 p-4"
          data-session-lobby-media
        >
          <h2 className="text-sm font-medium">Geräte & LiveAct</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Kamera, Mikrofon und LiveAct starten nur nach deinem Klick — nie automatisch.
            Fehlende Geräte blockieren den Session-Start nicht.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className="rounded-md border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Kamera</p>
              <p className="text-sm" data-lobby-camera-status>
                {lobbyMediaStatusLabelDe(cameraStatus)}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-2 min-h-11 w-full"
                onClick={() => void probeCamera()}
                data-session-lobby-probe-camera
              >
                Kamera prüfen
              </Button>
            </div>
            <div className="rounded-md border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Mikrofon</p>
              <p className="text-sm" data-lobby-mic-status>
                {lobbyMediaStatusLabelDe(microphoneStatus)}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-2 min-h-11 w-full"
                onClick={() => void probeMicrophone()}
                data-session-lobby-probe-mic
              >
                Mikrofon prüfen
              </Button>
            </div>
            <div className="rounded-md border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">LiveAct</p>
              <p className="text-sm" data-lobby-liveact-status>
                {lobbyLiveActStatusLabelDe(liveActStatus)}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-2 min-h-11 w-full"
                onClick={probeLiveAct}
                data-session-lobby-probe-liveact
              >
                LiveAct prüfen
              </Button>
            </div>
          </div>
        </section>

        {model ? (
          <>
            <section
              className="rounded-lg border border-border bg-card/40 p-4"
              data-session-lobby-self
            >
              <h2 className="text-sm font-medium">Dein Platz</h2>
              <dl className="mt-2 grid gap-1 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Rolle</dt>
                  <dd>
                    {model.selfRole === 'gamemaster'
                      ? 'Spielleitung'
                      : model.selfRole === 'player'
                        ? 'Spieler'
                        : 'Viewer'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Charakter</dt>
                  <dd data-session-lobby-character>
                    {model.selfCharacterName ??
                      (model.selfRole === 'gamemaster' ? '—' : 'Nicht zugewiesen')}
                    {model.selfCharacterPublicId
                      ? ` (${model.selfCharacterPublicId})`
                      : ''}
                  </dd>
                </div>
              </dl>
              {model.canChangeCharacter ? (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 min-h-11"
                  onClick={handleChangeCharacter}
                  data-session-lobby-change-character
                >
                  Charakter ändern
                </Button>
              ) : null}
            </section>

            <section
              className="rounded-lg border border-border bg-card/40 p-4"
              data-session-lobby-roster
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-medium">Teilnehmer</h2>
                <p className="text-xs text-muted-foreground">
                  Online {model.onlineCount} · Bereit {model.readyCount}
                </p>
              </div>
              <ul className="mt-3 space-y-2">
                {model.roster.length === 0 ? (
                  <li className="text-sm text-muted-foreground">Noch keine Teilnehmer</li>
                ) : (
                  model.roster.map((member) => (
                    <li
                      key={member.userId}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2 text-sm"
                      data-session-lobby-member={member.isSelf ? 'self' : 'peer'}
                    >
                      <div>
                        <p className="font-medium">
                          {member.characterName ??
                            (member.role === 'gamemaster' ? 'Spielleitung' : 'Ohne Charakter')}
                          {member.isSelf ? ' (du)' : ''}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {member.role === 'gamemaster' ? 'GM' : 'Player'}
                          {member.characterPublicId ? ` · ${member.characterPublicId}` : ''}
                        </p>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <span
                          className={
                            member.isOnline ? 'text-emerald-600' : 'text-muted-foreground'
                          }
                          data-lobby-online={member.isOnline ? '1' : '0'}
                        >
                          {member.isOnline ? 'Online' : 'Offline'}
                        </span>
                        <span
                          className={
                            member.isReady ? 'text-emerald-600' : 'text-muted-foreground'
                          }
                          data-lobby-ready={member.isReady ? '1' : '0'}
                        >
                          {member.isReady ? 'Bereit' : 'Wartet'}
                        </span>
                      </div>
                    </li>
                  ))
                )}
              </ul>
              <Button
                type="button"
                variant={selfReady ? 'secondary' : 'default'}
                className="mt-3 min-h-11"
                onClick={() => setReady(!selfReady)}
                data-session-lobby-ready-toggle
              >
                {selfReady ? 'Bereitschaft zurücknehmen' : 'Bereit markieren'}
              </Button>
            </section>

            <footer className="mt-auto flex flex-wrap items-center gap-3 border-t border-border pt-4">
              <Button
                type="button"
                className="min-h-11"
                disabled={Boolean(model.enterDisabledReasonDe)}
                onClick={handleEnter}
                data-session-lobby-enter
              >
                {model.enterCtaLabelDe}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="min-h-11"
                onClick={() => void refresh()}
                data-session-lobby-refresh
              >
                Aktualisieren
              </Button>
              {model.enterDisabledReasonDe ? (
                <p className="text-sm text-destructive" role="status">
                  {model.enterDisabledReasonDe}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Bereitschaft ist nur ein Signal — keine Spielberechtigung.
                </p>
              )}
            </footer>
          </>
        ) : null}
      </div>
    </AdaptivePage>
  );
}
