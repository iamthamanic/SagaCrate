// src/domains/character/avatar/face-mapping-authoring-contract.ts
var FACE_MAPPING_AUTHORING_CONTRACT_VERSION = "SagaTreeFaceMappingAuthoringV1";
var FACE_MAPPING_AUTHORING_SOURCES = ["auto", "manual", "manual_override"];
var FACE_MAPPING_REVIEW_STATUSES = [
  "unreviewed",
  "agent_reviewed",
  "human_reviewed"
];
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
function isFaceMappingAuthoringSource(value) {
  return FACE_MAPPING_AUTHORING_SOURCES.includes(value);
}
function isFaceMappingReviewStatus(value) {
  return FACE_MAPPING_REVIEW_STATUSES.includes(value);
}
function resolveFaceMappingReviewStatus(authoring) {
  if (!authoring) return "unreviewed";
  if (authoring.reviewStatus && isFaceMappingReviewStatus(authoring.reviewStatus)) {
    return authoring.reviewStatus;
  }
  if (authoring.reviewed === true && (authoring.source === "manual" || authoring.source === "manual_override") && isValidFaceMappingReviewedAtV1(authoring.reviewedAt)) {
    return "human_reviewed";
  }
  return "unreviewed";
}
function isValidAgentReviewProvenance(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const r = value;
  if (r.protocolVersion !== "face-anchor-agent-review-v1") return false;
  if (typeof r.evidenceManifestSha256 !== "string" || !/^[a-f0-9]{64}$/i.test(r.evidenceManifestSha256)) {
    return false;
  }
  if (r.requiredPasses !== 5) return false;
  if (typeof r.completedPasses !== "number" || r.completedPasses !== 5) return false;
  if (r.aggregationPass !== true) return false;
  if (typeof r.ledgerDir !== "string" || !r.ledgerDir.trim()) return false;
  return isValidFaceMappingReviewedAtV1(r.aggregatedAt);
}
function isReviewedFaceMappingGroundTruth(authoring) {
  if (!authoring) return false;
  if (authoring.contractVersion !== FACE_MAPPING_AUTHORING_CONTRACT_VERSION) return false;
  const status = resolveFaceMappingReviewStatus(authoring);
  if (status === "unreviewed") return false;
  if (!authoring.reviewed) return false;
  if (!isValidFaceMappingReviewedAtV1(authoring.reviewedAt)) return false;
  if (status === "human_reviewed") {
    if (authoring.source === "auto") return false;
    if (!(authoring.source === "manual" || authoring.source === "manual_override")) return false;
    return true;
  }
  if (status === "agent_reviewed") {
    if (authoring.source === "manual" || authoring.source === "manual_override") {
      return false;
    }
    if (authoring.source !== "auto") return false;
    return isValidAgentReviewProvenance(authoring.agentReview);
  }
  return false;
}
function canApplyAgentReviewToAuthoring(existing) {
  if (!existing) return { ok: true };
  if (resolveFaceMappingReviewStatus(existing) === "human_reviewed") {
    return { ok: false, reason: "human_reviewed_immutable" };
  }
  return { ok: true };
}
function validateFaceMappingAuthoringV1(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, issues: [{ code: "not_object", detail: "Authoring metadata must be an object." }] };
  }
  const record = raw;
  const issues = [];
  if (record.contractVersion !== FACE_MAPPING_AUTHORING_CONTRACT_VERSION) {
    issues.push({
      code: "contract_version_mismatch",
      detail: `Expected ${FACE_MAPPING_AUTHORING_CONTRACT_VERSION}.`
    });
  }
  const source = typeof record.source === "string" ? record.source : "";
  if (!isFaceMappingAuthoringSource(source)) {
    issues.push({
      code: "invalid_source",
      detail: "source must be auto | manual | manual_override."
    });
  }
  const hasExplicitStatus = typeof record.reviewStatus === "string" && record.reviewStatus.length > 0;
  if (hasExplicitStatus && !isFaceMappingReviewStatus(String(record.reviewStatus))) {
    issues.push({
      code: "invalid_review_status",
      detail: "reviewStatus must be unreviewed | agent_reviewed | human_reviewed."
    });
  }
  const reviewed = record.reviewed === true;
  const statusRaw = hasExplicitStatus ? record.reviewStatus : null;
  if (reviewed && source === "auto" && statusRaw !== "agent_reviewed") {
    issues.push({
      code: "auto_marked_reviewed",
      detail: "Auto mappings cannot be human GT; use reviewStatus=agent_reviewed with provenance."
    });
  }
  if (statusRaw === "agent_reviewed") {
    if (source === "manual" || source === "manual_override") {
      issues.push({
        code: "manual_source_fakes_agent_review",
        detail: "source=manual must not be used to pretend agent review."
      });
    }
    if (!isValidAgentReviewProvenance(record.agentReview)) {
      issues.push({
        code: "agent_review_requires_provenance",
        detail: "agent_reviewed requires complete face-anchor-agent-review-v1 provenance."
      });
    } else if (record.agentReview.completedPasses !== 5 || record.agentReview.aggregationPass !== true) {
      issues.push({
        code: "agent_review_incomplete",
        detail: "agent review must have 5/5 completed passes and aggregationPass=true."
      });
    }
    if (!reviewed) {
      issues.push({
        code: "reviewed_status_mismatch",
        detail: "reviewStatus=agent_reviewed requires reviewed=true."
      });
    }
  }
  if (statusRaw === "human_reviewed") {
    if (!(source === "manual" || source === "manual_override")) {
      issues.push({
        code: "human_reviewed_requires_manual_source",
        detail: "human_reviewed requires source manual | manual_override."
      });
    }
    if (!reviewed) {
      issues.push({
        code: "reviewed_status_mismatch",
        detail: "reviewStatus=human_reviewed requires reviewed=true."
      });
    }
  }
  if (reviewed && (typeof record.reviewedAt !== "string" || !record.reviewedAt.trim())) {
    issues.push({
      code: "reviewed_without_timestamp",
      detail: "reviewed=true requires reviewedAt ISO timestamp."
    });
  } else if (reviewed && !isValidFaceMappingReviewedAtV1(record.reviewedAt)) {
    issues.push({
      code: "invalid_reviewed_at",
      detail: "reviewedAt must be canonical UTC ISO with milliseconds (\u2026Z)."
    });
  }
  const asset = record.asset;
  if (!asset || typeof asset !== "object" || Array.isArray(asset)) {
    issues.push({ code: "missing_model_path", detail: "asset.modelPath is required." });
  } else {
    const modelPath = asset.modelPath;
    if (typeof modelPath !== "string" || !modelPath.trim()) {
      issues.push({ code: "missing_model_path", detail: "asset.modelPath is required." });
    }
  }
  return { ok: issues.length === 0, issues };
}
function createAutoUnreviewedFaceMappingAuthoring(input) {
  return {
    contractVersion: FACE_MAPPING_AUTHORING_CONTRACT_VERSION,
    source: "auto",
    reviewed: false,
    reviewStatus: "unreviewed",
    asset: {
      modelPath: input.modelPath,
      ...input.modelSha256 ? { modelSha256: input.modelSha256 } : {},
      ...input.anchorsSha256 ? { anchorsSha256: input.anchorsSha256 } : {},
      ...input.topologyFingerprint ? { topologyFingerprint: input.topologyFingerprint } : {},
      ...input.cacheBust ? { cacheBust: input.cacheBust } : {}
    },
    ...input.note ? { note: input.note } : {}
  };
}
function createAgentReviewedFaceMappingAuthoring(input) {
  return {
    contractVersion: FACE_MAPPING_AUTHORING_CONTRACT_VERSION,
    source: "auto",
    reviewed: true,
    reviewStatus: "agent_reviewed",
    reviewedAt: input.aggregatedAt,
    asset: {
      modelPath: input.modelPath,
      modelSha256: input.modelSha256,
      anchorsSha256: input.anchorsSha256,
      topologyFingerprint: input.topologyFingerprint,
      ...input.cacheBust ? { cacheBust: input.cacheBust } : {}
    },
    agentReview: {
      protocolVersion: "face-anchor-agent-review-v1",
      evidenceManifestSha256: input.evidenceManifestSha256,
      requiredPasses: 5,
      completedPasses: 5,
      aggregationPass: true,
      aggregatedAt: input.aggregatedAt,
      ledgerDir: input.ledgerDir
    },
    ...input.note ? { note: input.note } : {}
  };
}
export {
  FACE_MAPPING_AUTHORING_CONTRACT_VERSION,
  FACE_MAPPING_AUTHORING_SOURCES,
  FACE_MAPPING_REVIEW_STATUSES,
  canApplyAgentReviewToAuthoring,
  createAgentReviewedFaceMappingAuthoring,
  createAutoUnreviewedFaceMappingAuthoring,
  isFaceMappingAuthoringSource,
  isFaceMappingReviewStatus,
  isReviewedFaceMappingGroundTruth,
  isValidFaceMappingReviewedAtV1,
  resolveFaceMappingReviewStatus,
  validateFaceMappingAuthoringV1
};
