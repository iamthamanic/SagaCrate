/**
 * Image engine request types (#630).
 * Location: src/infrastructure/media/optimizer/engines/image/types.ts
 */

import type { MediaOptimizeInputMeta } from '../../../../../domains/media';

export type ImageEngineRequest = {
  readonly input: MediaOptimizeInputMeta;
  readonly signal?: AbortSignal;
  /** Raw image bytes — required for encode/decode. */
  readonly bytes?: Blob | ArrayBuffer | Uint8Array;
  readonly imageCountInRequest?: number;
  readonly aggregateRequestBytes?: number;
  /** Optional sink for optimized WebP bytes (keeps Blob out of domain results). */
  readonly onOptimizedBytes?: (bytes: Uint8Array) => void;
};
