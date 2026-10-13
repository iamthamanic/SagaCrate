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
function isSagaTreeFaceAnchorId(id) {
  return SAGA_TREE_FACE_ANCHOR_IDS.includes(id);
}
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
function validateFaceAnchorsManifestV1(manifest) {
  const issues = [];
  if (manifest.contractVersion !== FACE_ANCHORS_CONTRACT_VERSION) {
    issues.push({
      code: "contract_version_mismatch",
      detail: `Expected ${FACE_ANCHORS_CONTRACT_VERSION}, got ${String(manifest.contractVersion)}.`
    });
  }
  for (const [rawId, binding] of Object.entries(manifest.anchors)) {
    if (!isSagaTreeFaceAnchorId(rawId)) {
      issues.push({
        code: "invalid_anchor_id",
        detail: `Unknown anchor id: ${rawId}`
      });
      continue;
    }
    if (!binding) continue;
    const one = validateFaceAnchorTriangleBinding(binding, rawId);
    issues.push(...one.issues);
  }
  return { ok: issues.length === 0, issues };
}
function parseFaceAnchorsManifestV1(input) {
  if (!input || typeof input !== "object") {
    return {
      ok: false,
      issues: [{ code: "contract_version_mismatch", detail: "Manifest must be a JSON object." }]
    };
  }
  const record = input;
  const version = record.contractVersion;
  const anchorsRaw = record.anchors;
  if (version !== FACE_ANCHORS_CONTRACT_VERSION) {
    return {
      ok: false,
      issues: [
        {
          code: "contract_version_mismatch",
          detail: `Expected ${FACE_ANCHORS_CONTRACT_VERSION}.`
        }
      ]
    };
  }
  if (!anchorsRaw || typeof anchorsRaw !== "object" || Array.isArray(anchorsRaw)) {
    return {
      ok: false,
      issues: [{ code: "invalid_anchor_id", detail: "anchors must be an object map." }]
    };
  }
  const anchors = {};
  for (const [key, value] of Object.entries(anchorsRaw)) {
    if (!isSagaTreeFaceAnchorId(key)) {
      return {
        ok: false,
        issues: [{ code: "invalid_anchor_id", detail: `Unknown anchor id: ${key}` }]
      };
    }
    if (value === void 0 || value === null) continue;
    if (typeof value !== "object") {
      return {
        ok: false,
        issues: [{ code: "invalid_node_identity", anchorId: key, detail: "Binding must be an object." }]
      };
    }
    const b = value;
    const baryRaw = b.barycentric;
    if (!baryRaw || typeof baryRaw !== "object") {
      return {
        ok: false,
        issues: [{ code: "invalid_barycentric", anchorId: key, detail: "Missing barycentric object." }]
      };
    }
    const baryObj = baryRaw;
    const binding = {
      nodeIdentity: typeof b.nodeIdentity === "string" ? b.nodeIdentity : "",
      primitiveIndex: typeof b.primitiveIndex === "number" ? b.primitiveIndex : -1,
      triangleIndex: typeof b.triangleIndex === "number" ? b.triangleIndex : -1,
      barycentric: {
        u: typeof baryObj.u === "number" ? baryObj.u : Number.NaN,
        v: typeof baryObj.v === "number" ? baryObj.v : Number.NaN,
        w: typeof baryObj.w === "number" ? baryObj.w : Number.NaN
      }
    };
    anchors[key] = binding;
  }
  const manifest = {
    contractVersion: FACE_ANCHORS_CONTRACT_VERSION,
    anchors
  };
  const validated = validateFaceAnchorsManifestV1(manifest);
  if (!validated.ok) {
    return { ok: false, issues: validated.issues };
  }
  return { ok: true, manifest };
}
function stableFaceAnchorsManifestJson(manifest) {
  const ordered = {};
  for (const id of SAGA_TREE_FACE_ANCHOR_IDS) {
    const binding = manifest.anchors[id];
    if (binding) ordered[id] = binding;
  }
  return JSON.stringify({
    contractVersion: manifest.contractVersion,
    anchors: ordered
  });
}
function readFaceAnchorsFromAvatar(avatar) {
  if (!avatar || avatar.face_anchors == null) return null;
  const parsed = parseFaceAnchorsManifestV1(avatar.face_anchors);
  return parsed.ok ? parsed.manifest : null;
}
export {
  FACE_ANCHORS_CONTRACT_VERSION,
  SAGA_TREE_FACE_ANCHOR_IDS,
  isSagaTreeFaceAnchorId,
  parseFaceAnchorsManifestV1,
  readFaceAnchorsFromAvatar,
  stableFaceAnchorsManifestJson,
  validateFaceAnchorBarycentric,
  validateFaceAnchorTriangleBinding,
  validateFaceAnchorsManifestV1
};
