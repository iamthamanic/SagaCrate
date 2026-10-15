/**
 * Preview-first media intake status contracts (#634).
 * Location: src/app/media/intake/intake-types.ts
 *
 * UI/status strings are German for product surfaces; codes stay English for tests.
 */

import type {
  AssetProfileId,
  MediaKind,
  MediaOptimizeResult,
} from '../../../domains/media';

/** Intake lifecycle visible to upload UIs (AU loading / error / retry). */
export type MediaIntakeStatus =
  | 'idle'
  | 'previewing'
  | 'optimizing'
  | 'ready'
  | 'uploading'
  | 'complete'
  | 'aborted'
  | 'failed';

export const MEDIA_INTAKE_STATUSES = [
  'idle',
  'previewing',
  'optimizing',
  'ready',
  'uploading',
  'complete',
  'aborted',
  'failed',
] as const satisfies readonly MediaIntakeStatus[];

/** German status copy for aria-live / visible feedback (AU). */
export const MEDIA_INTAKE_STATUS_LABEL_DE: Readonly<Record<MediaIntakeStatus, string>> = {
  idle: 'Keine Datei ausgewählt',
  previewing: 'Vorschau wird angezeigt',
  optimizing:
    'Medien werden im Hintergrund optimiert — du kannst den Bereich verlassen',
  ready: 'Optimierung abgeschlossen – bereit zum Hochladen',
  uploading: 'Upload läuft im Hintergrund — du kannst den Bereich verlassen',
  complete: 'Upload abgeschlossen',
  aborted: 'Vorgang abgebrochen',
  failed: 'Optimierung oder Upload fehlgeschlagen',
};

export type MediaIntakeSource = {
  readonly file: File;
  readonly kind: MediaKind;
  readonly profileId: AssetProfileId;
  readonly mimeType: string;
  readonly byteSize: number;
  readonly imageCountInRequest?: number;
  readonly aggregateRequestBytes?: number;
};

export type MediaIntakeReadyPayload = {
  readonly result: MediaOptimizeResult;
  /** Bytes ready for the existing upload/analysis pipeline (never silent original after failure). */
  readonly uploadBlob: Blob;
  readonly uploadMimeType: string;
  readonly uploadByteSize: number;
};

export type MediaIntakeOptions = {
  readonly kind?: MediaKind;
  readonly profileId: AssetProfileId;
  readonly imageCountInRequest?: number;
  readonly aggregateRequestBytes?: number;
};

export function isMediaIntakeStatus(value: unknown): value is MediaIntakeStatus {
  return (
    typeof value === 'string' &&
    (MEDIA_INTAKE_STATUSES as readonly string[]).includes(value)
  );
}

export function mediaIntakeStatusLabelDe(status: MediaIntakeStatus): string {
  return MEDIA_INTAKE_STATUS_LABEL_DE[status];
}

export function mediaIntakeCanRetry(status: MediaIntakeStatus): boolean {
  return status === 'failed' || status === 'aborted';
}

export function mediaIntakeIsBusy(status: MediaIntakeStatus): boolean {
  return (
    status === 'previewing' ||
    status === 'optimizing' ||
    status === 'uploading'
  );
}
