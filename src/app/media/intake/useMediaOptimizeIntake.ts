/**
 * Preview-first media optimize intake hook (#634).
 * Location: src/app/media/intake/useMediaOptimizeIntake.ts
 *
 * Shows an Object URL of the original immediately, then runs optimizeMedia with
 * Abort + generation race control. No Storage writes — callers pass an uploader.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AssetProfileId, MediaKind, MediaOptimizeResult } from '../../../domains/media';
import { optimizeMedia } from '../../../infrastructure/media/optimizer';
import {
  mediaIntakeCanRetry,
  mediaIntakeIsBusy,
  mediaIntakeStatusLabelDe,
  type MediaIntakeOptions,
  type MediaIntakeReadyPayload,
  type MediaIntakeStatus,
} from './intake-types';
import {
  nextGeneration,
  shouldApplyCompletion,
  statusAfterAbort,
  statusAfterOptimizeTerminal,
  type IntakeGeneration,
} from './intake-session';
import {
  browserObjectUrlFactory,
  createObjectUrlRegistry,
  type ObjectUrlRegistry,
} from './object-url-registry';

export type UseMediaOptimizeIntakeResult = {
  readonly status: MediaIntakeStatus;
  /** Immediate Object URL of the selected original (before/during encode). */
  readonly previewUrl: string | null;
  readonly statusLabelDe: string;
  readonly isBusy: boolean;
  readonly canRetry: boolean;
  readonly errorMessage: string | null;
  readonly result: MediaOptimizeResult | null;
  readonly ready: MediaIntakeReadyPayload | null;
  readonly sourceFile: File | null;
  /** Select a file: preview Object URL first, then optimize. */
  readonly selectFile: (file: File, options?: Partial<MediaIntakeOptions>) => Promise<void>;
  /** Abort in-flight optimize/upload; bumps generation so stale completions are ignored. */
  readonly abort: () => void;
  /** Re-run optimize on the last selected file after failed/aborted. */
  readonly retry: () => Promise<void>;
  /**
   * Run an existing authorized upload/analysis pipeline with the ready blob.
   * On failure, previous remote assets are untouched (this hook never writes Storage).
   */
  readonly upload: (
    uploader: (payload: MediaIntakeReadyPayload) => Promise<void>,
  ) => Promise<void>;
  readonly reset: () => void;
};

export type UseMediaOptimizeIntakeConfig = {
  readonly profileId: AssetProfileId;
  readonly kind?: MediaKind;
};

function buildUploadPayload(
  file: File,
  result: MediaOptimizeResult,
  optimizedBytes: Uint8Array | undefined,
): MediaIntakeReadyPayload | null {
  if (result.status === 'optimized') {
    if (!optimizedBytes || optimizedBytes.byteLength === 0) {
      return null;
    }
    const copy = new Uint8Array(optimizedBytes.byteLength);
    copy.set(optimizedBytes);
    const blob = new Blob([copy], { type: result.outputMimeType });
    return {
      result,
      uploadBlob: blob,
      uploadMimeType: result.outputMimeType,
      uploadByteSize: result.outputByteSize,
    };
  }
  if (result.status === 'unchanged') {
    return {
      result,
      uploadBlob: file,
      uploadMimeType: result.outputMimeType,
      uploadByteSize: result.outputByteSize,
    };
  }
  return null;
}

export function useMediaOptimizeIntake(
  config: UseMediaOptimizeIntakeConfig,
): UseMediaOptimizeIntakeResult {
  const [status, setStatus] = useState<MediaIntakeStatus>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<MediaOptimizeResult | null>(null);
  const [ready, setReady] = useState<MediaIntakeReadyPayload | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);

  const generationRef = useRef<IntakeGeneration>(0);
  const disposedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const registryRef = useRef<ObjectUrlRegistry | null>(null);
  const lastOptionsRef = useRef<MediaIntakeOptions>({
    profileId: config.profileId,
    kind: config.kind ?? 'image',
  });
  const sourceFileRef = useRef<File | null>(null);

  const ensureRegistry = useCallback((): ObjectUrlRegistry => {
    if (!registryRef.current) {
      registryRef.current = createObjectUrlRegistry(browserObjectUrlFactory());
    }
    return registryRef.current;
  }, []);

  const bumpGeneration = useCallback(() => {
    generationRef.current = nextGeneration(generationRef.current);
    abortRef.current?.abort();
    abortRef.current = null;
    return generationRef.current;
  }, []);

  const clearUrls = useCallback(() => {
    registryRef.current?.revokeAll();
    setPreviewUrl(null);
  }, []);

  const resetState = useCallback(() => {
    setStatus('idle');
    setErrorMessage(null);
    setResult(null);
    setReady(null);
    setSourceFile(null);
    sourceFileRef.current = null;
    clearUrls();
  }, [clearUrls]);

  const runOptimize = useCallback(
    async (file: File, options: MediaIntakeOptions, generation: IntakeGeneration) => {
      const registry = ensureRegistry();
      registry.revokeAll();
      const url = registry.create(file);
      setPreviewUrl(url);
      setStatus('previewing');
      setErrorMessage(null);
      setResult(null);
      setReady(null);
      setSourceFile(file);
      sourceFileRef.current = file;

      // Yield so consumers paint the Object URL before encode starts.
      await Promise.resolve();
      if (!shouldApplyCompletion(generationRef.current, generation, disposedRef.current)) {
        return;
      }

      setStatus('optimizing');
      const controller = new AbortController();
      abortRef.current = controller;

      let optimizedBytes: Uint8Array | undefined;
      const kind = options.kind ?? 'image';

      let optimizeResult: MediaOptimizeResult;
      try {
        optimizeResult = await optimizeMedia({
          kind,
          profileId: options.profileId,
          mimeType: file.type || 'application/octet-stream',
          byteSize: file.size,
          bytes: file,
          signal: controller.signal,
          imageCountInRequest: options.imageCountInRequest,
          aggregateRequestBytes: options.aggregateRequestBytes,
          onOptimizedBytes: (bytes) => {
            optimizedBytes = bytes;
          },
        });
      } catch (err) {
        if (!shouldApplyCompletion(generationRef.current, generation, disposedRef.current)) {
          return;
        }
        const message =
          err instanceof Error ? err.message : 'Medienoptimierung fehlgeschlagen.';
        setStatus(controller.signal.aborted ? 'aborted' : 'failed');
        setErrorMessage(message);
        setResult(null);
        setReady(null);
        return;
      }

      if (!shouldApplyCompletion(generationRef.current, generation, disposedRef.current)) {
        return;
      }

      setResult(optimizeResult);
      const nextStatus = statusAfterOptimizeTerminal(optimizeResult.status);
      setStatus(nextStatus);

      if (nextStatus === 'ready') {
        const payload = buildUploadPayload(file, optimizeResult, optimizedBytes);
        if (!payload) {
          setStatus('failed');
          setErrorMessage(
            'Optimierung lieferte kein gültiges Upload-Payload (kein stilles Original).',
          );
          setReady(null);
          return;
        }
        setReady(payload);
        setErrorMessage(null);
        return;
      }

      setReady(null);
      if ('message' in optimizeResult && typeof optimizeResult.message === 'string') {
        setErrorMessage(optimizeResult.message);
      } else if (nextStatus === 'aborted') {
        setErrorMessage('Medienoptimierung abgebrochen.');
      } else {
        setErrorMessage('Medienoptimierung fehlgeschlagen.');
      }
    },
    [ensureRegistry],
  );

  const selectFile = useCallback(
    async (file: File, options?: Partial<MediaIntakeOptions>) => {
      const merged: MediaIntakeOptions = {
        profileId: options?.profileId ?? config.profileId,
        kind: options?.kind ?? config.kind ?? 'image',
        imageCountInRequest: options?.imageCountInRequest,
        aggregateRequestBytes: options?.aggregateRequestBytes,
      };
      lastOptionsRef.current = merged;
      const generation = bumpGeneration();
      await runOptimize(file, merged, generation);
    },
    [bumpGeneration, config.kind, config.profileId, runOptimize],
  );

  const abort = useCallback(() => {
    setStatus((prev) => statusAfterAbort(prev));
    bumpGeneration();
    setErrorMessage('Vorgang abgebrochen.');
    setReady(null);
  }, [bumpGeneration]);

  const retry = useCallback(async () => {
    const file = sourceFileRef.current;
    if (!file || !mediaIntakeCanRetry(status)) return;
    const generation = bumpGeneration();
    await runOptimize(file, lastOptionsRef.current, generation);
  }, [bumpGeneration, runOptimize, status]);

  const upload = useCallback(
    async (uploader: (payload: MediaIntakeReadyPayload) => Promise<void>) => {
      if (status !== 'ready' || !ready) {
        setErrorMessage('Upload nur möglich, wenn die Optimierung bereit ist.');
        return;
      }
      const generation = generationRef.current;
      setStatus('uploading');
      setErrorMessage(null);
      try {
        await uploader(ready);
        if (!shouldApplyCompletion(generationRef.current, generation, disposedRef.current)) {
          return;
        }
        setStatus('complete');
      } catch (err) {
        if (!shouldApplyCompletion(generationRef.current, generation, disposedRef.current)) {
          return;
        }
        setStatus('failed');
        setErrorMessage(
          err instanceof Error ? err.message : 'Upload fehlgeschlagen. Bestehendes Asset unverändert.',
        );
      }
    },
    [ready, status],
  );

  const reset = useCallback(() => {
    bumpGeneration();
    resetState();
  }, [bumpGeneration, resetState]);

  useEffect(() => {
    disposedRef.current = false;
    return () => {
      disposedRef.current = true;
      bumpGeneration();
      registryRef.current?.revokeAll();
      registryRef.current = null;
    };
  }, [bumpGeneration]);

  return {
    status,
    previewUrl,
    statusLabelDe: mediaIntakeStatusLabelDe(status),
    isBusy: mediaIntakeIsBusy(status),
    canRetry: mediaIntakeCanRetry(status),
    errorMessage,
    result,
    ready,
    sourceFile,
    selectFile,
    abort,
    retry,
    upload,
    reset,
  };
}
