// src/domains/character/avatar/face-mapping-surface-semantics-v1.ts
function tokenizeNodeIdentity(nodeIdentity) {
  return nodeIdentity.toLowerCase().split(/[^a-z0-9]+/g).filter((t) => t.length > 0);
}
function classifyFaceMappingSurfaceFromNodeIdentity(nodeIdentity) {
  const raw = nodeIdentity.trim();
  if (!raw) return "unknown";
  const tokens = tokenizeNodeIdentity(raw);
  const joined = tokens.join("_");
  const has = (token) => tokens.includes(token);
  const hasAny = (...cands) => cands.some((c) => has(c));
  if (hasAny("helper", "debug", "gizmo", "null", "empty")) return "helper";
  if (hasAny(
    "weapon",
    "equip",
    "equipment",
    "armor",
    "accessory",
    "gear",
    "helmet",
    "helm",
    "headwear",
    "hat",
    "visor",
    "mask",
    "crown",
    "hood",
    "eyepatch",
    "goggles",
    "glasses",
    "sunglass",
    "sunglasses",
    "beard",
    "mustache",
    "moustache",
    "goatee",
    "stubble"
  ) || joined.includes("helmet") || joined.includes("headwear") || joined.includes("eyepatch") || joined.includes("goggles") || joined.includes("beard")) {
    return "equipment";
  }
  if (hasAny("eyelash", "lash", "eyelashes", "lashes") || joined.includes("eyelash") || joined.includes("lash")) {
    return "eyelash";
  }
  if (hasAny("eyebrow", "brow", "eyebrows", "brows") || joined.includes("eyebrow") || joined.includes("brow") && !joined.includes("elbow")) {
    return "eyebrow";
  }
  if (hasAny("eyelid", "eyelids") || joined.includes("eyelid") || has("lid") && joined.includes("eye")) {
    return "eyelid_or_skin";
  }
  if (hasAny("eye", "eyes", "iris", "sclera", "eyeball", "pupil", "cornea") || joined.includes("eyeball") || joined.includes("eye")) {
    return "eyeball";
  }
  if (hasAny("hair", "scalp", "wig", "fringe", "bangs") || joined.includes("hair")) return "hair";
  if (hasAny(
    "teeth",
    "tooth",
    "tongue",
    "gum",
    "gums",
    "denture",
    "palate",
    "uvula",
    "oral"
  ) || joined.includes("teeth") || joined.includes("tooth") || joined.includes("tongue") || joined.includes("oral") || joined.includes("innermouth") || joined.includes("mouth_interior") || joined.includes("mouthinterior") || joined.includes("inner_mouth")) {
    return "oral_interior";
  }
  if (hasAny("face", "skin", "head", "body", "cheek", "jaw", "forehead", "nose", "mouth", "lip") || joined.includes("face") || joined.includes("head") || joined.includes("skin")) {
    return "face_skin";
  }
  return "unknown";
}
var FACE_SKIN_ONLY = ["face_skin"];
var EYE_CANTHUS = ["eyelid_or_skin", "face_skin"];
var EYE_LID = ["eyelid_or_skin", "face_skin"];
var BROW = ["eyebrow", "face_skin"];
function expectedFaceMappingSurfaceClasses(anchorId) {
  switch (anchorId) {
    case "mouthUpper":
    case "mouthLower":
    case "mouthCornerLeft":
    case "mouthCornerRight":
    case "noseTip":
    case "chin":
    case "forehead":
      return FACE_SKIN_ONLY;
    case "eyeLeftInner":
    case "eyeLeftOuter":
    case "eyeRightInner":
    case "eyeRightOuter":
      return EYE_CANTHUS;
    case "eyeLeftUpper":
    case "eyeLeftLower":
    case "eyeRightUpper":
    case "eyeRightLower":
      return EYE_LID;
    case "browLeftInner":
    case "browLeftOuter":
    case "browLeftCenter":
    case "browRightInner":
    case "browRightOuter":
    case "browRightCenter":
      return BROW;
    default: {
      const _exhaustive = anchorId;
      return _exhaustive;
    }
  }
}
function isFaceMappingSurfaceSemanticsOk(anchorId, actualClass) {
  if (actualClass === "oral_interior") return false;
  const expected = expectedFaceMappingSurfaceClasses(anchorId);
  if (expected.includes(actualClass)) return true;
  if (actualClass === "unknown" && expected.includes("face_skin")) return true;
  return false;
}

// src/domains/character/avatar/face-mapping-auto-v1.ts
var FACE_MAPPING_AUTO_CONTRACT_VERSION = "SagaTreeFaceMappingAutoV1";

// src/domains/character/avatar/face-mapping-auto-surface-select-v1.ts
var FACE_MAPPING_SURFACE_SELECT_STRICT_FACE_WIDTH_RATIO = 0.08;
var FACE_MAPPING_SURFACE_SELECT_EXPANDED_FACE_WIDTH_RATIO = 0.2;
function computeFaceMappingFaceWidthWorld(leftOuter, rightOuter) {
  if (!leftOuter || !rightOuter) return null;
  if (!Number.isFinite(leftOuter.x) || !Number.isFinite(leftOuter.y) || !Number.isFinite(leftOuter.z) || !Number.isFinite(rightOuter.x) || !Number.isFinite(rightOuter.y) || !Number.isFinite(rightOuter.z)) {
    return null;
  }
  const d = Math.hypot(
    leftOuter.x - rightOuter.x,
    leftOuter.y - rightOuter.y,
    leftOuter.z - rightOuter.z
  );
  if (!Number.isFinite(d) || d <= 1e-6) return null;
  return d;
}
function resolveValidFaceWidthWorld(faceWidthWorld) {
  if (faceWidthWorld != null && Number.isFinite(faceWidthWorld) && faceWidthWorld > 1e-6) {
    return faceWidthWorld;
  }
  return null;
}
function resolveFaceMappingSurfaceSelectMaxDepthDelta(_firstDistance, options) {
  const faceW = resolveValidFaceWidthWorld(options?.faceWidthWorld);
  if (faceW == null) return null;
  return faceW * FACE_MAPPING_SURFACE_SELECT_STRICT_FACE_WIDTH_RATIO;
}
function resolveFaceMappingSameRayExpandedMaxDepthDelta(options) {
  const faceW = resolveValidFaceWidthWorld(options?.faceWidthWorld);
  if (faceW == null) return null;
  return faceW * FACE_MAPPING_SURFACE_SELECT_EXPANDED_FACE_WIDTH_RATIO;
}
function selectFaceMappingSurfaceAwareCandidate(candidates, anchorId, options) {
  if (candidates.length === 0) {
    return {
      selectedIndex: null,
      strategy: "empty",
      candidates: [],
      maxDepthDelta: 0
    };
  }
  const firstDistance = candidates[0]?.distance ?? 0;
  const faceW = resolveValidFaceWidthWorld(options?.faceWidthWorld);
  const resolvedStrict = options?.maxDepthDelta != null && Number.isFinite(options.maxDepthDelta) ? options.maxDepthDelta : resolveFaceMappingSurfaceSelectMaxDepthDelta(firstDistance, {
    faceWidthWorld: faceW
  });
  const maxDepthDelta = resolvedStrict ?? 0;
  const runPass = (gate, strategyOnHit) => {
    const diags = [];
    let selectedIndex = null;
    let sawAllowedBeyondDepth = false;
    for (let i = 0; i < candidates.length; i += 1) {
      const c = candidates[i];
      const surfaceClass = classifyFaceMappingSurfaceFromNodeIdentity(c.nodeIdentity);
      const allowed = isFaceMappingSurfaceSemanticsOk(anchorId, surfaceClass);
      const depthDeltaFromFirst = Math.max(0, c.distance - firstDistance);
      diags.push({
        order: c.order,
        distance: c.distance,
        nodeIdentity: c.nodeIdentity,
        surfaceClass,
        allowed,
        depthDeltaFromFirst
      });
      if (!allowed || selectedIndex != null) continue;
      if (depthDeltaFromFirst <= gate) {
        selectedIndex = i;
      } else {
        sawAllowedBeyondDepth = true;
      }
    }
    let strategy;
    if (selectedIndex != null) strategy = strategyOnHit;
    else if (sawAllowedBeyondDepth) strategy = "depth_rejected_only";
    else if (diags.some((d) => d.allowed)) strategy = "depth_rejected_only";
    else strategy = "none_allowed";
    return {
      selectedIndex,
      strategy,
      candidates: diags,
      maxDepthDelta: gate
    };
  };
  const strict = runPass(maxDepthDelta, "first_allowed_depth_gated");
  if (strict.selectedIndex != null) return strict;
  const allowExpand = options?.allowSameRayExpandedDepth !== false;
  if (allowExpand && faceW != null && strict.strategy === "depth_rejected_only" && options?.maxDepthDelta == null) {
    const expanded = resolveFaceMappingSameRayExpandedMaxDepthDelta({
      faceWidthWorld: faceW
    });
    if (expanded != null && expanded > maxDepthDelta + 1e-9) {
      const second = runPass(expanded, "same_ray_expanded_depth");
      if (second.selectedIndex != null) return second;
      return { ...strict, candidates: second.candidates, maxDepthDelta: expanded };
    }
  }
  return strict;
}
function faceMappingScreenSnapBiasForAnchor(anchorId) {
  if (anchorId === "eyeLeftUpper" || anchorId === "eyeRightUpper") return "up";
  if (anchorId === "eyeLeftLower" || anchorId === "eyeRightLower") return "down";
  return "radial";
}
function buildFaceMappingScreenSnapOffsets(input) {
  const iod = input.interocularPx != null && Number.isFinite(input.interocularPx) && input.interocularPx > 1 ? input.interocularPx : 80;
  const step = Math.max(2, iod * 0.04);
  const maxR = Math.max(6, iod * 0.12);
  const out = [];
  const push = (dx, dy) => {
    if (dx === 0 && dy === 0) return;
    out.push({ dx, dy });
  };
  if (input.bias === "up") {
    for (let r = step; r <= maxR + 1e-6; r += step) push(0, -r);
    for (let r = step; r <= maxR + 1e-6; r += step) {
      push(-r * 0.5, -r);
      push(r * 0.5, -r);
    }
  } else if (input.bias === "down") {
    for (let r = step; r <= maxR + 1e-6; r += step) push(0, r);
    for (let r = step; r <= maxR + 1e-6; r += step) {
      push(-r * 0.5, r);
      push(r * 0.5, r);
    }
  } else {
    for (let r = step; r <= maxR + 1e-6; r += step) {
      push(-r, 0);
      push(r, 0);
      push(0, -r);
      push(0, r);
      push(-r * 0.7, -r * 0.7);
      push(r * 0.7, -r * 0.7);
      push(-r * 0.7, r * 0.7);
      push(r * 0.7, r * 0.7);
    }
  }
  return out;
}

// src/infrastructure/character/liveact/mediapipe-sagatree-face-anchor-map-v1.ts
var MEDIAPIPE_SAGATREE_FACE_ANCHOR_MAP_VERSION = "MediaPipeSagaTreeFaceAnchorMapV1";
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

// src/infrastructure/character/avatar/face-mapping-auto-pipeline.ts
function messageForStatus(status, mapped) {
  switch (status) {
    case "no_face":
      return "Kein Gesicht im Character-Render erkannt \u2014 Framing pr\xFCfen oder manuell setzen.";
    case "multi_face":
      return "Mehrere Gesichter erkannt \u2014 Auto Mapping abgebrochen. Manuell korrigieren.";
    case "failed":
      return "Auto Mapping fehlgeschlagen \u2014 MediaPipe oder Render nicht verf\xFCgbar.";
    case "incomplete":
      return `Auto Mapping unvollst\xE4ndig (${mapped}/21) \u2014 fehlende Marker manuell setzen.`;
    case "proposed":
      return `Auto Mapping Vorschlag (${mapped}/21) \u2014 bitte pr\xFCfen und bei Bedarf korrigieren.`;
    default:
      return "Auto Mapping Status unbekannt.";
  }
}
function trySelectFromCandidates(candidates, anchorId, faceWidthWorld) {
  const selection = selectFaceMappingSurfaceAwareCandidate(candidates, anchorId, {
    faceWidthWorld
  });
  const selected = selection.selectedIndex != null ? candidates[selection.selectedIndex] ?? null : null;
  return {
    candidate: selected,
    evidence: {
      strategy: selection.strategy,
      originalScreenX: 0,
      originalScreenY: 0,
      resolvedScreenX: null,
      resolvedScreenY: null,
      snapDistancePx: null,
      normalizedSnapDistance: null,
      maxDepthDelta: selection.maxDepthDelta,
      selectedSurface: selected?.nodeIdentity ?? null,
      candidates: selection.candidates
    }
  };
}
function runFaceMappingAutoPipeline(input) {
  const { faceCount, canvasWidth, canvasHeight, listRaycastCandidates } = input;
  if (faceCount === 0) {
    return {
      contractVersion: FACE_MAPPING_AUTO_CONTRACT_VERSION,
      status: "no_face",
      faceCount: 0,
      messageDe: messageForStatus("no_face", 0),
      anchors: [],
      mapVersion: MEDIAPIPE_SAGATREE_FACE_ANCHOR_MAP_VERSION
    };
  }
  if (faceCount > 1) {
    return {
      contractVersion: FACE_MAPPING_AUTO_CONTRACT_VERSION,
      status: "multi_face",
      faceCount,
      messageDe: messageForStatus("multi_face", 0),
      anchors: [],
      mapVersion: MEDIAPIPE_SAGATREE_FACE_ANCHOR_MAP_VERSION
    };
  }
  if (!(canvasWidth > 0) || !(canvasHeight > 0) || input.landmarks.length === 0) {
    return {
      contractVersion: FACE_MAPPING_AUTO_CONTRACT_VERSION,
      status: "failed",
      faceCount,
      messageDe: messageForStatus("failed", 0),
      anchors: [],
      mapVersion: MEDIAPIPE_SAGATREE_FACE_ANCHOR_MAP_VERSION
    };
  }
  const samples = resolveAllMediaPipeAnchorSamples(input.landmarks);
  const byId = new Map(samples.map((s) => [s.anchorId, s]));
  const leftOuter = byId.get("eyeLeftOuter");
  const rightOuter = byId.get("eyeRightOuter");
  let interocularPx = null;
  if (leftOuter?.available && rightOuter?.available && leftOuter.x != null && rightOuter.x != null) {
    interocularPx = Math.hypot(
      (leftOuter.x - rightOuter.x) * canvasWidth,
      (leftOuter.y - rightOuter.y) * canvasHeight
    ) || null;
  }
  let faceWidthWorld = input.faceWidthWorld ?? null;
  if (faceWidthWorld == null && leftOuter?.available && rightOuter?.available) {
    const lHits = listRaycastCandidates(
      leftOuter.x * canvasWidth,
      leftOuter.y * canvasHeight
    );
    const rHits = listRaycastCandidates(
      rightOuter.x * canvasWidth,
      rightOuter.y * canvasHeight
    );
    faceWidthWorld = computeFaceMappingFaceWidthWorld(
      lHits[0]?.worldPoint ?? null,
      rHits[0]?.worldPoint ?? null
    );
  }
  const anchors = [];
  let mapped = 0;
  for (const sample of samples) {
    if (!sample.available) {
      anchors.push({
        anchorId: sample.anchorId,
        outcome: "missing_landmark",
        binding: null,
        confidence: null,
        landmarkAvailability: sample.availability,
        screenX: null,
        screenY: null,
        meshNodeIdentity: null,
        laterality: sample.laterality
      });
      continue;
    }
    if (sample.availability < 0.34) {
      anchors.push({
        anchorId: sample.anchorId,
        outcome: "low_confidence",
        binding: null,
        confidence: sample.availability,
        landmarkAvailability: sample.availability,
        screenX: null,
        screenY: null,
        meshNodeIdentity: null,
        laterality: sample.laterality
      });
      continue;
    }
    const screenX = sample.x * canvasWidth;
    const screenY = sample.y * canvasHeight;
    const confidence = sample.availability * (input.presenceConfidence ?? 1);
    const primaryCandidates = listRaycastCandidates(screenX, screenY);
    if (primaryCandidates.length === 0) {
      const bias2 = faceMappingScreenSnapBiasForAnchor(sample.anchorId);
      const offsets2 = buildFaceMappingScreenSnapOffsets({
        bias: bias2,
        interocularPx
      });
      let snapped2 = null;
      let snapEvidence2 = null;
      for (const off of offsets2) {
        const sx = screenX + off.dx;
        const sy = screenY + off.dy;
        if (sx < 0 || sy < 0 || sx > canvasWidth || sy > canvasHeight) continue;
        const cands = listRaycastCandidates(sx, sy);
        const attempt = trySelectFromCandidates(
          cands,
          sample.anchorId,
          faceWidthWorld
        );
        if (attempt.candidate) {
          const snapDistancePx = Math.hypot(off.dx, off.dy);
          snapped2 = attempt.candidate;
          snapEvidence2 = {
            ...attempt.evidence,
            strategy: "screen_snap",
            originalScreenX: screenX,
            originalScreenY: screenY,
            resolvedScreenX: sx,
            resolvedScreenY: sy,
            snapDistancePx,
            normalizedSnapDistance: interocularPx != null && interocularPx > 1e-6 ? snapDistancePx / interocularPx : null,
            selectedSurface: attempt.candidate.nodeIdentity
          };
          break;
        }
      }
      if (snapped2 && snapEvidence2) {
        mapped += 1;
        anchors.push({
          anchorId: sample.anchorId,
          outcome: "mapped",
          binding: snapped2.binding,
          confidence,
          landmarkAvailability: sample.availability,
          screenX: snapEvidence2.resolvedScreenX,
          screenY: snapEvidence2.resolvedScreenY,
          meshNodeIdentity: snapped2.nodeIdentity,
          laterality: sample.laterality,
          surfaceSelection: snapEvidence2
        });
        continue;
      }
      anchors.push({
        anchorId: sample.anchorId,
        outcome: "raycast_miss",
        binding: null,
        confidence,
        landmarkAvailability: sample.availability,
        screenX,
        screenY,
        meshNodeIdentity: null,
        laterality: sample.laterality,
        surfaceSelection: {
          strategy: "raycast_miss",
          originalScreenX: screenX,
          originalScreenY: screenY,
          resolvedScreenX: null,
          resolvedScreenY: null,
          snapDistancePx: null,
          normalizedSnapDistance: null,
          maxDepthDelta: null,
          selectedSurface: null,
          candidates: []
        }
      });
      continue;
    }
    const primary = trySelectFromCandidates(
      primaryCandidates,
      sample.anchorId,
      faceWidthWorld
    );
    const primaryEvidence = {
      ...primary.evidence,
      originalScreenX: screenX,
      originalScreenY: screenY,
      resolvedScreenX: primary.candidate ? screenX : null,
      resolvedScreenY: primary.candidate ? screenY : null
    };
    if (primary.candidate) {
      mapped += 1;
      anchors.push({
        anchorId: sample.anchorId,
        outcome: "mapped",
        binding: primary.candidate.binding,
        confidence,
        landmarkAvailability: sample.availability,
        screenX,
        screenY,
        meshNodeIdentity: primary.candidate.nodeIdentity,
        laterality: sample.laterality,
        surfaceSelection: primaryEvidence
      });
      continue;
    }
    const bias = faceMappingScreenSnapBiasForAnchor(sample.anchorId);
    const offsets = buildFaceMappingScreenSnapOffsets({
      bias,
      interocularPx
    });
    let snapped = null;
    let snapEvidence = null;
    for (const off of offsets) {
      const sx = screenX + off.dx;
      const sy = screenY + off.dy;
      if (sx < 0 || sy < 0 || sx > canvasWidth || sy > canvasHeight) continue;
      const cands = listRaycastCandidates(sx, sy);
      const attempt = trySelectFromCandidates(
        cands,
        sample.anchorId,
        faceWidthWorld
      );
      if (attempt.candidate) {
        const snapDistancePx = Math.hypot(off.dx, off.dy);
        snapped = attempt.candidate;
        snapEvidence = {
          ...attempt.evidence,
          strategy: "screen_snap",
          originalScreenX: screenX,
          originalScreenY: screenY,
          resolvedScreenX: sx,
          resolvedScreenY: sy,
          snapDistancePx,
          normalizedSnapDistance: interocularPx != null && interocularPx > 1e-6 ? snapDistancePx / interocularPx : null,
          selectedSurface: attempt.candidate.nodeIdentity
        };
        break;
      }
    }
    if (snapped && snapEvidence) {
      mapped += 1;
      anchors.push({
        anchorId: sample.anchorId,
        outcome: "mapped",
        binding: snapped.binding,
        confidence,
        landmarkAvailability: sample.availability,
        screenX: snapEvidence.resolvedScreenX,
        screenY: snapEvidence.resolvedScreenY,
        meshNodeIdentity: snapped.nodeIdentity,
        laterality: sample.laterality,
        surfaceSelection: snapEvidence
      });
      continue;
    }
    anchors.push({
      anchorId: sample.anchorId,
      outcome: "surface_mismatch",
      binding: null,
      confidence,
      landmarkAvailability: sample.availability,
      screenX,
      screenY,
      meshNodeIdentity: primaryCandidates[0]?.nodeIdentity ?? null,
      laterality: sample.laterality,
      surfaceSelection: primaryEvidence
    });
  }
  const status = mapped === 21 ? "proposed" : mapped > 0 ? "incomplete" : "incomplete";
  return {
    contractVersion: FACE_MAPPING_AUTO_CONTRACT_VERSION,
    status,
    faceCount: 1,
    messageDe: messageForStatus(status, mapped),
    anchors,
    mapVersion: MEDIAPIPE_SAGATREE_FACE_ANCHOR_MAP_VERSION
  };
}
export {
  runFaceMappingAutoPipeline
};
