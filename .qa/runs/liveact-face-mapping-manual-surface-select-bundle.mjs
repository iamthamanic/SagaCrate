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

// src/domains/character/avatar/face-mapping-auto-surface-select-v1.ts
var FACE_MAPPING_AUTO_SURFACE_SELECT_VERSION = "SagaTreeFaceMappingAutoSurfaceSelectV1";
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
export {
  FACE_MAPPING_AUTO_SURFACE_SELECT_VERSION,
  FACE_MAPPING_SURFACE_SELECT_EXPANDED_FACE_WIDTH_RATIO,
  FACE_MAPPING_SURFACE_SELECT_STRICT_FACE_WIDTH_RATIO,
  buildFaceMappingScreenSnapOffsets,
  computeFaceMappingFaceWidthWorld,
  faceMappingScreenSnapBiasForAnchor,
  resolveFaceMappingSameRayExpandedMaxDepthDelta,
  resolveFaceMappingSurfaceSelectMaxDepthDelta,
  selectFaceMappingSurfaceAwareCandidate
};
