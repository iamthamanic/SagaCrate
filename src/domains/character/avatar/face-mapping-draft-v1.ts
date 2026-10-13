/**
 * SagaTreeFaceMappingDraftV1 — session-local manual face-mapping draft (#420/#visual-guides).
 * Location: src/domains/character/avatar/face-mapping-draft-v1.ts
 *
 * Pure draft/status/validation for the 21 SagaTreeFaceAnchorsV1 markers.
 * Binding DE labels are the Face-Rig Editor source of truth (inner/outer = eye corners).
 * No React / Three.js. Runtime format stays SagaTreeFaceAnchorsV1.
 */

import {
  FACE_ANCHORS_CONTRACT_VERSION,
  SAGA_TREE_FACE_ANCHOR_IDS,
  type SagaTreeFaceAnchorId,
  type SagaTreeFaceAnchorTriangleBinding,
  type SagaTreeFaceAnchorsManifestV1,
  validateFaceAnchorTriangleBinding,
} from './face-anchor-contract';
import {
  classifyFaceMappingSurfaceFromNodeIdentity,
  isFaceMappingSurfaceSemanticsOk,
} from './face-mapping-surface-semantics-v1';

export const FACE_MAPPING_DRAFT_CONTRACT_VERSION = 'SagaTreeFaceMappingDraftV1' as const;

export const FACE_MAPPING_MARKER_STATUSES = [
  'missing',
  'set',
  'invalid',
  'reviewed',
] as const;

export type FaceMappingMarkerStatus = (typeof FACE_MAPPING_MARKER_STATUSES)[number];

export const FACE_MAPPING_MARKER_GROUPS = [
  'mouth',
  'eyeLeft',
  'eyeRight',
  'browLeft',
  'browRight',
  'face',
] as const;

export type FaceMappingMarkerGroupId = (typeof FACE_MAPPING_MARKER_GROUPS)[number];

export interface FaceMappingMarkerGroupV1 {
  readonly id: FaceMappingMarkerGroupId;
  /** German UI label. */
  readonly labelDe: string;
  readonly anchorIds: readonly SagaTreeFaceAnchorId[];
}

/** Canonical UI grouping for the 21 markers (brow L/R split for binding labels). */
export const FACE_MAPPING_MARKER_GROUP_DEFS: readonly FaceMappingMarkerGroupV1[] = [
  {
    id: 'mouth',
    labelDe: 'Mund',
    anchorIds: ['mouthUpper', 'mouthLower', 'mouthCornerLeft', 'mouthCornerRight'],
  },
  {
    id: 'eyeLeft',
    labelDe: 'Linkes Auge',
    anchorIds: ['eyeLeftInner', 'eyeLeftOuter', 'eyeLeftUpper', 'eyeLeftLower'],
  },
  {
    id: 'eyeRight',
    labelDe: 'Rechtes Auge',
    anchorIds: ['eyeRightInner', 'eyeRightOuter', 'eyeRightUpper', 'eyeRightLower'],
  },
  {
    id: 'browLeft',
    labelDe: 'Linke Braue',
    anchorIds: ['browLeftInner', 'browLeftCenter', 'browLeftOuter'],
  },
  {
    id: 'browRight',
    labelDe: 'Rechte Braue',
    anchorIds: ['browRightInner', 'browRightCenter', 'browRightOuter'],
  },
  {
    id: 'face',
    labelDe: 'Gesicht',
    anchorIds: ['noseTip', 'chin', 'forehead'],
  },
];

/**
 * Binding German labels for Face-Rig Editor rows.
 * Eye inner/outer = corners toward nose / temple (not pupil).
 */
export const FACE_MAPPING_ANCHOR_LABEL_DE: Readonly<Record<SagaTreeFaceAnchorId, string>> = {
  mouthUpper: 'Oberlippe Mitte',
  mouthLower: 'Unterlippe Mitte',
  mouthCornerLeft: 'Linker Mundwinkel',
  mouthCornerRight: 'Rechter Mundwinkel',
  eyeLeftInner: 'Innerer Augenwinkel',
  eyeLeftOuter: 'Äußerer Augenwinkel',
  eyeLeftUpper: 'Oberes Augenlid',
  eyeLeftLower: 'Unteres Augenlid',
  eyeRightInner: 'Innerer Augenwinkel',
  eyeRightOuter: 'Äußerer Augenwinkel',
  eyeRightUpper: 'Oberes Augenlid',
  eyeRightLower: 'Unteres Augenlid',
  browLeftInner: 'Inneres Ende',
  browLeftOuter: 'Äußeres Ende',
  browLeftCenter: 'Mitte',
  browRightInner: 'Inneres Ende',
  browRightOuter: 'Äußeres Ende',
  browRightCenter: 'Mitte',
  noseTip: 'Nasenspitze',
  chin: 'Kinnmitte',
  forehead: 'Stirnmitte',
};

/** Short German labels for 3D overlay (binding semantics, compact). */
export const FACE_MAPPING_ANCHOR_SHORT_DE: Readonly<Record<SagaTreeFaceAnchorId, string>> = {
  mouthUpper: 'Oberlippe',
  mouthLower: 'Unterlippe',
  mouthCornerLeft: 'Mund L',
  mouthCornerRight: 'Mund R',
  eyeLeftInner: 'Innen L',
  eyeLeftOuter: 'Außen L',
  eyeLeftUpper: 'Lid ↑ L',
  eyeLeftLower: 'Lid ↓ L',
  eyeRightInner: 'Innen R',
  eyeRightOuter: 'Außen R',
  eyeRightUpper: 'Lid ↑ R',
  eyeRightLower: 'Lid ↓ R',
  browLeftInner: 'Braue L innen',
  browLeftOuter: 'Braue L außen',
  browLeftCenter: 'Braue L',
  browRightInner: 'Braue R innen',
  browRightOuter: 'Braue R außen',
  browRightCenter: 'Braue R',
  noseTip: 'Nase',
  chin: 'Kinn',
  forehead: 'Stirn',
};

export type FaceMappingDraftAnchors = Partial<
  Record<SagaTreeFaceAnchorId, SagaTreeFaceAnchorTriangleBinding | null>
>;

export interface SagaTreeFaceMappingDraftV1 {
  readonly contractVersion: typeof FACE_MAPPING_DRAFT_CONTRACT_VERSION;
  /** Snapshot when Face Setup opened (Cancel / Reset target). */
  readonly baseline: SagaTreeFaceAnchorsManifestV1 | null;
  /** Working bindings; null value = explicitly cleared. */
  readonly anchors: FaceMappingDraftAnchors;
  readonly selectedAnchorId: SagaTreeFaceAnchorId | null;
  readonly dirty: boolean;
}

export function createEmptyFaceMappingDraft(
  baseline: SagaTreeFaceAnchorsManifestV1 | null = null,
): SagaTreeFaceMappingDraftV1 {
  const anchors: FaceMappingDraftAnchors = {};
  if (baseline) {
    for (const id of SAGA_TREE_FACE_ANCHOR_IDS) {
      const binding = baseline.anchors[id];
      if (binding) anchors[id] = { ...binding, barycentric: { ...binding.barycentric } };
    }
  }
  return {
    contractVersion: FACE_MAPPING_DRAFT_CONTRACT_VERSION,
    baseline,
    anchors,
    selectedAnchorId: null,
    dirty: false,
  };
}

export function selectFaceMappingAnchor(
  draft: SagaTreeFaceMappingDraftV1,
  anchorId: SagaTreeFaceAnchorId | null,
): SagaTreeFaceMappingDraftV1 {
  return { ...draft, selectedAnchorId: anchorId };
}

export function setFaceMappingDraftBinding(
  draft: SagaTreeFaceMappingDraftV1,
  anchorId: SagaTreeFaceAnchorId,
  binding: SagaTreeFaceAnchorTriangleBinding,
): SagaTreeFaceMappingDraftV1 {
  return {
    ...draft,
    anchors: { ...draft.anchors, [anchorId]: binding },
    dirty: true,
  };
}

export function clearFaceMappingDraftBinding(
  draft: SagaTreeFaceMappingDraftV1,
  anchorId: SagaTreeFaceAnchorId,
): SagaTreeFaceMappingDraftV1 {
  return {
    ...draft,
    anchors: { ...draft.anchors, [anchorId]: null },
    dirty: true,
  };
}

/** Reset working anchors to the baseline captured at open. */
export function resetFaceMappingDraft(draft: SagaTreeFaceMappingDraftV1): SagaTreeFaceMappingDraftV1 {
  return createEmptyFaceMappingDraft(draft.baseline);
}

export function resolveFaceMappingMarkerStatus(
  draft: SagaTreeFaceMappingDraftV1,
  anchorId: SagaTreeFaceAnchorId,
  options?: { reviewedAnchorIds?: ReadonlySet<SagaTreeFaceAnchorId> },
): FaceMappingMarkerStatus {
  const binding = draft.anchors[anchorId];
  if (binding == null) return 'missing';
  const validation = validateFaceAnchorTriangleBinding(binding, anchorId);
  if (!validation.ok) return 'invalid';
  const surfaceClass = classifyFaceMappingSurfaceFromNodeIdentity(binding.nodeIdentity);
  if (!isFaceMappingSurfaceSemanticsOk(anchorId, surfaceClass)) return 'invalid';
  if (options?.reviewedAnchorIds?.has(anchorId)) return 'reviewed';
  return 'set';
}

export function faceMappingDraftToManifest(
  draft: SagaTreeFaceMappingDraftV1,
): SagaTreeFaceAnchorsManifestV1 {
  const anchors: Partial<Record<SagaTreeFaceAnchorId, SagaTreeFaceAnchorTriangleBinding>> = {};
  for (const id of SAGA_TREE_FACE_ANCHOR_IDS) {
    const binding = draft.anchors[id];
    if (!binding) continue;
    const validation = validateFaceAnchorTriangleBinding(binding, id);
    if (!validation.ok) continue;
    anchors[id] = binding;
  }
  return {
    contractVersion: FACE_ANCHORS_CONTRACT_VERSION,
    anchors,
  };
}

export interface FaceMappingDraftValidationResult {
  readonly ok: boolean;
  readonly setCount: number;
  readonly missingCount: number;
  readonly invalidCount: number;
}

export function validateFaceMappingDraft(
  draft: SagaTreeFaceMappingDraftV1,
): FaceMappingDraftValidationResult {
  let setCount = 0;
  let missingCount = 0;
  let invalidCount = 0;
  for (const id of SAGA_TREE_FACE_ANCHOR_IDS) {
    const status = resolveFaceMappingMarkerStatus(draft, id);
    if (status === 'missing') missingCount += 1;
    else if (status === 'invalid') invalidCount += 1;
    else setCount += 1;
  }
  return {
    ok: invalidCount === 0 && setCount > 0,
    setCount,
    missingCount,
    invalidCount,
  };
}
