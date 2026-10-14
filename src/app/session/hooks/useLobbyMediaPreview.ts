/**
 * useLobbyMediaPreview — Meet-style local camera/mic/LiveAct preview for lobby (#678).
 * Location: src/app/session/hooks/useLobbyMediaPreview.ts
 *
 * Holds streams until stop/unmount. No LiveKit publish. Prefs = deviceId localStorage only.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { SessionRole } from '../../../domains/session/contracts/live-session-access';
import {
  LOBBY_MEDIA_PREFS_STORAGE_KEY,
  detectLobbyLiveActSupport,
  parseLobbyMediaDevicePrefs,
  type LobbyLiveActPreviewOption,
  type LobbyLiveActStatus,
  type LobbyMediaDeviceDescriptor,
  type LobbyMediaDevicePrefs,
  type LobbyMediaDeviceStatus,
} from '../../../domains/session/contracts/session-lobby';
import {
  buildNpcCreatureIconPublicSrc,
  listBuiltinNpcCreatureDefinitions,
  listCoreNpcCreatureDefinitions,
} from '../../../domains/npc-creature';
import { characterService } from '../../../infrastructure/character/character-service';
import { listNpcCreatureDefinitions } from '../../../infrastructure/npc-creature/npc-creature-service';

export type UseLobbyMediaPreviewInput = {
  readonly selfRole: SessionRole | null;
  readonly selfCharacterId: string | null;
  readonly selfCharacterName: string | null;
};

export type UseLobbyMediaPreviewResult = {
  readonly cameraStatus: LobbyMediaDeviceStatus;
  readonly microphoneStatus: LobbyMediaDeviceStatus;
  readonly liveActStatus: LobbyLiveActStatus;
  readonly cameraDevices: readonly LobbyMediaDeviceDescriptor[];
  readonly microphoneDevices: readonly LobbyMediaDeviceDescriptor[];
  readonly selectedCameraId: string | null;
  readonly selectedMicrophoneId: string | null;
  readonly cameraStream: MediaStream | null;
  readonly microphoneLevel: number;
  readonly liveActActive: boolean;
  readonly liveActPreview: LobbyLiveActPreviewOption | null;
  readonly liveActOptions: readonly LobbyLiveActPreviewOption[];
  readonly selectedLiveActOptionId: string | null;
  readonly liveActHintDe: string | null;
  readonly startCamera: () => Promise<void>;
  readonly stopCamera: () => void;
  readonly selectCamera: (deviceId: string) => Promise<void>;
  readonly startMicrophone: () => Promise<void>;
  readonly stopMicrophone: () => void;
  readonly selectMicrophone: (deviceId: string) => Promise<void>;
  readonly startLiveAct: () => Promise<void>;
  readonly stopLiveAct: () => void;
  readonly selectLiveActOption: (optionId: string) => void;
};

function readPrefs(): LobbyMediaDevicePrefs {
  if (typeof localStorage === 'undefined') {
    return { cameraDeviceId: null, microphoneDeviceId: null };
  }
  try {
    const raw = localStorage.getItem(LOBBY_MEDIA_PREFS_STORAGE_KEY);
    if (!raw) return { cameraDeviceId: null, microphoneDeviceId: null };
    return parseLobbyMediaDevicePrefs(JSON.parse(raw) as unknown);
  } catch {
    return { cameraDeviceId: null, microphoneDeviceId: null };
  }
}

function writePrefs(patch: Partial<LobbyMediaDevicePrefs>): void {
  if (typeof localStorage === 'undefined') return;
  const next = { ...readPrefs(), ...patch };
  try {
    localStorage.setItem(LOBBY_MEDIA_PREFS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Quota / private mode — preview still works without prefs.
  }
}

function mapDevices(
  list: MediaDeviceInfo[],
  kind: 'videoinput' | 'audioinput',
): LobbyMediaDeviceDescriptor[] {
  return list
    .filter((d) => d.kind === kind && d.deviceId.length > 0)
    .map((d) => ({
      deviceId: d.deviceId,
      label: d.label,
      kind,
    }));
}

function classifyGetUserMediaError(err: unknown): LobbyMediaDeviceStatus {
  const name = err instanceof DOMException ? err.name : '';
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') return 'denied';
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') return 'unavailable';
  return 'error';
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

function stopStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((t) => t.stop());
}

export function useLobbyMediaPreview(
  input: UseLobbyMediaPreviewInput,
): UseLobbyMediaPreviewResult {
  const [cameraStatus, setCameraStatus] = useState<LobbyMediaDeviceStatus>('idle');
  const [microphoneStatus, setMicrophoneStatus] = useState<LobbyMediaDeviceStatus>('idle');
  const [liveActStatus, setLiveActStatus] = useState<LobbyLiveActStatus>('unknown');
  const [cameraDevices, setCameraDevices] = useState<LobbyMediaDeviceDescriptor[]>([]);
  const [microphoneDevices, setMicrophoneDevices] = useState<LobbyMediaDeviceDescriptor[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [microphoneLevel, setMicrophoneLevel] = useState(0);
  const [liveActActive, setLiveActActive] = useState(false);
  const [liveActPreview, setLiveActPreview] = useState<LobbyLiveActPreviewOption | null>(null);
  const [liveActOptions, setLiveActOptions] = useState<LobbyLiveActPreviewOption[]>([]);
  const [selectedLiveActOptionId, setSelectedLiveActOptionId] = useState<string | null>(null);
  const [liveActHintDe, setLiveActHintDe] = useState<string | null>(null);

  const cameraStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const refreshDeviceLists = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return;
    }
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      setCameraDevices(mapDevices(list, 'videoinput'));
      setMicrophoneDevices(mapDevices(list, 'audioinput'));
    } catch {
      // Enumeration can fail before permission; start* will retry after grant.
    }
  }, []);

  useEffect(() => {
    const prefs = readPrefs();
    setSelectedCameraId(prefs.cameraDeviceId);
    setSelectedMicrophoneId(prefs.microphoneDeviceId);
  }, []);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.addEventListener) {
      return;
    }
    const onChange = () => {
      void refreshDeviceLists();
    };
    navigator.mediaDevices.addEventListener('devicechange', onChange);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', onChange);
    };
  }, [refreshDeviceLists]);

  const stopMicMeter = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    analyserRef.current = null;
    if (audioCtxRef.current) {
      void audioCtxRef.current.close().catch(() => undefined);
      audioCtxRef.current = null;
    }
    setMicrophoneLevel(0);
  }, []);

  const stopCamera = useCallback(() => {
    stopStream(cameraStreamRef.current);
    cameraStreamRef.current = null;
    setCameraStream(null);
    setCameraStatus((s) => (s === 'prompting' ? 'idle' : s === 'granted' ? 'idle' : s));
  }, []);

  const stopMicrophone = useCallback(() => {
    stopMicMeter();
    stopStream(micStreamRef.current);
    micStreamRef.current = null;
    setMicrophoneStatus((s) => (s === 'prompting' ? 'idle' : s === 'granted' ? 'idle' : s));
  }, [stopMicMeter]);

  const stopLiveAct = useCallback(() => {
    setLiveActActive(false);
    setLiveActPreview(null);
    setLiveActHintDe(null);
  }, []);

  useEffect(() => {
    return () => {
      stopStream(cameraStreamRef.current);
      cameraStreamRef.current = null;
      stopStream(micStreamRef.current);
      micStreamRef.current = null;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      if (audioCtxRef.current) void audioCtxRef.current.close().catch(() => undefined);
    };
  }, []);

  const openCamera = useCallback(
    async (deviceId: string | null) => {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setCameraStatus('unavailable');
        return;
      }
      setCameraStatus('prompting');
      stopStream(cameraStreamRef.current);
      cameraStreamRef.current = null;
      setCameraStream(null);
      try {
        const constraints: MediaStreamConstraints = {
          audio: false,
          video: deviceId
            ? { deviceId: { exact: deviceId } }
            : true,
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        cameraStreamRef.current = stream;
        setCameraStream(stream);
        const track = stream.getVideoTracks()[0];
        const activeId = track?.getSettings().deviceId ?? deviceId;
        if (activeId) {
          setSelectedCameraId(activeId);
          writePrefs({ cameraDeviceId: activeId });
        }
        setCameraStatus('granted');
        await refreshDeviceLists();
      } catch (err) {
        setCameraStatus(classifyGetUserMediaError(err));
      }
    },
    [refreshDeviceLists],
  );

  const startCamera = useCallback(async () => {
    const prefs = readPrefs();
    await openCamera(prefs.cameraDeviceId ?? selectedCameraId);
  }, [openCamera, selectedCameraId]);

  const selectCamera = useCallback(
    async (deviceId: string) => {
      setSelectedCameraId(deviceId);
      writePrefs({ cameraDeviceId: deviceId });
      if (cameraStreamRef.current || cameraStatus === 'granted') {
        await openCamera(deviceId);
      }
    },
    [cameraStatus, openCamera],
  );

  const startMicMeter = useCallback((stream: MediaStream) => {
    stopMicMeter();
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      void ctx.resume();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        const node = analyserRef.current;
        if (!node) return;
        node.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i += 1) {
          const v = (data[i]! - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        setMicrophoneLevel(Math.min(1, rms * 3));
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      // Meter is best-effort; mic stream still proves permission.
    }
  }, [stopMicMeter]);

  const openMicrophone = useCallback(
    async (deviceId: string | null) => {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setMicrophoneStatus('unavailable');
        return;
      }
      setMicrophoneStatus('prompting');
      stopMicMeter();
      stopStream(micStreamRef.current);
      micStreamRef.current = null;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: deviceId ? { deviceId: { exact: deviceId } } : true,
        });
        micStreamRef.current = stream;
        const track = stream.getAudioTracks()[0];
        const activeId = track?.getSettings().deviceId ?? deviceId;
        if (activeId) {
          setSelectedMicrophoneId(activeId);
          writePrefs({ microphoneDeviceId: activeId });
        }
        setMicrophoneStatus('granted');
        startMicMeter(stream);
        await refreshDeviceLists();
      } catch (err) {
        setMicrophoneStatus(classifyGetUserMediaError(err));
      }
    },
    [refreshDeviceLists, startMicMeter, stopMicMeter],
  );

  const startMicrophone = useCallback(async () => {
    const prefs = readPrefs();
    await openMicrophone(prefs.microphoneDeviceId ?? selectedMicrophoneId);
  }, [openMicrophone, selectedMicrophoneId]);

  const selectMicrophone = useCallback(
    async (deviceId: string) => {
      setSelectedMicrophoneId(deviceId);
      writePrefs({ microphoneDeviceId: deviceId });
      if (micStreamRef.current || microphoneStatus === 'granted') {
        await openMicrophone(deviceId);
      }
    },
    [microphoneStatus, openMicrophone],
  );

  const loadNpcOptions = useCallback(async (): Promise<LobbyLiveActPreviewOption[]> => {
    const fromDefs = (
      defs: readonly { id: string; name: string; iconKey?: string }[],
    ): LobbyLiveActPreviewOption[] =>
      defs.map((d) => ({
        id: d.id,
        name: d.name,
        imageUrl: d.iconKey ? buildNpcCreatureIconPublicSrc(d.iconKey) : null,
        kind: 'npc' as const,
      }));

    const core = fromDefs(listCoreNpcCreatureDefinitions());
    const builtin = fromDefs(listBuiltinNpcCreatureDefinitions());
    let personal: LobbyLiveActPreviewOption[] = [];
    try {
      const records = await listNpcCreatureDefinitions({
        scope: 'personal',
        includeArchived: false,
      });
      personal = fromDefs(records.map((r) => r.definition));
    } catch {
      personal = [];
    }
    const seen = new Set<string>();
    const merged: LobbyLiveActPreviewOption[] = [];
    for (const opt of [...personal, ...core, ...builtin]) {
      if (seen.has(opt.id)) continue;
      seen.add(opt.id);
      merged.push(opt);
    }
    return merged;
  }, []);

  const startLiveAct = useCallback(async () => {
    const support = detectLobbyLiveActSupport({
      hasMediaDevices: typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices),
      hasWebGL: typeof document !== 'undefined' && hasWebGL(),
    });
    setLiveActStatus(support);

    if (input.selfRole === 'player') {
      if (!input.selfCharacterId) {
        setLiveActActive(false);
        setLiveActPreview(null);
        setLiveActOptions([]);
        setSelectedLiveActOptionId(null);
        setLiveActHintDe('Kein Charakter gebunden — bitte zuerst einen Charakter zuweisen.');
        return;
      }
      setLiveActHintDe(null);
      let imageUrl: string | null = null;
      try {
        const vm = await characterService.getCharacterById(input.selfCharacterId);
        imageUrl = vm.portraitUrl ?? null;
      } catch {
        imageUrl = null;
      }
      const option: LobbyLiveActPreviewOption = {
        id: input.selfCharacterId,
        name: input.selfCharacterName ?? 'Charakter',
        imageUrl,
        kind: 'character',
      };
      setLiveActOptions([option]);
      setSelectedLiveActOptionId(option.id);
      setLiveActPreview(option);
      setLiveActActive(true);
      return;
    }

    if (input.selfRole === 'gamemaster') {
      const options = await loadNpcOptions();
      setLiveActOptions(options);
      if (options.length === 0) {
        setLiveActActive(false);
        setLiveActPreview(null);
        setSelectedLiveActOptionId(null);
        setLiveActHintDe('Keine NPCs/Kreaturen in der Bibliothek verfügbar.');
        return;
      }
      setLiveActHintDe(null);
      const first = options[0]!;
      setSelectedLiveActOptionId(first.id);
      setLiveActPreview(first);
      setLiveActActive(true);
      return;
    }

    setLiveActActive(false);
    setLiveActPreview(null);
    setLiveActOptions([]);
    setSelectedLiveActOptionId(null);
    setLiveActHintDe('LiveAct-Vorschau nur für Spieler oder Spielleitung.');
  }, [input.selfCharacterId, input.selfCharacterName, input.selfRole, loadNpcOptions]);

  const selectLiveActOption = useCallback(
    (optionId: string) => {
      setSelectedLiveActOptionId(optionId);
      const found = liveActOptions.find((o) => o.id === optionId) ?? null;
      setLiveActPreview(found);
    },
    [liveActOptions],
  );

  return {
    cameraStatus,
    microphoneStatus,
    liveActStatus,
    cameraDevices,
    microphoneDevices,
    selectedCameraId,
    selectedMicrophoneId,
    cameraStream,
    microphoneLevel,
    liveActActive,
    liveActPreview,
    liveActOptions,
    selectedLiveActOptionId,
    liveActHintDe,
    startCamera,
    stopCamera,
    selectCamera,
    startMicrophone,
    stopMicrophone,
    selectMicrophone,
    startLiveAct,
    stopLiveAct,
    selectLiveActOption,
  };
}
