/**
 * look-reference-adaption — Client helpers for Basic Look Adaption UX (#353/#639).
 * Location: src/app/look/create/look-reference-adaption.ts
 */
import {
  LOOK_REFERENCE_ANALYSIS_MAX_IMAGES,
  LOOK_REFERENCE_ANALYSIS_MIME_TYPES,
  isLookReferenceAnalysisMime,
  type LookReferenceAnalysisMime,
  type LookReferenceKind,
} from '../../../domains/look';

export const LOOK_ADAPTION_MAX_BYTES = 8 * 1024 * 1024;
/** Aggregate request budget for look-reference optimize + analysis (#639 / domain policy). */
export const LOOK_ADAPTION_AGGREGATE_MAX_BYTES = 12 * 1024 * 1024;

export type LookAdaptionReference = {
  readonly id: string;
  kind: LookReferenceKind;
  mime: LookReferenceAnalysisMime;
  weight: number;
  label: string;
  previewUrl: string;
  contentBase64: string;
  fileName: string;
};

export function mimeFromFile(file: File): LookReferenceAnalysisMime | null {
  const raw = (file.type || '').toLowerCase();
  if (isLookReferenceAnalysisMime(raw)) return raw;
  const name = file.name.toLowerCase();
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
  if (name.endsWith('.webp')) return 'image/webp';
  return null;
}

export function validateAdaptionFile(file: File): string | null {
  if (file.size <= 0 || file.size > LOOK_ADAPTION_MAX_BYTES) {
    return 'Bildgröße muss zwischen 1 Byte und 8 MB liegen.';
  }
  if (!mimeFromFile(file)) {
    return `Nur ${LOOK_REFERENCE_ANALYSIS_MIME_TYPES.join(', ')} sind erlaubt.`;
  }
  return null;
}

export function canAddMoreReferences(count: number): boolean {
  return count < LOOK_REFERENCE_ANALYSIS_MAX_IMAGES;
}

export async function fileToContentBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function createAdaptionReferenceId(): string {
  return `ref-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function estimateAggregateBytes(files: readonly { size: number }[]): number {
  return files.reduce((sum, f) => sum + f.size, 0);
}

export type PreparedLookReferenceFile = {
  readonly file: File;
  readonly mime: LookReferenceAnalysisMime;
  readonly contentBase64: string;
  readonly optimizedByteSize: number;
};

/**
 * Optimize a look-reference image before Base64 analysis.
 * Never returns the original after a required optimize failure.
 */
export async function prepareLookReferenceFileForAnalysis(
  file: File,
  options: {
    readonly imageCountInRequest: number;
    readonly aggregateRequestBytes: number;
    readonly signal?: AbortSignal;
  },
): Promise<PreparedLookReferenceFile> {
  const validationError = validateAdaptionFile(file);
  if (validationError) throw new Error(validationError);

  if (options.aggregateRequestBytes > LOOK_ADAPTION_AGGREGATE_MAX_BYTES) {
    throw new Error(
      `Gesamtgröße der Referenzbilder überschreitet ${(LOOK_ADAPTION_AGGREGATE_MAX_BYTES / (1024 * 1024)).toFixed(0)} MB.`,
    );
  }

  const { optimizeMedia } = await import('../../../infrastructure/media/optimizer');
  let optimizedBytes: Uint8Array | undefined;
  const result = await optimizeMedia({
    kind: 'image',
    profileId: 'look-reference',
    mimeType: file.type || 'application/octet-stream',
    byteSize: file.size,
    bytes: file,
    signal: options.signal,
    imageCountInRequest: options.imageCountInRequest,
    aggregateRequestBytes: options.aggregateRequestBytes,
    onOptimizedBytes: (bytes) => {
      optimizedBytes = bytes;
    },
  });

  if (result.status === 'unchanged') {
    const mime = mimeFromFile(file);
    if (!mime) throw new Error('MIME nicht erlaubt.');
    return {
      file,
      mime,
      contentBase64: await fileToContentBase64(file),
      optimizedByteSize: file.size,
    };
  }

  if (result.status === 'optimized') {
    if (!optimizedBytes || optimizedBytes.byteLength === 0) {
      throw new Error('Look-Referenz-Optimierung lieferte keine Bytes (kein stilles Original).');
    }
    const copy = new Uint8Array(optimizedBytes.byteLength);
    copy.set(optimizedBytes);
    const mimeRaw = result.outputMimeType.toLowerCase();
    if (!isLookReferenceAnalysisMime(mimeRaw)) {
      throw new Error(`Optimiertes MIME ${result.outputMimeType} ist für Look-Analyse nicht erlaubt.`);
    }
    const base = file.name.replace(/\.[^.]+$/, '') || 'look-ref';
    const ext = mimeRaw === 'image/webp' ? 'webp' : mimeRaw === 'image/png' ? 'png' : 'jpg';
    const out = new File([copy], `${base}.${ext}`, { type: mimeRaw });
    return {
      file: out,
      mime: mimeRaw,
      contentBase64: await fileToContentBase64(out),
      optimizedByteSize: out.size,
    };
  }

  if (result.status === 'aborted') {
    throw new Error(result.message || 'Look-Referenz-Optimierung abgebrochen.');
  }

  const message =
    'message' in result && typeof result.message === 'string'
      ? result.message
      : 'Look-Referenz-Optimierung fehlgeschlagen.';
  throw new Error(message);
}
