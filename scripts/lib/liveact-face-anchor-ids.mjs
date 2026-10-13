/**
 * liveact-face-anchor-ids — canonical SagaTreeFaceAnchorsV1 ids for offline scripts (#399).
 * Location: scripts/lib/liveact-face-anchor-ids.mjs
 */

export const FACE_ANCHORS_CONTRACT_VERSION = 'SagaTreeFaceAnchorsV1';

export const SAGA_TREE_FACE_ANCHOR_IDS = [
  'mouthUpper',
  'mouthLower',
  'mouthCornerLeft',
  'mouthCornerRight',
  'eyeLeftInner',
  'eyeLeftOuter',
  'eyeLeftUpper',
  'eyeLeftLower',
  'eyeRightInner',
  'eyeRightOuter',
  'eyeRightUpper',
  'eyeRightLower',
  'browLeftInner',
  'browLeftOuter',
  'browLeftCenter',
  'browRightInner',
  'browRightOuter',
  'browRightCenter',
  'noseTip',
  'chin',
  'forehead',
];

export function isSagaTreeFaceAnchorId(id) {
  return SAGA_TREE_FACE_ANCHOR_IDS.includes(id);
}
