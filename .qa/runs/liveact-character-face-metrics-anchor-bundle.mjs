// src/domains/character/liveact/liveact-face-metrics.ts
var LIVEACT_FACE_METRIC_LANDMARK_INDICES = {
  upperLip: 13,
  lowerLip: 14,
  mouthLeft: 61,
  mouthRight: 291,
  leftUpperLid: 159,
  leftLowerLid: 145,
  leftEyeInner: 133,
  leftEyeOuter: 33,
  rightUpperLid: 386,
  rightLowerLid: 374,
  rightEyeInner: 362,
  rightEyeOuter: 263,
  leftBrow: 105,
  rightBrow: 334
};
function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}
function at(landmarks, index) {
  const p = landmarks[index];
  if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return null;
  return p;
}
function ratio(numer, denom) {
  if (!(denom > 1e-8) || !Number.isFinite(numer) || !Number.isFinite(denom)) return null;
  return numer / denom;
}
function mid(a, b) {
  return { x: (a.x + b.x) * 0.5, y: (a.y + b.y) * 0.5 };
}
var FACE_ANCHOR_TO_LANDMARK_INDEX = {
  mouthUpper: LIVEACT_FACE_METRIC_LANDMARK_INDICES.upperLip,
  mouthLower: LIVEACT_FACE_METRIC_LANDMARK_INDICES.lowerLip,
  mouthCornerLeft: LIVEACT_FACE_METRIC_LANDMARK_INDICES.mouthLeft,
  mouthCornerRight: LIVEACT_FACE_METRIC_LANDMARK_INDICES.mouthRight,
  eyeLeftUpper: LIVEACT_FACE_METRIC_LANDMARK_INDICES.leftUpperLid,
  eyeLeftLower: LIVEACT_FACE_METRIC_LANDMARK_INDICES.leftLowerLid,
  eyeLeftInner: LIVEACT_FACE_METRIC_LANDMARK_INDICES.leftEyeInner,
  eyeLeftOuter: LIVEACT_FACE_METRIC_LANDMARK_INDICES.leftEyeOuter,
  eyeRightUpper: LIVEACT_FACE_METRIC_LANDMARK_INDICES.rightUpperLid,
  eyeRightLower: LIVEACT_FACE_METRIC_LANDMARK_INDICES.rightLowerLid,
  eyeRightInner: LIVEACT_FACE_METRIC_LANDMARK_INDICES.rightEyeInner,
  eyeRightOuter: LIVEACT_FACE_METRIC_LANDMARK_INDICES.rightEyeOuter,
  browLeftCenter: LIVEACT_FACE_METRIC_LANDMARK_INDICES.leftBrow,
  browRightCenter: LIVEACT_FACE_METRIC_LANDMARK_INDICES.rightBrow
};
function buildLiveActFaceLandmarksFromAnchorScreenPoints(points) {
  const landmarks = Array.from({ length: 478 }, () => ({
    x: Number.NaN,
    y: Number.NaN
  }));
  for (const [anchorId, landmarkIndex] of Object.entries(FACE_ANCHOR_TO_LANDMARK_INDEX)) {
    if (landmarkIndex == null) continue;
    const p = points[anchorId];
    if (!p) continue;
    landmarks[landmarkIndex] = { x: p.x, y: p.y };
  }
  return landmarks;
}
function computeLiveActFaceMetrics(landmarks) {
  if (landmarks.length < 300) {
    return {
      available: false,
      mouthGap: null,
      eyeOpenLeft: null,
      eyeOpenRight: null,
      browLiftLeft: null,
      browLiftRight: null,
      bbox: null
    };
  }
  const I = LIVEACT_FACE_METRIC_LANDMARK_INDICES;
  const upperLip = at(landmarks, I.upperLip);
  const lowerLip = at(landmarks, I.lowerLip);
  const mouthLeft = at(landmarks, I.mouthLeft);
  const mouthRight = at(landmarks, I.mouthRight);
  const lUp = at(landmarks, I.leftUpperLid);
  const lLo = at(landmarks, I.leftLowerLid);
  const lIn = at(landmarks, I.leftEyeInner);
  const lOut = at(landmarks, I.leftEyeOuter);
  const rUp = at(landmarks, I.rightUpperLid);
  const rLo = at(landmarks, I.rightLowerLid);
  const rIn = at(landmarks, I.rightEyeInner);
  const rOut = at(landmarks, I.rightEyeOuter);
  const lBrow = at(landmarks, I.leftBrow);
  const rBrow = at(landmarks, I.rightBrow);
  const mouthGap = upperLip && lowerLip && mouthLeft && mouthRight ? ratio(dist(upperLip, lowerLip), dist(mouthLeft, mouthRight)) : null;
  const eyeOpenLeft = lUp && lLo && lIn && lOut ? ratio(dist(lUp, lLo), dist(lIn, lOut)) : null;
  const eyeOpenRight = rUp && rLo && rIn && rOut ? ratio(dist(rUp, rLo), dist(rIn, rOut)) : null;
  const leftEyeCenter = lIn && lOut ? mid(lIn, lOut) : null;
  const rightEyeCenter = rIn && rOut ? mid(rIn, rOut) : null;
  const leftEyeWidth = lIn && lOut ? dist(lIn, lOut) : 0;
  const rightEyeWidth = rIn && rOut ? dist(rIn, rOut) : 0;
  const browLiftLeft = lBrow && leftEyeCenter ? ratio(dist(lBrow, leftEyeCenter), leftEyeWidth) : null;
  const browLiftRight = rBrow && rightEyeCenter ? ratio(dist(rBrow, rightEyeCenter), rightEyeWidth) : null;
  let minX = 1;
  let maxX = 0;
  let minY = 1;
  let maxY = 0;
  for (const p of landmarks) {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const bbox = maxX > minX && maxY > minY ? { minX, minY, maxX, maxY } : null;
  return {
    available: true,
    mouthGap,
    eyeOpenLeft,
    eyeOpenRight,
    browLiftLeft,
    browLiftRight,
    bbox
  };
}
function formatLiveActMetric(value, digits = 2) {
  if (value === null || !Number.isFinite(value)) return "\u2014";
  return value.toFixed(digits);
}
function liveActRadiansToDegrees(rad) {
  return rad * 180 / Math.PI;
}
export {
  LIVEACT_FACE_METRIC_LANDMARK_INDICES,
  buildLiveActFaceLandmarksFromAnchorScreenPoints,
  computeLiveActFaceMetrics,
  formatLiveActMetric,
  liveActRadiansToDegrees
};
