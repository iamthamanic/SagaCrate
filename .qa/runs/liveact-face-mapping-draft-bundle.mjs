// src/domains/character/avatar/face-anchor-contract.ts
var FACE_ANCHORS_CONTRACT_VERSION = "SagaTreeFaceAnchorsV1";
var SAGA_TREE_FACE_ANCHOR_IDS = [
  "mouthUpper",
  "mouthLower",
  "mouthCornerLeft",
  "mouthCornerRight",
  "eyeLeftInner",
  "eyeLeftOuter",
  "eyeLeftUpper",
  "eyeLeftLower",
  "eyeRightInner",
  "eyeRightOuter",
  "eyeRightUpper",
  "eyeRightLower",
  "browLeftInner",
  "browLeftOuter",
  "browLeftCenter",
  "browRightInner",
  "browRightOuter",
  "browRightCenter",
  "noseTip",
  "chin",
  "forehead"
];
var BARYCENTRIC_EPS = 1e-4;
var BARYCENTRIC_SUM_EPS = 1e-3;
function validateFaceAnchorBarycentric(barycentric) {
  const { u, v, w } = barycentric;
  if (!Number.isFinite(u) || !Number.isFinite(v) || !Number.isFinite(w)) {
    return { code: "invalid_barycentric", detail: "Barycentric components must be finite numbers." };
  }
  if (u < -BARYCENTRIC_EPS || v < -BARYCENTRIC_EPS || w < -BARYCENTRIC_EPS) {
    return { code: "invalid_barycentric", detail: "Barycentric weights must be non-negative." };
  }
  const sum = u + v + w;
  if (Math.abs(sum - 1) > BARYCENTRIC_SUM_EPS) {
    return {
      code: "invalid_barycentric",
      detail: `Barycentric weights must sum to 1 (got ${sum}).`
    };
  }
  return null;
}
function validateFaceAnchorTriangleBinding(binding, anchorId) {
  const issues = [];
  const nodeIdentity = binding.nodeIdentity.trim();
  if (!nodeIdentity) {
    issues.push({
      code: "invalid_node_identity",
      anchorId,
      detail: "nodeIdentity must be a non-empty stable node id."
    });
  }
  if (!Number.isInteger(binding.primitiveIndex) || binding.primitiveIndex < 0) {
    issues.push({
      code: "invalid_primitive_index",
      anchorId,
      detail: "primitiveIndex must be a non-negative integer."
    });
  }
  if (!Number.isInteger(binding.triangleIndex) || binding.triangleIndex < 0) {
    issues.push({
      code: "invalid_triangle_index",
      anchorId,
      detail: "triangleIndex must be a non-negative integer."
    });
  }
  const baryIssue = validateFaceAnchorBarycentric(binding.barycentric);
  if (baryIssue) {
    issues.push({ ...baryIssue, anchorId });
  }
  return { ok: issues.length === 0, issues };
}

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

// src/domains/character/avatar/face-mapping-draft-v1.ts
var FACE_MAPPING_DRAFT_CONTRACT_VERSION = "SagaTreeFaceMappingDraftV1";
var FACE_MAPPING_MARKER_STATUSES = [
  "missing",
  "set",
  "invalid",
  "reviewed"
];
var FACE_MAPPING_MARKER_GROUPS = [
  "mouth",
  "eyeLeft",
  "eyeRight",
  "browLeft",
  "browRight",
  "face"
];
var FACE_MAPPING_MARKER_GROUP_DEFS = [
  {
    id: "mouth",
    labelDe: "Mund",
    anchorIds: ["mouthUpper", "mouthLower", "mouthCornerLeft", "mouthCornerRight"]
  },
  {
    id: "eyeLeft",
    labelDe: "Linkes Auge",
    anchorIds: ["eyeLeftInner", "eyeLeftOuter", "eyeLeftUpper", "eyeLeftLower"]
  },
  {
    id: "eyeRight",
    labelDe: "Rechtes Auge",
    anchorIds: ["eyeRightInner", "eyeRightOuter", "eyeRightUpper", "eyeRightLower"]
  },
  {
    id: "browLeft",
    labelDe: "Linke Braue",
    anchorIds: ["browLeftInner", "browLeftCenter", "browLeftOuter"]
  },
  {
    id: "browRight",
    labelDe: "Rechte Braue",
    anchorIds: ["browRightInner", "browRightCenter", "browRightOuter"]
  },
  {
    id: "face",
    labelDe: "Gesicht",
    anchorIds: ["noseTip", "chin", "forehead"]
  }
];
var FACE_MAPPING_ANCHOR_LABEL_DE = {
  mouthUpper: "Oberlippe Mitte",
  mouthLower: "Unterlippe Mitte",
  mouthCornerLeft: "Linker Mundwinkel",
  mouthCornerRight: "Rechter Mundwinkel",
  eyeLeftInner: "Innerer Augenwinkel",
  eyeLeftOuter: "\xC4u\xDFerer Augenwinkel",
  eyeLeftUpper: "Oberes Augenlid",
  eyeLeftLower: "Unteres Augenlid",
  eyeRightInner: "Innerer Augenwinkel",
  eyeRightOuter: "\xC4u\xDFerer Augenwinkel",
  eyeRightUpper: "Oberes Augenlid",
  eyeRightLower: "Unteres Augenlid",
  browLeftInner: "Inneres Ende",
  browLeftOuter: "\xC4u\xDFeres Ende",
  browLeftCenter: "Mitte",
  browRightInner: "Inneres Ende",
  browRightOuter: "\xC4u\xDFeres Ende",
  browRightCenter: "Mitte",
  noseTip: "Nasenspitze",
  chin: "Kinnmitte",
  forehead: "Stirnmitte"
};
var FACE_MAPPING_ANCHOR_SHORT_DE = {
  mouthUpper: "Oberlippe",
  mouthLower: "Unterlippe",
  mouthCornerLeft: "Mund L",
  mouthCornerRight: "Mund R",
  eyeLeftInner: "Innen L",
  eyeLeftOuter: "Au\xDFen L",
  eyeLeftUpper: "Lid \u2191 L",
  eyeLeftLower: "Lid \u2193 L",
  eyeRightInner: "Innen R",
  eyeRightOuter: "Au\xDFen R",
  eyeRightUpper: "Lid \u2191 R",
  eyeRightLower: "Lid \u2193 R",
  browLeftInner: "Braue L innen",
  browLeftOuter: "Braue L au\xDFen",
  browLeftCenter: "Braue L",
  browRightInner: "Braue R innen",
  browRightOuter: "Braue R au\xDFen",
  browRightCenter: "Braue R",
  noseTip: "Nase",
  chin: "Kinn",
  forehead: "Stirn"
};
function createEmptyFaceMappingDraft(baseline = null) {
  const anchors = {};
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
    dirty: false
  };
}
function selectFaceMappingAnchor(draft, anchorId) {
  return { ...draft, selectedAnchorId: anchorId };
}
function setFaceMappingDraftBinding(draft, anchorId, binding) {
  return {
    ...draft,
    anchors: { ...draft.anchors, [anchorId]: binding },
    dirty: true
  };
}
function clearFaceMappingDraftBinding(draft, anchorId) {
  return {
    ...draft,
    anchors: { ...draft.anchors, [anchorId]: null },
    dirty: true
  };
}
function resetFaceMappingDraft(draft) {
  return createEmptyFaceMappingDraft(draft.baseline);
}
function resolveFaceMappingMarkerStatus(draft, anchorId, options) {
  const binding = draft.anchors[anchorId];
  if (binding == null) return "missing";
  const validation = validateFaceAnchorTriangleBinding(binding, anchorId);
  if (!validation.ok) return "invalid";
  const surfaceClass = classifyFaceMappingSurfaceFromNodeIdentity(binding.nodeIdentity);
  if (!isFaceMappingSurfaceSemanticsOk(anchorId, surfaceClass)) return "invalid";
  if (options?.reviewedAnchorIds?.has(anchorId)) return "reviewed";
  return "set";
}
function faceMappingDraftToManifest(draft) {
  const anchors = {};
  for (const id of SAGA_TREE_FACE_ANCHOR_IDS) {
    const binding = draft.anchors[id];
    if (!binding) continue;
    const validation = validateFaceAnchorTriangleBinding(binding, id);
    if (!validation.ok) continue;
    anchors[id] = binding;
  }
  return {
    contractVersion: FACE_ANCHORS_CONTRACT_VERSION,
    anchors
  };
}
function validateFaceMappingDraft(draft) {
  let setCount = 0;
  let missingCount = 0;
  let invalidCount = 0;
  for (const id of SAGA_TREE_FACE_ANCHOR_IDS) {
    const status = resolveFaceMappingMarkerStatus(draft, id);
    if (status === "missing") missingCount += 1;
    else if (status === "invalid") invalidCount += 1;
    else setCount += 1;
  }
  return {
    ok: invalidCount === 0 && setCount > 0,
    setCount,
    missingCount,
    invalidCount
  };
}
export {
  FACE_MAPPING_ANCHOR_LABEL_DE,
  FACE_MAPPING_ANCHOR_SHORT_DE,
  FACE_MAPPING_DRAFT_CONTRACT_VERSION,
  FACE_MAPPING_MARKER_GROUPS,
  FACE_MAPPING_MARKER_GROUP_DEFS,
  FACE_MAPPING_MARKER_STATUSES,
  clearFaceMappingDraftBinding,
  createEmptyFaceMappingDraft,
  faceMappingDraftToManifest,
  resetFaceMappingDraft,
  resolveFaceMappingMarkerStatus,
  selectFaceMappingAnchor,
  setFaceMappingDraftBinding,
  validateFaceMappingDraft
};
