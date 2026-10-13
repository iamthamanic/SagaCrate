// src/domains/character/avatar/face-mapping-surface-semantics-v1.ts
var FACE_MAPPING_SURFACE_SEMANTICS_VERSION = "SagaTreeFaceMappingSurfaceSemanticsV1";
var FACE_MAPPING_SURFACE_CLASSES_V1 = [
  "face_skin",
  "eyeball",
  "eyelid_or_skin",
  "eyelash",
  "eyebrow",
  "hair",
  "equipment",
  "helper",
  "oral_interior",
  "unknown"
];
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
export {
  FACE_MAPPING_SURFACE_CLASSES_V1,
  FACE_MAPPING_SURFACE_SEMANTICS_VERSION,
  classifyFaceMappingSurfaceFromNodeIdentity,
  expectedFaceMappingSurfaceClasses,
  isFaceMappingSurfaceSemanticsOk
};
