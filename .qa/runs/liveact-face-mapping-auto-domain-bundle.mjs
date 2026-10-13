// src/domains/character/avatar/face-anchor-contract.ts
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

// src/domains/character/avatar/face-mapping-authoring-contract.ts
var FACE_MAPPING_REVIEWED_AT_V1_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z$/;
function isValidFaceMappingReviewedAtV1(value) {
  if (typeof value !== "string" || value.length === 0) return false;
  const m = FACE_MAPPING_REVIEWED_AT_V1_RE.exec(value);
  if (!m) return false;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const hour = Number(m[4]);
  const minute = Number(m[5]);
  const second = Number(m[6]);
  const ms = Number(m[7]);
  const dt = new Date(Date.UTC(year, month - 1, day, hour, minute, second, ms));
  if (dt.getUTCFullYear() !== year || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day || dt.getUTCHours() !== hour || dt.getUTCMinutes() !== minute || dt.getUTCSeconds() !== second || dt.getUTCMilliseconds() !== ms) {
    return false;
  }
  return dt.toISOString() === value;
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
function setFaceMappingDraftBinding(draft, anchorId, binding) {
  return {
    ...draft,
    anchors: { ...draft.anchors, [anchorId]: binding },
    dirty: true
  };
}

// src/domains/character/avatar/face-mapping-auto-v1.ts
var FACE_MAPPING_AUTO_CONTRACT_VERSION = "SagaTreeFaceMappingAutoV1";
var FACE_MAPPING_AUTO_SESSION_STATUSES = [
  "proposed",
  "incomplete",
  "no_face",
  "multi_face",
  "failed"
];
var FACE_MAPPING_AUTO_ANCHOR_OUTCOMES = [
  "mapped",
  "missing_landmark",
  "low_confidence",
  "raycast_miss",
  "surface_mismatch",
  "skipped_protected"
];
function createEmptyAnchorAuthoringMeta(draft, options) {
  const source = options?.defaultSource ?? "manual";
  const wantReviewed = source === "auto" ? false : options?.defaultReviewed ?? false;
  const reviewedAt = options?.reviewedAt;
  const reviewed = wantReviewed && isValidFaceMappingReviewedAtV1(reviewedAt);
  const meta = {};
  for (const id of SAGA_TREE_FACE_ANCHOR_IDS) {
    if (draft.anchors[id]) {
      meta[id] = reviewed ? { source, reviewed: true, reviewedAt } : { source, reviewed: false };
    }
  }
  return meta;
}
function isProtectedFaceMappingAnchor(meta, binding) {
  if (!binding) return false;
  if (!meta) return false;
  if (meta.reviewed === true) return true;
  return meta.source === "manual" || meta.source === "manual_override";
}
function isFaceMappingSaveDisabled(input) {
  return input.autoBusy === true || input.draftValid !== true;
}
function clearFaceMappingAuthoringMetaForAnchor(meta, anchorId) {
  if (!(anchorId in meta)) return meta;
  const next = { ...meta };
  delete next[anchorId];
  return next;
}
function applyAutoMappingToDraft(draft, session, metaIn, options) {
  let draftNext = draft;
  const meta = { ...metaIn };
  let appliedCount = 0;
  let skippedProtectedCount = 0;
  let mappedCount = 0;
  let missCount = 0;
  for (const row of session.anchors) {
    if (row.outcome === "mapped" && row.binding) mappedCount += 1;
    if (row.outcome === "raycast_miss" || row.outcome === "missing_landmark" || row.outcome === "surface_mismatch" || row.outcome === "low_confidence") {
      missCount += 1;
    }
    if (!row.binding || row.outcome !== "mapped") continue;
    const existingBinding = draftNext.anchors[row.anchorId];
    const existingMeta = meta[row.anchorId];
    if (!options.replaceProtected && isProtectedFaceMappingAnchor(existingMeta, existingBinding)) {
      skippedProtectedCount += 1;
      continue;
    }
    draftNext = setFaceMappingDraftBinding(draftNext, row.anchorId, row.binding);
    meta[row.anchorId] = {
      source: "auto",
      reviewed: false,
      ...row.confidence != null ? { confidence: row.confidence } : {}
    };
    appliedCount += 1;
  }
  return {
    draft: draftNext,
    meta,
    appliedCount,
    skippedProtectedCount,
    mappedCount,
    missCount
  };
}
function markFaceMappingAnchorManual(meta, anchorId, hadAuto) {
  return {
    ...meta,
    [anchorId]: {
      source: hadAuto || meta[anchorId]?.source === "auto" ? "manual_override" : "manual",
      reviewed: false
    }
  };
}
function markAllBoundFaceMappingAnchorsAsReviewedManual(meta, draft, nowIso) {
  if (!isValidFaceMappingReviewedAtV1(nowIso)) return meta;
  const next = { ...meta };
  for (const id of SAGA_TREE_FACE_ANCHOR_IDS) {
    if (!draft.anchors[id]) continue;
    const existing = meta[id];
    const source = existing?.source === "auto" ? "manual_override" : existing?.source ?? "manual";
    next[id] = {
      source,
      reviewed: true,
      reviewedAt: nowIso,
      ...existing?.confidence != null ? { confidence: existing.confidence } : {}
    };
  }
  return next;
}
function resetFaceMappingDraftAndMeta(draft) {
  const next = createEmptyFaceMappingDraft(draft.baseline);
  return { draft: next, meta: createEmptyAnchorAuthoringMeta(next) };
}
var FACE_MAPPING_AUTO_EVAL_THRESHOLD_STATUS = "needs-calibration";
function percentile(sorted, p) {
  if (sorted.length === 0) return null;
  if (sorted.length === 1) return sorted[0] ?? null;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[idx] ?? null;
}
function median(sorted) {
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid] ?? null;
  const a = sorted[mid - 1];
  const b = sorted[mid];
  if (a == null || b == null) return null;
  return (a + b) / 2;
}
function isUsableFaceMappingAutoSessionForCompare(session) {
  if (!session) return false;
  if (session.status !== "proposed" && session.status !== "incomplete") return false;
  return session.anchors.some((a) => a.outcome === "mapped" && a.binding != null);
}
function countsAsGroundTruthMeta(meta) {
  if (!meta) return false;
  if (meta.reviewed !== true) return false;
  if (meta.source !== "manual" && meta.source !== "manual_override") return false;
  return isValidFaceMappingReviewedAtV1(meta.reviewedAt);
}
function countsAsGroundTruthAnchor(input) {
  if (!input.binding) return false;
  if (!countsAsGroundTruthMeta(input.meta)) return false;
  const surfaceClass = classifyFaceMappingSurfaceFromNodeIdentity(input.binding.nodeIdentity);
  return isFaceMappingSurfaceSemanticsOk(input.anchorId, surfaceClass);
}
function evaluateAutoVsManualScreenPoints(input) {
  const factor = input.outlierMedianFactor ?? 3;
  const faceWidth = input.faceWidthPx;
  const errors = [];
  const rows = [];
  let successfullyMapped = 0;
  let missing = 0;
  let raycastMisses = 0;
  let lrSwaps = 0;
  let surfaceMismatchCount = 0;
  const autoById = new Map(input.autoSession.anchors.map((a) => [a.anchorId, a]));
  for (const id of SAGA_TREE_FACE_ANCHOR_IDS) {
    const manual = input.manualScreen[id];
    const auto = autoById.get(id);
    const manualPresent = Boolean(manual);
    const autoPresent = Boolean(auto?.binding);
    if (auto?.outcome === "raycast_miss") raycastMisses += 1;
    if (!autoPresent) missing += 1;
    else successfullyMapped += 1;
    let screenErrorPx = null;
    let normalizedFaceError = null;
    if (manual && autoPresent && auto?.screenX != null && auto.screenY != null) {
      screenErrorPx = Math.hypot(auto.screenX - manual.x, auto.screenY - manual.y);
      errors.push(screenErrorPx);
      if (faceWidth && faceWidth > 1e-6) {
        normalizedFaceError = screenErrorPx / faceWidth;
      }
    }
    let lateralityOk = null;
    if (id.endsWith("Left") || id.includes("Left")) {
      const rightId = id.replace("Left", "Right");
      const leftAuto = auto;
      const rightAuto = autoById.get(rightId);
      if (leftAuto?.binding && rightAuto?.binding && leftAuto.screenX != null && rightAuto.screenX != null && Number.isFinite(leftAuto.screenX) && Number.isFinite(rightAuto.screenX)) {
        lateralityOk = leftAuto.screenX > rightAuto.screenX;
        if (!lateralityOk) lrSwaps += 1;
      }
    }
    const expectedSurface = expectedFaceMappingSurfaceClasses(id);
    let actualSurfaceClass = null;
    let surfaceSemanticsOk = null;
    if (auto?.meshNodeIdentity) {
      actualSurfaceClass = classifyFaceMappingSurfaceFromNodeIdentity(auto.meshNodeIdentity);
      surfaceSemanticsOk = isFaceMappingSurfaceSemanticsOk(id, actualSurfaceClass);
      if (!surfaceSemanticsOk) surfaceMismatchCount += 1;
    }
    rows.push({
      anchorId: id,
      manualPresent,
      autoPresent,
      screenErrorPx,
      normalizedFaceError,
      landmarkAvailability: auto?.landmarkAvailability ?? null,
      confidence: auto?.confidence ?? null,
      raycastHit: Boolean(auto?.binding),
      meshNodeIdentity: auto?.meshNodeIdentity ?? null,
      lateralityOk,
      actualSurfaceClass,
      expectedSurfaceClasses: expectedSurface,
      surfaceSemanticsOk,
      outlier: false
    });
  }
  const sorted = [...errors].sort((a, b) => a - b);
  const med = median(sorted);
  const outlierIds = [];
  if (med != null) {
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      if (!row || row.screenErrorPx == null) continue;
      const isOutlier = med > 0 ? row.screenErrorPx > med * factor : row.screenErrorPx > 0;
      if (isOutlier) {
        outlierIds.push(row.anchorId);
        rows[i] = { ...row, outlier: true };
      }
    }
  }
  return {
    contractVersion: "SagaTreeFaceMappingAutoEvalV1",
    rows,
    summary: {
      expectedAnchors: SAGA_TREE_FACE_ANCHOR_IDS.length,
      successfullyMapped,
      missing,
      raycastMisses,
      wrongSurfaceHits: surfaceMismatchCount,
      surfaceMismatchCount,
      lrSwaps,
      medianErrorPx: med,
      p95ErrorPx: percentile(sorted, 0.95),
      maxErrorPx: sorted.length ? sorted[sorted.length - 1] : null,
      thresholdStatus: FACE_MAPPING_AUTO_EVAL_THRESHOLD_STATUS,
      outlierAnchorIds: outlierIds
    }
  };
}
var FACE_MAPPING_GROUND_TRUTH_REFERENCE_VERSION = "SagaTreeFaceMappingGroundTruthReferenceV1";
var FACE_MAPPING_GROUND_TRUTH_REFERENCE_STATUSES = [
  "reviewed_manual_complete",
  "partial_reviewed_manual",
  "unreviewed_auto",
  "missing_reviewed_ground_truth"
];
function freezeFaceMappingGroundTruthReference(input) {
  const anchors = [];
  let boundCount = 0;
  let gtCount = 0;
  let projectedCount = 0;
  let autoUnreviewedBound = 0;
  for (const id of SAGA_TREE_FACE_ANCHOR_IDS) {
    const binding = input.draft.anchors[id];
    if (!binding) continue;
    boundCount += 1;
    const m = input.meta[id];
    const source = m?.source ?? "auto";
    const reviewed = m?.reviewed === true;
    if (countsAsGroundTruthAnchor({ anchorId: id, binding, meta: m })) gtCount += 1;
    if (source === "auto" && !reviewed) autoUnreviewedBound += 1;
    const screenRaw = input.screenCoords[id];
    const hasScreen = screenRaw != null && Number.isFinite(screenRaw.x) && Number.isFinite(screenRaw.y);
    if (hasScreen) projectedCount += 1;
    anchors.push({
      anchorId: id,
      binding: {
        nodeIdentity: binding.nodeIdentity,
        primitiveIndex: binding.primitiveIndex,
        triangleIndex: binding.triangleIndex,
        barycentric: { ...binding.barycentric }
      },
      screen: hasScreen ? {
        x: screenRaw.x,
        y: screenRaw.y,
        ...screenRaw.meshLabel != null ? { meshLabel: screenRaw.meshLabel } : {}
      } : null,
      source,
      reviewed
    });
  }
  const expected = SAGA_TREE_FACE_ANCHOR_IDS.length;
  let status;
  let validForGroundTruthComparison = false;
  if (boundCount === 0) {
    status = "missing_reviewed_ground_truth";
  } else if (gtCount === expected) {
    status = "reviewed_manual_complete";
    validForGroundTruthComparison = projectedCount === expected;
  } else if (gtCount > 0) {
    status = "partial_reviewed_manual";
  } else if (autoUnreviewedBound > 0) {
    status = "unreviewed_auto";
  } else {
    status = "missing_reviewed_ground_truth";
  }
  return {
    contractVersion: FACE_MAPPING_GROUND_TRUTH_REFERENCE_VERSION,
    status,
    validForGroundTruthComparison,
    frozenAt: input.nowIso ?? (/* @__PURE__ */ new Date()).toISOString(),
    assetFingerprint: input.assetFingerprint ?? null,
    topologyFingerprint: input.topologyFingerprint ?? null,
    anchors
  };
}
var FACE_MAPPING_COMPARE_EXPORT_KIND = "SagaTreeFaceMappingCompareV1";
function round1(n) {
  return Math.round(n * 10) / 10;
}
function screenFromCoords(coords, id, fallbackX, fallbackY, meshLabel) {
  const c = coords?.[id];
  if (c) {
    return {
      x: round1(c.x),
      y: round1(c.y),
      ...c.meshLabel != null ? { meshLabel: c.meshLabel } : {}
    };
  }
  if (fallbackX != null && fallbackY != null && Number.isFinite(fallbackX) && Number.isFinite(fallbackY)) {
    return {
      x: round1(fallbackX),
      y: round1(fallbackY),
      ...meshLabel != null ? { meshLabel } : {}
    };
  }
  return null;
}
function buildFaceMappingCompareExport(input) {
  const valid = input.reference?.validForGroundTruthComparison === true && isUsableFaceMappingAutoSessionForCompare(input.autoSession);
  const referenceStatus = input.reference?.status ?? null;
  const factor = input.outlierMedianFactor ?? 3;
  const faceWidth = input.faceWidthPx;
  const refById = new Map(
    (input.reference?.anchors ?? []).map((a) => [a.anchorId, a])
  );
  const autoById = new Map(
    (input.autoSession?.anchors ?? []).map((a) => [a.anchorId, a])
  );
  const referenceAnchors = [];
  for (const id of SAGA_TREE_FACE_ANCHOR_IDS) {
    const ref = refById.get(id);
    if (!ref) continue;
    referenceAnchors.push({
      anchorId: id,
      binding: ref.binding,
      screen: ref.screen ? {
        x: round1(ref.screen.x),
        y: round1(ref.screen.y),
        ...ref.screen.meshLabel != null ? { meshLabel: ref.screen.meshLabel } : {}
      } : null,
      source: ref.source,
      reviewed: ref.reviewed
    });
  }
  const proposalAnchors = [];
  let mapped = 0;
  let missing = 0;
  let surfaceMismatchCount = 0;
  for (const id of SAGA_TREE_FACE_ANCHOR_IDS) {
    const auto = autoById.get(id);
    const expected = expectedFaceMappingSurfaceClasses(id);
    const meshNodeIdentity = auto?.meshNodeIdentity ?? auto?.binding?.nodeIdentity ?? null;
    let actualSurfaceClass = null;
    let surfaceSemanticsOk = null;
    if (meshNodeIdentity) {
      actualSurfaceClass = classifyFaceMappingSurfaceFromNodeIdentity(meshNodeIdentity);
      surfaceSemanticsOk = isFaceMappingSurfaceSemanticsOk(id, actualSurfaceClass);
      if (surfaceSemanticsOk === false) surfaceMismatchCount += 1;
    }
    const hasBinding = Boolean(auto?.binding);
    if (hasBinding) mapped += 1;
    else missing += 1;
    proposalAnchors.push({
      anchorId: id,
      binding: auto?.binding ? {
        nodeIdentity: auto.binding.nodeIdentity,
        primitiveIndex: auto.binding.primitiveIndex,
        triangleIndex: auto.binding.triangleIndex,
        barycentric: { ...auto.binding.barycentric }
      } : null,
      // Unmapped outcomes keep landmark screenX/Y for diagnostics only — never as compare screens.
      screen: hasBinding ? screenFromCoords(
        input.proposalScreens,
        id,
        auto?.screenX ?? null,
        auto?.screenY ?? null,
        meshNodeIdentity
      ) : null,
      source: "auto",
      confidence: auto?.confidence ?? null,
      outcome: auto?.outcome ?? null,
      meshNodeIdentity,
      actualSurfaceClass,
      expectedSurfaceClasses: expected,
      surfaceSemanticsOk
    });
  }
  let comparison = null;
  let medianErrorPx = null;
  let p95ErrorPx = null;
  let maxErrorPx = null;
  let lrSwaps = 0;
  if (valid && input.reference) {
    const errors = [];
    const deltas = [];
    const proposalScreenById = new Map(
      proposalAnchors.map((p) => [p.anchorId, p])
    );
    for (const id of SAGA_TREE_FACE_ANCHOR_IDS) {
      const ref = refById.get(id);
      const prop = proposalScreenById.get(id);
      let screenErrorPx = null;
      let normalizedFaceError = null;
      if (ref?.screen && prop?.binding && prop.screen) {
        screenErrorPx = Math.hypot(prop.screen.x - ref.screen.x, prop.screen.y - ref.screen.y);
        errors.push(screenErrorPx);
        if (faceWidth && faceWidth > 1e-6) {
          normalizedFaceError = screenErrorPx / faceWidth;
        }
      }
      let lateralityOk = null;
      if (id.endsWith("Left") || id.includes("Left")) {
        const rightId = id.replace("Left", "Right");
        const leftProp = prop;
        const rightProp = proposalScreenById.get(rightId);
        if (leftProp?.binding && rightProp?.binding && leftProp.screen && rightProp.screen) {
          lateralityOk = leftProp.screen.x > rightProp.screen.x;
          if (!lateralityOk) lrSwaps += 1;
        }
      }
      deltas.push({
        anchorId: id,
        screenErrorPx: screenErrorPx != null ? round1(screenErrorPx) : null,
        normalizedFaceError,
        lateralityOk,
        surfaceSemanticsOk: prop?.surfaceSemanticsOk ?? null,
        outlier: false
      });
    }
    const sorted = [...errors].sort((a, b) => a - b);
    medianErrorPx = median(sorted);
    p95ErrorPx = percentile(sorted, 0.95);
    maxErrorPx = sorted.length ? sorted[sorted.length - 1] : null;
    if (medianErrorPx != null) {
      for (let i = 0; i < deltas.length; i += 1) {
        const d = deltas[i];
        if (!d || d.screenErrorPx == null) continue;
        const isOutlier = medianErrorPx > 0 ? d.screenErrorPx > medianErrorPx * factor : d.screenErrorPx > 0;
        if (isOutlier) {
          deltas[i] = { ...d, outlier: true };
        }
      }
    }
    comparison = { anchors: deltas };
  }
  let draftAfterProvenance;
  if (input.draftAfter) {
    let setCount = 0;
    const metaSources = {};
    for (const id of SAGA_TREE_FACE_ANCHOR_IDS) {
      if (input.draftAfter.anchors[id]) setCount += 1;
      const src = input.metaAfter?.[id]?.source;
      if (src) metaSources[id] = src;
    }
    draftAfterProvenance = { setCount, metaSources };
  }
  return {
    kind: FACE_MAPPING_COMPARE_EXPORT_KIND,
    exportedAt: input.nowIso ?? (/* @__PURE__ */ new Date()).toISOString(),
    validForGroundTruthComparison: valid,
    referenceStatus,
    assetFingerprint: input.assetFingerprint ?? input.reference?.assetFingerprint ?? null,
    reference: input.reference ? { anchors: referenceAnchors } : null,
    proposal: input.autoSession ? { anchors: proposalAnchors } : null,
    comparison,
    summary: {
      expectedAnchors: SAGA_TREE_FACE_ANCHOR_IDS.length,
      mapped,
      missing,
      medianErrorPx: valid ? medianErrorPx != null ? round1(medianErrorPx) : null : null,
      p95ErrorPx: valid ? p95ErrorPx != null ? round1(p95ErrorPx) : null : null,
      maxErrorPx: valid ? maxErrorPx != null ? round1(maxErrorPx) : null : null,
      lrSwaps: valid ? lrSwaps : 0,
      surfaceMismatchCount,
      thresholdStatus: FACE_MAPPING_AUTO_EVAL_THRESHOLD_STATUS
    },
    ...draftAfterProvenance ? { draftAfterProvenance } : {}
  };
}
function stringifyFaceMappingCompareExport(input) {
  return `${JSON.stringify(buildFaceMappingCompareExport(input), null, 2)}
`;
}
function stringifyFaceMappingGroundTruthReference(reference) {
  return `${JSON.stringify(reference, null, 2)}
`;
}
var FACE_MAPPING_AUTO_SESSION_EXPORT_KIND = "SagaTreeFaceMappingAutoSessionExportV1";
function stringifyFaceMappingAutoSessionExport(session, options) {
  return `${JSON.stringify(
    {
      kind: FACE_MAPPING_AUTO_SESSION_EXPORT_KIND,
      exportedAt: options?.nowIso ?? (/* @__PURE__ */ new Date()).toISOString(),
      session
    },
    null,
    2
  )}
`;
}
export {
  FACE_MAPPING_AUTO_ANCHOR_OUTCOMES,
  FACE_MAPPING_AUTO_CONTRACT_VERSION,
  FACE_MAPPING_AUTO_EVAL_THRESHOLD_STATUS,
  FACE_MAPPING_AUTO_SESSION_EXPORT_KIND,
  FACE_MAPPING_AUTO_SESSION_STATUSES,
  FACE_MAPPING_COMPARE_EXPORT_KIND,
  FACE_MAPPING_GROUND_TRUTH_REFERENCE_STATUSES,
  FACE_MAPPING_GROUND_TRUTH_REFERENCE_VERSION,
  applyAutoMappingToDraft,
  buildFaceMappingCompareExport,
  clearFaceMappingAuthoringMetaForAnchor,
  countsAsGroundTruthAnchor,
  countsAsGroundTruthMeta,
  createEmptyAnchorAuthoringMeta,
  evaluateAutoVsManualScreenPoints,
  freezeFaceMappingGroundTruthReference,
  isFaceMappingSaveDisabled,
  isProtectedFaceMappingAnchor,
  isUsableFaceMappingAutoSessionForCompare,
  isValidFaceMappingReviewedAtV1,
  markAllBoundFaceMappingAnchorsAsReviewedManual,
  markFaceMappingAnchorManual,
  resetFaceMappingDraftAndMeta,
  stringifyFaceMappingAutoSessionExport,
  stringifyFaceMappingCompareExport,
  stringifyFaceMappingGroundTruthReference
};
