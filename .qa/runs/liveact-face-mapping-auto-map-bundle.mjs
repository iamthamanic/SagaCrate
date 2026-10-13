// src/infrastructure/character/liveact/mediapipe-sagatree-face-anchor-map-v1.ts
var MEDIAPIPE_SAGATREE_FACE_ANCHOR_MAP_VERSION = "MediaPipeSagaTreeFaceAnchorMapV1";
function mediapipeAnatomicalLeftLandmarkIndicesForTests() {
  return [
    291,
    // mouth corner left
    362,
    // eye left inner (LEFT_EYE)
    263,
    // eye left outer (LEFT_EYE)
    386,
    // eye left upper lid (LEFT_EYE)
    385,
    387,
    374,
    // eye left lower lid
    380,
    373,
    336,
    // brow left inner
    334,
    // brow left (in LEFT_EYEBROW centroid set)
    300,
    // brow left outer
    296,
    295,
    293,
    285,
    283,
    282,
    276
  ];
}
var MEDIAPIPE_SAGATREE_FACE_ANCHOR_MAP_V1 = [
  {
    anchorId: "noseTip",
    landmarkIndices: [1],
    kind: "single",
    rationale: "Face Mesh tip of nose (stable midline). Keep unless new evidence.",
    expectedRegion: "midline",
    laterality: "center"
  },
  {
    anchorId: "chin",
    landmarkIndices: [175, 199],
    kind: "midpoint",
    rationale: "Chin pad center: midpoint of tesselation chin-pad landmarks 175+199 \u2014 not FACE_OVAL bottom 152.",
    expectedRegion: "midline",
    laterality: "center"
  },
  {
    anchorId: "forehead",
    landmarkIndices: [151, 10],
    kind: "midpoint",
    rationale: "Visible forehead center: midpoint of mid-forehead 151 and oval-top 10 \u2014 not hairline-only 10.",
    expectedRegion: "midline",
    laterality: "center"
  },
  {
    anchorId: "mouthUpper",
    landmarkIndices: [0, 13],
    kind: "midpoint",
    rationale: "Upper lip body: midpoint of outer upper lip 0 and inner upper 13 (FACE_LANDMARKS_LIPS). Not seam-only 13.",
    expectedRegion: "mouth",
    laterality: "center"
  },
  {
    anchorId: "mouthLower",
    landmarkIndices: [14, 17],
    kind: "midpoint",
    rationale: "Lower lip body: midpoint of inner lower 14 and outer lower 17 (FACE_LANDMARKS_LIPS). Not seam-only 14.",
    expectedRegion: "mouth",
    laterality: "center"
  },
  {
    anchorId: "mouthCornerLeft",
    landmarkIndices: [291],
    kind: "single",
    rationale: "Anatomical left mouth corner (291). Paired with FACE_LANDMARKS_LEFT_EYE laterality \u2014 not LiveAct mouthLeft=61.",
    expectedRegion: "mouth",
    laterality: "left"
  },
  {
    anchorId: "mouthCornerRight",
    landmarkIndices: [61],
    kind: "single",
    rationale: "Anatomical right mouth corner (61). Paired with FACE_LANDMARKS_RIGHT_EYE laterality \u2014 not LiveAct mouthRight=291.",
    expectedRegion: "mouth",
    laterality: "right"
  },
  {
    anchorId: "eyeLeftInner",
    landmarkIndices: [362],
    kind: "single",
    rationale: "Subject's left eye inner canthus \u2014 FaceLandmarker.FACE_LANDMARKS_LEFT_EYE (362).",
    expectedRegion: "eye_left",
    laterality: "left"
  },
  {
    anchorId: "eyeLeftOuter",
    landmarkIndices: [263],
    kind: "single",
    rationale: "Subject's left eye outer canthus \u2014 FaceLandmarker.FACE_LANDMARKS_LEFT_EYE (263).",
    expectedRegion: "eye_left",
    laterality: "left"
  },
  {
    anchorId: "eyeLeftUpper",
    landmarkIndices: [386, 385, 387],
    kind: "centroid",
    rationale: "Left upper lid centroid from FACE_LANDMARKS_LEFT_EYE (386+neighbors) \u2014 single lid index alone jitters.",
    expectedRegion: "eye_left",
    laterality: "left"
  },
  {
    anchorId: "eyeLeftLower",
    landmarkIndices: [374, 380, 373],
    kind: "centroid",
    rationale: "Left lower lid centroid from FACE_LANDMARKS_LEFT_EYE neighborhood (374+neighbors).",
    expectedRegion: "eye_left",
    laterality: "left"
  },
  {
    anchorId: "eyeRightInner",
    landmarkIndices: [133],
    kind: "single",
    rationale: "Subject's right eye inner canthus \u2014 FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE (133).",
    expectedRegion: "eye_right",
    laterality: "right"
  },
  {
    anchorId: "eyeRightOuter",
    landmarkIndices: [33],
    kind: "single",
    rationale: "Subject's right eye outer canthus \u2014 FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE (33).",
    expectedRegion: "eye_right",
    laterality: "right"
  },
  {
    anchorId: "eyeRightUpper",
    landmarkIndices: [159, 158, 157],
    kind: "centroid",
    rationale: "Right upper lid centroid from FACE_LANDMARKS_RIGHT_EYE (159+neighbors).",
    expectedRegion: "eye_right",
    laterality: "right"
  },
  {
    anchorId: "eyeRightLower",
    landmarkIndices: [145, 144, 153],
    kind: "centroid",
    rationale: "Right lower lid centroid from FACE_LANDMARKS_RIGHT_EYE neighborhood (145+neighbors).",
    expectedRegion: "eye_right",
    laterality: "right"
  },
  {
    anchorId: "browLeftInner",
    landmarkIndices: [336],
    kind: "single",
    rationale: "Subject's left brow near glabella \u2014 FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW (336).",
    expectedRegion: "brow_left",
    laterality: "left"
  },
  {
    anchorId: "browLeftCenter",
    landmarkIndices: [296, 334, 282],
    kind: "centroid",
    rationale: "Visible left brow centerline mid \u2014 centroid of LEFT_EYEBROW mid-arc 296/334/282 (between inner 336 and outer 300).",
    expectedRegion: "brow_left",
    laterality: "left"
  },
  {
    anchorId: "browLeftOuter",
    landmarkIndices: [300],
    kind: "single",
    rationale: "Subject's left brow temple end \u2014 FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW (300).",
    expectedRegion: "brow_left",
    laterality: "left"
  },
  {
    anchorId: "browRightInner",
    landmarkIndices: [107],
    kind: "single",
    rationale: "Subject's right brow near glabella \u2014 FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW (107).",
    expectedRegion: "brow_right",
    laterality: "right"
  },
  {
    anchorId: "browRightCenter",
    landmarkIndices: [66, 105, 52],
    kind: "centroid",
    rationale: "Visible right brow centerline mid \u2014 centroid of RIGHT_EYEBROW mid-arc 66/105/52 (between inner 107 and outer 70).",
    expectedRegion: "brow_right",
    laterality: "right"
  },
  {
    anchorId: "browRightOuter",
    landmarkIndices: [70],
    kind: "single",
    rationale: "Subject's right brow temple end \u2014 FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW (70).",
    expectedRegion: "brow_right",
    laterality: "right"
  }
];
var FACE_ANCHOR_MAP_V1_LIMITATIONS = [
  "no_full_upper_lip_curve",
  "no_full_lower_lip_curve",
  "no_detailed_cheek_surface",
  "no_nasolabial_curve",
  "no_iris_pupil_representation",
  "no_detailed_lid_curve"
];
function at(landmarks, index) {
  const p = landmarks[index];
  if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return null;
  if (p.x < -0.05 || p.x > 1.05 || p.y < -0.05 || p.y > 1.05) return null;
  return p;
}
function resolveMediaPipeAnchorSample(landmarks, entry) {
  const points = [];
  for (const index of entry.landmarkIndices) {
    const p = at(landmarks, index);
    if (p) points.push(p);
  }
  const availability = entry.landmarkIndices.length === 0 ? 0 : points.length / entry.landmarkIndices.length;
  if (points.length === 0) {
    return {
      anchorId: entry.anchorId,
      available: false,
      x: Number.NaN,
      y: Number.NaN,
      availability: 0,
      laterality: entry.laterality
    };
  }
  let x = 0;
  let y = 0;
  for (const p of points) {
    x += p.x;
    y += p.y;
  }
  x /= points.length;
  y /= points.length;
  return {
    anchorId: entry.anchorId,
    available: true,
    x,
    y,
    availability,
    laterality: entry.laterality
  };
}
function resolveAllMediaPipeAnchorSamples(landmarks) {
  return MEDIAPIPE_SAGATREE_FACE_ANCHOR_MAP_V1.map(
    (entry) => resolveMediaPipeAnchorSample(landmarks, entry)
  );
}
function assertMediaPipeSagaTreeFaceAnchorMapComplete() {
  const ids = new Set(MEDIAPIPE_SAGATREE_FACE_ANCHOR_MAP_V1.map((e) => e.anchorId));
  if (ids.size !== 21) {
    throw new Error(`MediaPipe map must cover 21 unique anchors (got ${ids.size}).`);
  }
}
export {
  FACE_ANCHOR_MAP_V1_LIMITATIONS,
  MEDIAPIPE_SAGATREE_FACE_ANCHOR_MAP_V1,
  MEDIAPIPE_SAGATREE_FACE_ANCHOR_MAP_VERSION,
  assertMediaPipeSagaTreeFaceAnchorMapComplete,
  mediapipeAnatomicalLeftLandmarkIndicesForTests,
  resolveAllMediaPipeAnchorSamples,
  resolveMediaPipeAnchorSample
};
