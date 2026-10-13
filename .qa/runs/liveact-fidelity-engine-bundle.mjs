// src/domains/character/liveact/liveact-face-contract.ts
var LIVEACT_FACE_CONTRACT_VERSION = "SagaTreeLiveActFaceV1";
var LIVEACT_FACE_CHANNELS = [
  "_neutral",
  "browDownLeft",
  "browDownRight",
  "browInnerUp",
  "browOuterUpLeft",
  "browOuterUpRight",
  "cheekPuff",
  "cheekSquintLeft",
  "cheekSquintRight",
  "eyeBlinkLeft",
  "eyeBlinkRight",
  "eyeLookDownLeft",
  "eyeLookDownRight",
  "eyeLookInLeft",
  "eyeLookInRight",
  "eyeLookOutLeft",
  "eyeLookOutRight",
  "eyeLookUpLeft",
  "eyeLookUpRight",
  "eyeSquintLeft",
  "eyeSquintRight",
  "eyeWideLeft",
  "eyeWideRight",
  "jawForward",
  "jawLeft",
  "jawOpen",
  "jawRight",
  "mouthClose",
  "mouthDimpleLeft",
  "mouthDimpleRight",
  "mouthFrownLeft",
  "mouthFrownRight",
  "mouthFunnel",
  "mouthLeft",
  "mouthLowerDownLeft",
  "mouthLowerDownRight",
  "mouthPressLeft",
  "mouthPressRight",
  "mouthPucker",
  "mouthRight",
  "mouthRollLower",
  "mouthRollUpper",
  "mouthShrugLower",
  "mouthShrugUpper",
  "mouthSmileLeft",
  "mouthSmileRight",
  "mouthStretchLeft",
  "mouthStretchRight",
  "mouthUpperUpLeft",
  "mouthUpperUpRight",
  "noseSneerLeft",
  "noseSneerRight"
];
function clampLiveActChannel(value) {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}
function createNeutralLiveActFaceChannels() {
  const out = {};
  for (const id of LIVEACT_FACE_CHANNELS) {
    out[id] = id === "_neutral" ? 1 : 0;
  }
  return out;
}
function mergeLiveActFaceChannels(partial) {
  const base = createNeutralLiveActFaceChannels();
  if (!partial) return base;
  for (const id of LIVEACT_FACE_CHANNELS) {
    const raw = partial[id];
    if (typeof raw === "number") {
      base[id] = clampLiveActChannel(raw);
    }
  }
  return base;
}
function assertLiveActFaceChannelsLocalOnly(channels) {
  const record = channels;
  if (record.landmarks !== void 0 || record.video !== void 0 || record.imageData !== void 0) {
    throw new Error("LiveAct-Face-Channels d\xFCrfen keine Rohvideo-/Landmark-Daten tragen.");
  }
}

// src/domains/character/liveact/liveact-contract.ts
var LIVEACT_CONTRACT_VERSION = "SagaTreeLiveActFrameV1";
var DEFAULT_LIVEACT_LIMITS = {
  maxYaw: 0.55,
  maxPitch: 0.4,
  maxRoll: 0.35,
  presenceThreshold: 0.45,
  desktopFps: 30,
  mobileFps: 15,
  smooth: 0.35
};
var LIVEACT_QUALITY_PROFILES = {
  desktop: {
    id: "desktop",
    labelDe: "Desktop",
    fpsCap: DEFAULT_LIVEACT_LIMITS.desktopFps,
    enableHeadPose: true,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: true
  },
  mobile: {
    id: "mobile",
    labelDe: "Mobile",
    fpsCap: DEFAULT_LIVEACT_LIMITS.mobileFps,
    enableHeadPose: false,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: false
  }
};
function resolveLiveActQualityProfile(input) {
  const limits = input.limits ?? DEFAULT_LIVEACT_LIMITS;
  const useMobile = input.isMobile === true || typeof input.maxTouchPoints === "number" && input.maxTouchPoints > 1;
  if (useMobile) {
    return {
      ...LIVEACT_QUALITY_PROFILES.mobile,
      fpsCap: limits.mobileFps
    };
  }
  return {
    ...LIVEACT_QUALITY_PROFILES.desktop,
    fpsCap: limits.desktopFps
  };
}
function clampLiveActAngle(value, maxAbs) {
  if (!Number.isFinite(value)) return 0;
  if (value > maxAbs) return maxAbs;
  if (value < -maxAbs) return -maxAbs;
  return value;
}
function clampLiveActGaze(value) {
  if (!Number.isFinite(value)) return 0;
  if (value > 1) return 1;
  if (value < -1) return -1;
  return value;
}
function selectPrimaryLiveActFaceIndex(faces) {
  if (faces.length === 0) return -1;
  let best = 0;
  let bestScore = faces[0]?.presence ?? 0;
  for (let i = 1; i < faces.length; i += 1) {
    const score = faces[i]?.presence ?? 0;
    if (score > bestScore) {
      best = i;
      bestScore = score;
    }
  }
  return best;
}
function createEmptyLiveActSourceSample() {
  return {
    presence: 0,
    headYaw: 0,
    headPitch: 0,
    headRoll: 0,
    eyeLeftX: 0,
    eyeLeftY: 0,
    eyeRightX: 0,
    eyeRightY: 0,
    face: {},
    faceIndex: -1,
    faceCount: 0
  };
}
function createNeutralLiveActFrame(input) {
  return {
    contractVersion: LIVEACT_CONTRACT_VERSION,
    faceContractVersion: LIVEACT_FACE_CONTRACT_VERSION,
    timestampMs: input.timestampMs,
    sequence: input.sequence,
    confidence: 0,
    trackingLost: input.trackingLost ?? true,
    head: { yaw: 0, pitch: 0, roll: 0 },
    eyeLeft: { x: 0, y: 0 },
    eyeRight: { x: 0, y: 0 },
    face: createNeutralLiveActFaceChannels()
  };
}
function mapLiveActSourceSample(sample, input) {
  const limits = input.limits ?? DEFAULT_LIVEACT_LIMITS;
  const lost = sample.presence < limits.presenceThreshold || sample.faceIndex < 0;
  if (lost) {
    return createNeutralLiveActFrame({
      timestampMs: input.timestampMs,
      sequence: input.sequence,
      trackingLost: true
    });
  }
  const face = mergeLiveActFaceChannels(sample.face);
  assertLiveActFaceChannelsLocalOnly(face);
  return {
    contractVersion: LIVEACT_CONTRACT_VERSION,
    faceContractVersion: LIVEACT_FACE_CONTRACT_VERSION,
    timestampMs: input.timestampMs,
    sequence: input.sequence,
    confidence: clampLiveActChannel(sample.presence),
    trackingLost: false,
    head: {
      yaw: clampLiveActAngle(sample.headYaw, limits.maxYaw),
      pitch: clampLiveActAngle(sample.headPitch, limits.maxPitch),
      roll: clampLiveActAngle(sample.headRoll, limits.maxRoll)
    },
    eyeLeft: {
      x: clampLiveActGaze(sample.eyeLeftX),
      y: clampLiveActGaze(sample.eyeLeftY)
    },
    eyeRight: {
      x: clampLiveActGaze(sample.eyeRightX),
      y: clampLiveActGaze(sample.eyeRightY)
    },
    face
  };
}
function smoothLiveActFrame(previous, next, alpha = DEFAULT_LIVEACT_LIMITS.smooth) {
  const t = clampLiveActChannel(alpha);
  if (!previous || next.trackingLost) {
    if (!previous) return next;
    const ease = clampLiveActChannel(t * 0.65);
    return {
      ...createNeutralLiveActFrame({
        timestampMs: next.timestampMs,
        sequence: next.sequence,
        trackingLost: true
      }),
      head: {
        yaw: previous.head.yaw * (1 - ease),
        pitch: previous.head.pitch * (1 - ease),
        roll: previous.head.roll * (1 - ease)
      },
      eyeLeft: {
        x: previous.eyeLeft.x * (1 - ease),
        y: previous.eyeLeft.y * (1 - ease)
      },
      eyeRight: {
        x: previous.eyeRight.x * (1 - ease),
        y: previous.eyeRight.y * (1 - ease)
      }
    };
  }
  const lerp = (a, b) => a + (b - a) * t;
  const face = createNeutralLiveActFaceChannels();
  for (const key of Object.keys(face)) {
    face[key] = lerp(previous.face[key] ?? 0, next.face[key] ?? 0);
  }
  return {
    contractVersion: LIVEACT_CONTRACT_VERSION,
    faceContractVersion: LIVEACT_FACE_CONTRACT_VERSION,
    timestampMs: next.timestampMs,
    sequence: next.sequence,
    confidence: lerp(previous.confidence, next.confidence),
    trackingLost: false,
    head: {
      yaw: lerp(previous.head.yaw, next.head.yaw),
      pitch: lerp(previous.head.pitch, next.head.pitch),
      roll: lerp(previous.head.roll, next.head.roll)
    },
    eyeLeft: {
      x: lerp(previous.eyeLeft.x, next.eyeLeft.x),
      y: lerp(previous.eyeLeft.y, next.eyeLeft.y)
    },
    eyeRight: {
      x: lerp(previous.eyeRight.x, next.eyeRight.x),
      y: lerp(previous.eyeRight.y, next.eyeRight.y)
    },
    face
  };
}
function liveActStatusLabelDe(status) {
  switch (status) {
    case "idle":
      return "LiveAct aus";
    case "starting":
      return "Kamera wird vorbereitet \u2026";
    case "active":
      return "LiveAct aktiv";
    case "paused":
      return "LiveAct pausiert (Tab im Hintergrund)";
    case "lost":
      return "Gesicht verloren \u2014 weiche R\xFCckkehr zu Neutral";
    case "denied":
      return "Kamerazugriff verweigert \u2014 bitte Browser-Berechtigung pr\xFCfen";
    case "unsupported":
      return "LiveAct wird in diesem Browser nicht unterst\xFCtzt";
    case "stopped":
      return "LiveAct gestoppt";
    case "error":
      return "LiveAct Fehler \u2014 bitte erneut starten";
    default:
      return "LiveAct";
  }
}
function assertLiveActFrameLocalOnly(frame) {
  const record = frame;
  if (record.landmarks !== void 0 || record.video !== void 0 || record.imageData !== void 0 || record.serialize !== void 0) {
    throw new Error("LiveActFrame darf keine Rohvideo-/Landmark-/Serialize-Daten tragen.");
  }
  assertLiveActFaceChannelsLocalOnly(frame.face);
}

// src/domains/character/liveact/liveact-mediapipe-sample.ts
var LIVEACT_MIRROR_AVATAR = true;
function liveActHeadPoseFromFacialTransform(matrix) {
  if (!matrix || matrix.length < 11) return null;
  const at3 = (row, col) => Number(matrix[col * 4 + row]);
  const r00 = at3(0, 0);
  const r02 = at3(0, 2);
  const r10 = at3(1, 0);
  const r11 = at3(1, 1);
  const r12 = at3(1, 2);
  const r20 = at3(2, 0);
  const r22 = at3(2, 2);
  if (![r00, r02, r10, r11, r12, r20, r22].every(Number.isFinite)) return null;
  const cosPitch = Math.hypot(r10, r11);
  const pitch = Math.atan2(-r12, cosPitch);
  if (cosPitch < 1e-6) {
    return { yaw: Math.atan2(-r20, r00), pitch, roll: 0 };
  }
  return { yaw: Math.atan2(r02, r22), pitch, roll: Math.atan2(r10, r11) };
}
function mirroredChannelTwin(id) {
  const twin = id.endsWith("Left") ? `${id.slice(0, -"Left".length)}Right` : id.endsWith("Right") ? `${id.slice(0, -"Right".length)}Left` : id;
  return LIVEACT_FACE_CHANNELS.find((candidate) => candidate === twin) ?? id;
}
var MIRRORED_CHANNEL = new Map(
  LIVEACT_FACE_CHANNELS.map((id) => [id, mirroredChannelTwin(id)])
);
function mirroredLiveActFaceChannel(id) {
  return MIRRORED_CHANNEL.get(id) ?? id;
}
function mirrorLiveActSourceSample(sample) {
  const face = {};
  for (const id of LIVEACT_FACE_CHANNELS) {
    const value = sample.face[id];
    if (typeof value === "number") face[mirroredLiveActFaceChannel(id)] = value;
  }
  return {
    ...sample,
    headYaw: -sample.headYaw,
    headRoll: -sample.headRoll,
    eyeLeftX: -sample.eyeRightX,
    eyeLeftY: sample.eyeRightY,
    eyeRightX: -sample.eyeLeftX,
    eyeRightY: sample.eyeLeftY,
    face
  };
}
function mapMediaPipeFaceToLiveActSample(input) {
  const byName = new Map((input.categories ?? []).map((c) => [c.categoryName, c.score]));
  const score = (name) => byName.get(name) ?? 0;
  const face = {};
  for (const id of LIVEACT_FACE_CHANNELS) {
    const value = byName.get(id);
    if (typeof value === "number") face[id] = value;
  }
  const head = input.enableHeadPose ? liveActHeadPoseFromFacialTransform(input.matrix) : null;
  return {
    presence: 1,
    headYaw: head?.yaw ?? 0,
    headPitch: head?.pitch ?? 0,
    headRoll: head?.roll ?? 0,
    // In/Out are relative to the nose: toward the user's left = left eye out, right eye in.
    eyeLeftX: score("eyeLookOutLeft") - score("eyeLookInLeft"),
    eyeLeftY: score("eyeLookUpLeft") - score("eyeLookDownLeft"),
    eyeRightX: score("eyeLookInRight") - score("eyeLookOutRight"),
    eyeRightY: score("eyeLookUpRight") - score("eyeLookDownRight"),
    face,
    faceIndex: input.faceIndex,
    faceCount: input.faceCount
  };
}

// src/domains/character/liveact/liveact-capabilities.ts
function createLiveActInputCapabilities(input) {
  return {
    face: input.face === true,
    headPose: input.headPose === true,
    eyeGaze: input.eyeGaze === true
  };
}

// src/domains/character/liveact/liveact-channel-target-aliases.ts
function pascalCase(id) {
  if (!id.length) return id;
  if (id.startsWith("_")) return id;
  return id.charAt(0).toUpperCase() + id.slice(1);
}
function aliasesForChannel(id) {
  const list = [id];
  const pascal = pascalCase(id);
  if (pascal !== id) list.push(pascal);
  if (id === "eyeBlinkLeft") list.push("blinkLeft", "BlinkLeft");
  if (id === "eyeBlinkRight") list.push("blinkRight", "BlinkRight");
  return list;
}
var LIVEACT_CHANNEL_TARGET_ALIASES = Object.fromEntries(
  LIVEACT_FACE_CHANNELS.map((id) => [id, aliasesForChannel(id)])
);

// src/domains/character/liveact/liveact-face-asset-contract.ts
var LIVEACT_FACE_ASSET_FULL_V1_CHANNELS = LIVEACT_FACE_CHANNELS.filter((id) => id !== "_neutral");

// src/domains/character/liveact/liveact-retarget-profile.ts
var LIVEACT_RETARGET_PROFILE_VERSION = "SagaTreeLiveActRetargetProfileV1";
function createIdentityLiveActRetargetProfile() {
  return {
    contractVersion: LIVEACT_RETARGET_PROFILE_VERSION,
    channels: {}
  };
}
function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}
function normalizeLiveActRetargetProfile(input) {
  if (!input || input.contractVersion !== LIVEACT_RETARGET_PROFILE_VERSION) {
    return createIdentityLiveActRetargetProfile();
  }
  const channels = {};
  for (const id of LIVEACT_FACE_CHANNELS) {
    if (id === "_neutral") continue;
    const raw = input.channels?.[id];
    if (!raw) continue;
    if (!isFiniteNumber(raw.gain) || !isFiniteNumber(raw.deadZone)) continue;
    if (raw.gain < 0 || raw.deadZone < 0 || raw.deadZone >= 1) continue;
    channels[id] = { gain: raw.gain, deadZone: raw.deadZone };
  }
  return {
    contractVersion: LIVEACT_RETARGET_PROFILE_VERSION,
    channels
  };
}
function retargetLiveActChannel(channelId, value, profile) {
  const base = clampLiveActChannel(value);
  if (channelId === "_neutral") return base;
  const cfg = profile.channels[channelId];
  if (!cfg) return base;
  if (!isFiniteNumber(cfg.gain) || !isFiniteNumber(cfg.deadZone)) return base;
  if (cfg.deadZone < 0 || cfg.deadZone >= 1 || cfg.gain < 0) return base;
  if (base <= cfg.deadZone) return 0;
  return clampLiveActChannel(base * cfg.gain);
}
function applyLiveActRetargetProfile(frame, profile) {
  const normalized = normalizeLiveActRetargetProfile(profile);
  if (frame.trackingLost) {
    return frame;
  }
  const face = { ...frame.face };
  for (const id of LIVEACT_FACE_CHANNELS) {
    face[id] = retargetLiveActChannel(id, frame.face[id], normalized);
  }
  return { ...frame, face };
}
var DEFAULT_LIVEACT_RETARGET_PROFILE = createIdentityLiveActRetargetProfile();

// src/domains/character/liveact/liveact-gaze-path.ts
var LIVEACT_EYE_LOOK_FACE_CHANNELS = [
  "eyeLookDownLeft",
  "eyeLookDownRight",
  "eyeLookInLeft",
  "eyeLookInRight",
  "eyeLookOutLeft",
  "eyeLookOutRight",
  "eyeLookUpLeft",
  "eyeLookUpRight"
];
var EYE_LOOK_SET = new Set(LIVEACT_EYE_LOOK_FACE_CHANNELS);

// src/domains/character/liveact/liveact-face-diagnostics.ts
var LIVEACT_FACE_DIAGNOSTICS_VERSION = "SagaTreeLiveActFaceDiagnosticsV1";
function createEmptyLiveActFaceDiagnosticsFrame(input) {
  const empty = [];
  return {
    contractVersion: LIVEACT_FACE_DIAGNOSTICS_VERSION,
    timestampMs: input.timestampMs,
    sequence: input.sequence,
    trackingLost: true,
    faceIndex: -1,
    faceCount: 0,
    landmarks: empty,
    contours: {
      faceOval: empty,
      lips: empty,
      leftEye: empty,
      rightEye: empty,
      leftEyebrow: empty,
      rightEyebrow: empty
    }
  };
}
function assertLiveActFaceDiagnosticsLocalOnly(frame) {
  const record = frame;
  if (record.video !== void 0 || record.imageData !== void 0 || record.serialize !== void 0 || record.blob !== void 0) {
    throw new Error("LiveAct-Diagnostics d\xFCrfen keine Rohvideo-/Blob-/Serialize-Daten tragen.");
  }
}

// src/domains/character/liveact/liveact-diagnostics-v2.ts
var LIVEACT_DIAGNOSTICS_V2_VERSION = "SagaTreeLiveActDiagnosticsV2";
var LIVEACT_DIAGNOSTICS_V2_SIGNAL_KEYS = [
  "head.yaw",
  "head.pitch",
  "head.roll",
  "eyeLeft.x",
  "eyeLeft.y",
  "eyeRight.x",
  "eyeRight.y",
  ...LIVEACT_FACE_CHANNELS.map((id) => `face.${id}`)
];
function faceKey(id) {
  return `face.${id}`;
}
function snapshotLiveActDiagnosticsV2FromSample(sample) {
  const out = {
    "head.yaw": sample.headYaw,
    "head.pitch": sample.headPitch,
    "head.roll": sample.headRoll,
    "eyeLeft.x": sample.eyeLeftX,
    "eyeLeft.y": sample.eyeLeftY,
    "eyeRight.x": sample.eyeRightX,
    "eyeRight.y": sample.eyeRightY
  };
  for (const id of LIVEACT_FACE_CHANNELS) {
    const v2 = sample.face[id];
    out[faceKey(id)] = typeof v2 === "number" ? v2 : null;
  }
  return out;
}
function snapshotLiveActDiagnosticsV2FromFrame(frame) {
  const out = {
    "head.yaw": frame.head.yaw,
    "head.pitch": frame.head.pitch,
    "head.roll": frame.head.roll,
    "eyeLeft.x": frame.eyeLeft.x,
    "eyeLeft.y": frame.eyeLeft.y,
    "eyeRight.x": frame.eyeRight.x,
    "eyeRight.y": frame.eyeRight.y
  };
  for (const id of LIVEACT_FACE_CHANNELS) {
    out[faceKey(id)] = frame.face[id];
  }
  return out;
}
function createUnavailableLiveActAppliedValues() {
  const out = {};
  for (const key of LIVEACT_DIAGNOSTICS_V2_SIGNAL_KEYS) {
    out[key] = { status: "unavailable", value: null };
  }
  return out;
}
function createLiveActDiagnosticsV2Snapshot(input) {
  return {
    contractVersion: LIVEACT_DIAGNOSTICS_V2_VERSION,
    timestampMs: input.timestampMs,
    sequence: input.sequence,
    trackingLost: input.trackingLost,
    stages: {
      raw: input.raw,
      mapped: input.mapped,
      smoothed: input.smoothed,
      calibrated: input.calibrated,
      retargeted: input.retargeted,
      applied: input.applied
    }
  };
}
function assertLiveActDiagnosticsV2LocalOnly(snapshot) {
  const record = snapshot;
  if (record.video !== void 0 || record.imageData !== void 0 || record.serialize !== void 0 || record.blob !== void 0 || record.landmarks !== void 0) {
    throw new Error("LiveAct-Diagnostics-V2 d\xFCrfen keine Video-/Blob-/Landmark-Rohdaten tragen.");
  }
}

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

// src/domains/character/liveact/liveact-temporal-contract.ts
var LIVEACT_TEMPORAL_CONTRACT = "SagaTreeLiveActTemporalV1";
var LIVEACT_TEMPORAL_POLICY_VERSION = "liveact-temporal-policy-v1";
var LIVEACT_TEMPORAL_POLICIES = {
  head: { group: "head", tauSlowMs: 90, tauFastMs: 28, speedSlow: 0.4, speedFast: 3.5 },
  gaze: { group: "gaze", tauSlowMs: 18, tauFastMs: 6, speedSlow: 0.8, speedFast: 8 },
  blink: { group: "blink", tauSlowMs: 6, tauFastMs: 3, speedSlow: 2, speedFast: 20 },
  // Lips: keep tauSlow low enough that mid-speech average speed still retains ≥90% at 5 Hz.
  lips: { group: "lips", tauSlowMs: 18, tauFastMs: 7, speedSlow: 0.35, speedFast: 5 },
  brows: { group: "brows", tauSlowMs: 50, tauFastMs: 16, speedSlow: 0.5, speedFast: 6 },
  cheeksNose: {
    group: "cheeksNose",
    tauSlowMs: 42,
    tauFastMs: 14,
    speedSlow: 0.5,
    speedFast: 6
  },
  defaultFace: {
    group: "defaultFace",
    tauSlowMs: 42,
    tauFastMs: 14,
    speedSlow: 0.5,
    speedFast: 6
  }
};
var LIVEACT_TEMPORAL_DEFAULT_DT_MS = 1e3 / 30;
var LIVEACT_TEMPORAL_MIN_DT_MS = 1;
var LIVEACT_TEMPORAL_MAX_DT_MS = 100;
var LIVEACT_TEMPORAL_LONG_GAP_MS = 250;
var BLINK_IDS = /* @__PURE__ */ new Set(["eyeBlinkLeft", "eyeBlinkRight"]);
var BROW_IDS = /* @__PURE__ */ new Set([
  "browDownLeft",
  "browDownRight",
  "browInnerUp",
  "browOuterUpLeft",
  "browOuterUpRight"
]);
var LIP_IDS = /* @__PURE__ */ new Set([
  "jawOpen",
  "jawForward",
  "jawLeft",
  "jawRight",
  "mouthSmileLeft",
  "mouthSmileRight",
  "mouthPucker",
  "mouthFunnel",
  "mouthPressLeft",
  "mouthPressRight",
  "mouthRollUpper",
  "mouthRollLower",
  "mouthUpperUpLeft",
  "mouthUpperUpRight",
  "mouthLowerDownLeft",
  "mouthLowerDownRight",
  "mouthStretchLeft",
  "mouthStretchRight",
  "mouthDimpleLeft",
  "mouthDimpleRight",
  "mouthFrownLeft",
  "mouthFrownRight",
  "mouthClose",
  "mouthLeft",
  "mouthRight",
  "mouthShrugLower",
  "mouthShrugUpper"
]);
var CHEEK_NOSE_IDS = /* @__PURE__ */ new Set([
  "cheekPuff",
  "cheekSquintLeft",
  "cheekSquintRight",
  "noseSneerLeft",
  "noseSneerRight"
]);
function temporalGroupForFaceChannel(id) {
  if (BLINK_IDS.has(id)) return "blink";
  if (BROW_IDS.has(id)) return "brows";
  if (LIP_IDS.has(id)) return "lips";
  if (CHEEK_NOSE_IDS.has(id)) return "cheeksNose";
  return "defaultFace";
}
function temporalFaceKey(id) {
  return `face.${id}`;
}
function temporalGroupForScalarKey(key) {
  if (key.startsWith("head.")) return "head";
  if (key.startsWith("eyeLeft.") || key.startsWith("eyeRight.")) return "gaze";
  if (key === "confidence") return "defaultFace";
  if (key.startsWith("face.")) {
    const id = key.slice("face.".length);
    return temporalGroupForFaceChannel(id);
  }
  return "defaultFace";
}

// src/domains/character/liveact/liveact-temporal-solve.ts
function clamp01(n) {
  if (!Number.isFinite(n)) return 0;
  if (n <= 0) return 0;
  if (n >= 1) return 1;
  return n;
}
function temporalSmoothstep(t) {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}
function temporalAlpha(dtSeconds, tauSeconds) {
  if (!(dtSeconds > 0) || !(tauSeconds > 0)) return 1;
  const a = 1 - Math.exp(-dtSeconds / tauSeconds);
  if (!Number.isFinite(a)) return 1;
  return clamp01(a);
}
function resolveTemporalDtMs(previousTimestampMs, currentTimestampMs) {
  if (previousTimestampMs === null || !Number.isFinite(previousTimestampMs) || !Number.isFinite(currentTimestampMs)) {
    return { dtMs: LIVEACT_TEMPORAL_DEFAULT_DT_MS, rebase: true };
  }
  const raw = currentTimestampMs - previousTimestampMs;
  if (!Number.isFinite(raw) || raw <= 0) {
    return { dtMs: LIVEACT_TEMPORAL_DEFAULT_DT_MS, rebase: false };
  }
  if (raw > LIVEACT_TEMPORAL_LONG_GAP_MS) {
    return { dtMs: LIVEACT_TEMPORAL_DEFAULT_DT_MS, rebase: true };
  }
  const clamped = Math.min(
    LIVEACT_TEMPORAL_MAX_DT_MS,
    Math.max(LIVEACT_TEMPORAL_MIN_DT_MS, raw)
  );
  return { dtMs: clamped, rebase: false };
}
function filterScalar(previousFiltered, previousInput, target, dtSeconds, key, forcePassthrough) {
  if (forcePassthrough || previousFiltered === void 0) return target;
  const group = temporalGroupForScalarKey(key);
  const policy = LIVEACT_TEMPORAL_POLICIES[group];
  const priorIn = previousInput ?? target;
  const speed = Math.abs(target - priorIn) / Math.max(dtSeconds, 1e-6);
  const span = Math.max(1e-6, policy.speedFast - policy.speedSlow);
  const response = temporalSmoothstep((speed - policy.speedSlow) / span);
  const tauMs = policy.tauSlowMs + (policy.tauFastMs - policy.tauSlowMs) * response;
  const alpha = temporalAlpha(dtSeconds, tauMs / 1e3);
  return previousFiltered + alpha * (target - previousFiltered);
}
function collectTargets(frame) {
  const out = {};
  out["head.yaw"] = frame.head.yaw;
  out["head.pitch"] = frame.head.pitch;
  out["head.roll"] = frame.head.roll;
  out["eyeLeft.x"] = frame.eyeLeft.x;
  out["eyeLeft.y"] = frame.eyeLeft.y;
  out["eyeRight.x"] = frame.eyeRight.x;
  out["eyeRight.y"] = frame.eyeRight.y;
  out.confidence = frame.confidence;
  for (const id of LIVEACT_FACE_CHANNELS) {
    out[temporalFaceKey(id)] = frame.face[id] ?? 0;
  }
  return out;
}
function frameFromScalars(next, filtered, trackingLost) {
  const face = createNeutralLiveActFaceChannels();
  for (const id of LIVEACT_FACE_CHANNELS) {
    const v2 = filtered[temporalFaceKey(id)];
    face[id] = typeof v2 === "number" && Number.isFinite(v2) ? v2 : next.face[id] ?? 0;
  }
  return {
    contractVersion: LIVEACT_CONTRACT_VERSION,
    faceContractVersion: LIVEACT_FACE_CONTRACT_VERSION,
    timestampMs: next.timestampMs,
    sequence: next.sequence,
    confidence: filtered.confidence ?? next.confidence,
    trackingLost,
    head: {
      yaw: filtered["head.yaw"] ?? next.head.yaw,
      pitch: filtered["head.pitch"] ?? next.head.pitch,
      roll: filtered["head.roll"] ?? next.head.roll
    },
    eyeLeft: {
      x: filtered["eyeLeft.x"] ?? next.eyeLeft.x,
      y: filtered["eyeLeft.y"] ?? next.eyeLeft.y
    },
    eyeRight: {
      x: filtered["eyeRight.x"] ?? next.eyeRight.x,
      y: filtered["eyeRight.y"] ?? next.eyeRight.y
    },
    face
  };
}
function stepAdaptiveTemporal(previous, mapped) {
  const { dtMs, rebase: gapRebase } = resolveTemporalDtMs(
    previous?.timestampMs ?? null,
    mapped.timestampMs
  );
  const dtSeconds = dtMs / 1e3;
  const wasLost = previous?.mode === "lost";
  const reacquire = wasLost && !mapped.trackingLost;
  const init = previous === null || gapRebase || reacquire || previous.mode === "rebase";
  if (mapped.trackingLost) {
    const neutral = createNeutralLiveActFrame({
      timestampMs: mapped.timestampMs,
      sequence: mapped.sequence,
      trackingLost: true
    });
    const targets2 = collectTargets(neutral);
    const filtered2 = {};
    const priorInput2 = {};
    const force2 = init || !previous;
    for (const key of Object.keys(targets2)) {
      const target = targets2[key];
      if (key.startsWith("face.") || key === "confidence") {
        filtered2[key] = target;
      } else {
        filtered2[key] = filterScalar(
          force2 ? void 0 : previous?.filtered[key],
          force2 ? void 0 : previous?.priorInput[key],
          target,
          dtSeconds,
          key,
          force2
        );
      }
      priorInput2[key] = target;
    }
    const frame2 = frameFromScalars(mapped, filtered2, true);
    return {
      frame: frame2,
      state: {
        contractVersion: LIVEACT_TEMPORAL_CONTRACT,
        policyVersion: LIVEACT_TEMPORAL_POLICY_VERSION,
        timestampMs: mapped.timestampMs,
        mode: "lost",
        filtered: filtered2,
        priorInput: priorInput2
      }
    };
  }
  const targets = collectTargets(mapped);
  const filtered = {};
  const priorInput = {};
  const force = init;
  for (const key of Object.keys(targets)) {
    const target = targets[key];
    filtered[key] = filterScalar(
      force ? void 0 : previous?.filtered[key],
      force ? void 0 : previous?.priorInput[key],
      target,
      dtSeconds,
      key,
      force
    );
    priorInput[key] = target;
  }
  const frame = frameFromScalars(mapped, filtered, false);
  return {
    frame,
    state: {
      contractVersion: LIVEACT_TEMPORAL_CONTRACT,
      policyVersion: LIVEACT_TEMPORAL_POLICY_VERSION,
      timestampMs: mapped.timestampMs,
      // Always 'active' after a successful active step so the next frame continues
      // filtering (rebase/reacquire only force passthrough for THIS frame).
      mode: "active",
      filtered,
      priorInput
    }
  };
}

// src/domains/character/liveact/liveact-dense-face-features-contract.ts
var LIVEACT_DENSE_FACE_FEATURES_CONTRACT = "SagaTreeLiveActDenseFaceFeaturesV1";
var LIVEACT_DENSE_SEMANTIC_GEOMETRY_CONTRACT = "SagaTreeLiveActDenseSemanticGeometryV1";
var DENSE_SEMANTIC_POINT_IDS = [
  "eyeOuterLeft",
  "eyeInnerLeft",
  "eyeUpperLeft",
  "eyeLowerLeft",
  "eyeOuterRight",
  "eyeInnerRight",
  "eyeUpperRight",
  "eyeLowerRight",
  "browInnerLeft",
  "browMidLeft",
  "browOuterLeft",
  "browInnerRight",
  "browMidRight",
  "browOuterRight",
  "mouthCornerLeft",
  "mouthCornerRight",
  "lipUpperOuterLeft",
  "lipUpperInnerLeft",
  "lipUpperCenter",
  "lipUpperInnerRight",
  "lipUpperOuterRight",
  "lipLowerOuterLeft",
  "lipLowerInnerLeft",
  "lipLowerCenter",
  "lipLowerInnerRight",
  "lipLowerOuterRight",
  "noseTip",
  "noseBridge",
  "noseAlarLeft",
  "noseAlarRight",
  "cheekLeft",
  "cheekRight",
  "nasolabialLeft",
  "nasolabialRight",
  "chin",
  "jawLeft",
  "jawRight",
  "forehead"
];
function unavailableDenseScalar(confidence = 0) {
  const c = clamp012(confidence);
  return { available: false, value: null, confidence: c };
}
function availableDenseScalar(value, confidence) {
  if (!Number.isFinite(value)) return unavailableDenseScalar(confidence);
  return { available: true, value, confidence: clamp012(confidence) };
}
function clamp012(n) {
  if (!Number.isFinite(n)) return 0;
  if (n <= 0) return 0;
  if (n >= 1) return 1;
  return n;
}
function assertDenseFaceFeaturesLocalOnly(frame) {
  const record = frame;
  if (record.landmarks !== void 0 || record.video !== void 0 || record.imageData !== void 0 || record.serialize !== void 0 || record.mediapipe !== void 0) {
    throw new Error(
      "DenseFaceFeatures d\xFCrfen keine Rohlandmark-/Video-/Serialize-/Provider-Rohdaten tragen."
    );
  }
}
function createEmptyDenseFaceFeatures(input) {
  const u = unavailableDenseScalar(0);
  const contour = {
    available: false,
    confidence: 0,
    stations: null
  };
  return {
    contractVersion: LIVEACT_DENSE_FACE_FEATURES_CONTRACT,
    sequence: input.sequence,
    timestampMs: input.timestampMs,
    presence: false,
    normalizationStatus: input.normalizationStatus ?? "unavailable",
    faceConfidence: clamp012(input.faceConfidence ?? 0),
    lips: {
      width: u,
      gapLeft: u,
      gapCenter: u,
      gapRight: u,
      upperContour: contour,
      lowerContour: contour,
      curvature: u,
      compression: u,
      protrusion: u,
      cornerLeft: u,
      cornerRight: u,
      asymmetry: u
    },
    eyes: {
      eyeOpeningLeft: u,
      eyeOpeningRight: u,
      upperLidLeft: u,
      upperLidRight: u,
      lowerLidLeft: u,
      lowerLidRight: u
    },
    brows: {
      innerLeft: u,
      midLeft: u,
      outerLeft: u,
      innerRight: u,
      midRight: u,
      outerRight: u
    },
    cheeks: {
      raiseLeft: u,
      raiseRight: u,
      compressionLeft: u,
      compressionRight: u,
      volumeProxyLeft: u,
      volumeProxyRight: u
    },
    nose: {
      alarLeft: u,
      alarRight: u,
      nasolabialLeft: u,
      nasolabialRight: u,
      width: u
    },
    jaw: {
      chinDrop: u,
      chinForward: u,
      jawWidth: u
    }
  };
}

// src/domains/character/liveact/liveact-hybrid-face-contract.ts
var LIVEACT_HYBRID_FACE_CONTRACT = "SagaTreeLiveActHybridFaceV1";
var LIVEACT_HYBRID_FACE_CONTROL_IDS = [
  "mouthSmileLeft",
  "mouthSmileRight",
  "mouthPucker",
  "mouthFunnel",
  "mouthPressLeft",
  "mouthPressRight",
  "mouthRollUpper",
  "mouthRollLower",
  "mouthUpperUpLeft",
  "mouthUpperUpRight",
  "mouthLowerDownLeft",
  "mouthLowerDownRight",
  "cheekSquintLeft",
  "cheekSquintRight",
  "cheekPuff",
  "noseSneerLeft",
  "noseSneerRight",
  "jawOpen",
  "jawForward"
];
var LIVEACT_HYBRID_DENSE_MIN_CONFIDENCE = 0.45;
var LIVEACT_HYBRID_DISAGREE_ABS = 0.35;
function unavailableHybridControl(semanticInput = null) {
  return {
    value: null,
    confidence: 0,
    source: "unavailable",
    semanticInput,
    denseEvidence: null
  };
}
function semanticPassthroughControl(semantic, confidence = 1) {
  if (semantic === null || !Number.isFinite(semantic)) {
    return unavailableHybridControl(null);
  }
  const v2 = clamp013(semantic);
  return {
    value: v2,
    confidence: clamp013(confidence),
    source: "semantic",
    semanticInput: v2,
    denseEvidence: null
  };
}
function createEmptyHybridFace(input) {
  const controls = {};
  for (const id of LIVEACT_HYBRID_FACE_CONTROL_IDS) {
    controls[id] = unavailableHybridControl(null);
  }
  return {
    contractVersion: LIVEACT_HYBRID_FACE_CONTRACT,
    sequence: input.sequence,
    timestampMs: input.timestampMs,
    presence: false,
    denseSequenceAligned: false,
    controls
  };
}
function assertHybridFaceLocalOnly(frame) {
  const record = frame;
  if (record.landmarks !== void 0 || record.geometry !== void 0 || record.video !== void 0 || record.serialize !== void 0) {
    throw new Error(
      "HybridFace darf keine Rohlandmark-/Geometry-/Video-/Serialize-Daten tragen."
    );
  }
  for (const id of LIVEACT_FACE_CHANNELS) {
    void id;
  }
}
function clamp013(n) {
  if (!Number.isFinite(n)) return 0;
  if (n <= 0) return 0;
  if (n >= 1) return 1;
  return n;
}

// src/domains/character/liveact/liveact-iris-gaze-contract.ts
var LIVEACT_IRIS_GAZE_CONTRACT = "SagaTreeLiveActIrisGazeV1";
var LIVEACT_IRIS_EYE_GEOMETRY_CONTRACT = "SagaTreeLiveActIrisEyeGeometryV1";
var LIVEACT_IRIS_GAZE_MAX_YAW_DEG = 35;
var LIVEACT_IRIS_GAZE_MAX_PITCH_DEG = 30;
var LIVEACT_IRIS_GAZE_MIN_CONFIDENCE = 0.55;
var LIVEACT_IRIS_GAZE_NEUTRAL_ZERO = {
  leftX: 0,
  leftY: 0,
  rightX: 0,
  rightY: 0
};
function unavailableIrisEyeGaze(confidence = 0) {
  const c = typeof confidence === "number" && Number.isFinite(confidence) ? Math.min(1, Math.max(0, confidence)) : 0;
  return {
    available: false,
    yawDeg: null,
    pitchDeg: null,
    x: null,
    y: null,
    confidence: c
  };
}
function createEmptyIrisGaze(input) {
  return {
    contractVersion: LIVEACT_IRIS_GAZE_CONTRACT,
    sequence: input.sequence,
    timestampMs: input.timestampMs,
    left: unavailableIrisEyeGaze(0),
    right: unavailableIrisEyeGaze(0),
    fallbackState: "unavailable",
    binocularYawDisagreementDeg: null,
    binocularPitchDisagreementDeg: null,
    faceNormalizationOk: false
  };
}
function assertIrisGazeLocalOnly(gaze) {
  const record = gaze;
  if (record.landmarks !== void 0 || record.irisContour !== void 0 || record.video !== void 0 || record.serialize !== void 0) {
    throw new Error(
      "IrisGaze darf keine Rohlandmark-/IrisContour-/Video-/Serialize-Daten tragen."
    );
  }
}
function yawPitchToNormalizedGaze(yawDeg, pitchDeg) {
  const x = clampGaze(yawDeg / LIVEACT_IRIS_GAZE_MAX_YAW_DEG);
  const y = clampGaze(pitchDeg / LIVEACT_IRIS_GAZE_MAX_PITCH_DEG);
  return { x, y };
}
function clampGaze(n) {
  if (!Number.isFinite(n)) return 0;
  if (n <= -1) return -1;
  if (n >= 1) return 1;
  return n;
}

// src/domains/character/liveact/liveact-personal-calibration-contract.ts
var LIVEACT_PERSONAL_CALIBRATION_CONTRACT = "SagaTreeLiveActCalibrationProfileV2";
var LIVEACT_PERSONAL_CALIBRATION_POLICY_VERSION = "liveact-personal-calibration-policy-v1";
function createLiveActSolverFingerprintV1() {
  return {
    denseFaceFeatures: LIVEACT_DENSE_FACE_FEATURES_CONTRACT,
    irisGaze: LIVEACT_IRIS_GAZE_CONTRACT,
    hybridFace: LIVEACT_HYBRID_FACE_CONTRACT,
    temporalContract: LIVEACT_TEMPORAL_CONTRACT,
    temporalPolicy: LIVEACT_TEMPORAL_POLICY_VERSION,
    calibrationProfile: LIVEACT_PERSONAL_CALIBRATION_CONTRACT,
    calibrationPolicy: LIVEACT_PERSONAL_CALIBRATION_POLICY_VERSION
  };
}
function liveActSolverFingerprintsEqual(a, b) {
  return a.denseFaceFeatures === b.denseFaceFeatures && a.irisGaze === b.irisGaze && a.hybridFace === b.hybridFace && a.temporalContract === b.temporalContract && a.temporalPolicy === b.temporalPolicy && a.calibrationProfile === b.calibrationProfile && a.calibrationPolicy === b.calibrationPolicy;
}
var LIVEACT_PERSONAL_CALIBRATION_PHASES = [
  {
    id: "neutral",
    labelDe: "Neutral entspannen",
    holdDe: "Gesicht ruhig halten",
    durationMs: 4500,
    kind: "neutral",
    channels: [],
    skipAllowed: false
  },
  {
    id: "headGaze",
    labelDe: "Kopf und Blick",
    holdDe: "Kopf L/R/U/D, Blick L/R/U/D",
    durationMs: 6500,
    kind: "motion",
    channels: [],
    skipAllowed: true
  },
  {
    id: "eyesBrows",
    labelDe: "Augen und Brauen",
    holdDe: "Blinzeln, zwinkern L/R (oder \xFCberspringen), Brauen",
    durationMs: 5500,
    kind: "motion",
    channels: [
      "eyeBlinkLeft",
      "eyeBlinkRight",
      "browInnerUp",
      "browOuterUpLeft",
      "browOuterUpRight"
    ],
    skipAllowed: true
  },
  {
    id: "jawSmile",
    labelDe: "Kiefer und L\xE4cheln",
    holdDe: "Mund \xF6ffnen, L\xE4cheln links/rechts getrennt",
    durationMs: 5500,
    kind: "motion",
    channels: ["jawOpen", "mouthSmileLeft", "mouthSmileRight"],
    skipAllowed: true
  },
  {
    id: "lips",
    labelDe: "Lippen",
    holdDe: "Pucker, Funnel, Press, Roll, Ober-/Unterlippe",
    durationMs: 7e3,
    kind: "motion",
    channels: [
      "mouthPucker",
      "mouthFunnel",
      "mouthPressLeft",
      "mouthPressRight",
      "mouthRollUpper",
      "mouthRollLower",
      "mouthUpperUpLeft",
      "mouthUpperUpRight",
      "mouthLowerDownLeft",
      "mouthLowerDownRight",
      "cheekPuff",
      "noseSneerLeft",
      "noseSneerRight"
    ],
    skipAllowed: true
  },
  {
    id: "speech",
    labelDe: "Kurze Phrase",
    holdDe: "Sag langsam: \u201ESaga Drive testet Lippen\u201C",
    durationMs: 5500,
    kind: "speech",
    channels: ["jawOpen", "mouthPucker", "mouthSmileLeft", "mouthSmileRight"],
    skipAllowed: true
  }
];
var LIVEACT_PERSONAL_CALIBRATION_DURATION_MS = LIVEACT_PERSONAL_CALIBRATION_PHASES.reduce(
  (sum, phase) => sum + phase.durationMs,
  0
);
var LIVEACT_PERSONAL_MIN_USABLE_SPAN = 0.12;
var LIVEACT_PERSONAL_WEAK_SPAN = 0.06;
var LIVEACT_PERSONAL_MAX_GAIN = 4;
var LIVEACT_PERSONAL_NOISE_DEADZONE_MULT = 1.5;
var LIVEACT_PERSONAL_MAX_SAMPLE_GAP_MS = 100;
var LIVEACT_PERSONAL_MIN_PHASE_FRAMES = 12;
var LIVEACT_PERSONAL_STORAGE_KEY_PREFIX = "sagatree.liveact.calibrationProfile.v2:";
function isLiveActPersonalPersistableCharacterId(characterLocalId) {
  const id = characterLocalId.trim();
  return id.length > 0 && id !== "draft" && id !== "_default";
}
function isLiveActPersonalCalibrationScopeComplete(scope) {
  if (!scope) return false;
  const owner = scope.ownerLocalId.trim();
  const character = scope.characterLocalId.trim();
  return owner.length > 0 && isLiveActPersonalPersistableCharacterId(character);
}
function liveActPersonalCalibrationStorageKey(scope) {
  return LIVEACT_PERSONAL_STORAGE_KEY_PREFIX + `${encodeURIComponent(scope.ownerLocalId.trim())}:${encodeURIComponent(scope.characterLocalId.trim())}`;
}

// src/domains/character/liveact/liveact-personal-calibration-solve.ts
function resetPhaseCaptureClock(session) {
  session.phaseStartedAtMs = 0;
  session.validFrameCount = 0;
  session.validCaptureMs = 0;
  session.lastValidSampleTimestamp = 0;
}
function createLiveActPersonalCalibrationSessionV2(scope = null) {
  const ownerLocalId = scope?.ownerLocalId?.trim() ?? "";
  const characterLocalId = scope?.characterLocalId?.trim() ?? "";
  return {
    phaseIndex: 0,
    phaseStartedAtMs: 0,
    validFrameCount: 0,
    validCaptureMs: 0,
    lastValidSampleTimestamp: 0,
    skippedPhaseIds: [],
    phaseValues: {},
    headYaw: [],
    headPitch: [],
    headRoll: [],
    eyeLeftX: [],
    eyeLeftY: [],
    eyeRightX: [],
    eyeRightY: [],
    speechJaw: [],
    speechPrevJaw: null,
    speechVelocityAbsSum: 0,
    speechVelocityCount: 0,
    headPoseSupported: true,
    ownerLocalId,
    characterLocalId
  };
}
function pushNum(bucket, value) {
  if (Number.isFinite(value)) bucket.push(value);
}
function ensurePhaseChannel(session, phaseId, channel) {
  const phase = session.phaseValues[phaseId] ?? (session.phaseValues[phaseId] = {});
  return phase[channel] ?? (phase[channel] = []);
}
function pushLiveActPersonalCalibrationSample(session, sample, options = { headPoseSupported: true }) {
  const limits = options.limits ?? DEFAULT_LIVEACT_LIMITS;
  if (!isValidLiveActCalibrationSample(sample, limits)) return false;
  const phase = LIVEACT_PERSONAL_CALIBRATION_PHASES[session.phaseIndex];
  if (!phase) return false;
  session.headPoseSupported = session.headPoseSupported && options.headPoseSupported;
  const nowMs = typeof options.nowMs === "number" && Number.isFinite(options.nowMs) ? options.nowMs : 0;
  if (nowMs > 0) {
    if (session.phaseStartedAtMs <= 0) session.phaseStartedAtMs = nowMs;
    if (session.lastValidSampleTimestamp > 0) {
      const gap = nowMs - session.lastValidSampleTimestamp;
      if (gap > 0 && gap <= LIVEACT_PERSONAL_MAX_SAMPLE_GAP_MS) {
        session.validCaptureMs += gap;
      }
    }
    session.lastValidSampleTimestamp = nowMs;
  }
  session.validFrameCount += 1;
  pushNum(session.headYaw, sample.headYaw);
  pushNum(session.headPitch, sample.headPitch);
  pushNum(session.headRoll, sample.headRoll);
  pushNum(session.eyeLeftX, sample.eyeLeftX);
  pushNum(session.eyeLeftY, sample.eyeLeftY);
  pushNum(session.eyeRightX, sample.eyeRightX);
  pushNum(session.eyeRightY, sample.eyeRightY);
  for (const id of LIVEACT_FACE_CHANNELS) {
    if (id === "_neutral") continue;
    const value = sample.face[id];
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    ensurePhaseChannel(session, phase.id, id).push(value);
  }
  if (phase.kind === "speech") {
    const jaw = sample.face.jawOpen;
    if (typeof jaw === "number" && Number.isFinite(jaw)) {
      session.speechJaw.push(jaw);
      if (session.speechPrevJaw !== null) {
        session.speechVelocityAbsSum += Math.abs(jaw - session.speechPrevJaw);
        session.speechVelocityCount += 1;
      }
      session.speechPrevJaw = jaw;
    }
  }
  return true;
}
function skipLiveActPersonalCalibrationPhase(session) {
  const phase = LIVEACT_PERSONAL_CALIBRATION_PHASES[session.phaseIndex];
  if (!phase?.skipAllowed) return false;
  if (!session.skippedPhaseIds.includes(phase.id)) {
    session.skippedPhaseIds.push(phase.id);
  }
  return advanceLiveActPersonalCalibrationPhase(session);
}
function advanceLiveActPersonalCalibrationPhase(session) {
  if (session.phaseIndex >= LIVEACT_PERSONAL_CALIBRATION_PHASES.length - 1) {
    return false;
  }
  session.phaseIndex += 1;
  resetPhaseCaptureClock(session);
  return true;
}
function isLiveActPersonalCalibrationPhaseComplete(session, _nowMs) {
  const phase = LIVEACT_PERSONAL_CALIBRATION_PHASES[session.phaseIndex];
  if (!phase) return true;
  if (session.validFrameCount < LIVEACT_PERSONAL_MIN_PHASE_FRAMES) return false;
  return session.validCaptureMs >= phase.durationMs;
}
function liveActPersonalCalibrationPhaseRemainingSec(session) {
  const phase = LIVEACT_PERSONAL_CALIBRATION_PHASES[session.phaseIndex];
  if (!phase) return null;
  const remainingMs = Math.max(0, phase.durationMs - session.validCaptureMs);
  return Math.ceil(remainingMs / 1e3);
}
function hasLiveActPersonalCalibrationEnoughValidSamples(session) {
  const requiredPhases = LIVEACT_PERSONAL_CALIBRATION_PHASES.filter(
    (p) => !session.skippedPhaseIds.includes(p.id)
  ).length;
  return session.headYaw.length >= LIVEACT_PERSONAL_MIN_PHASE_FRAMES * Math.max(1, requiredPhases);
}
function quantile(values, q) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(q * (sorted.length - 1))));
  return sorted[idx] ?? 0;
}
function median(values) {
  return quantile(values, 0.5);
}
function robustNoise(values, center) {
  if (values.length < 3) return 0;
  const absDev = values.map((v2) => Math.abs(v2 - center));
  return 1.4826 * median(absDev);
}
function mean(values) {
  if (values.length === 0) return 0;
  let sum = 0;
  for (const v2 of values) sum += v2;
  return sum / values.length;
}
function phaseSkipped(session, phaseId) {
  return session.skippedPhaseIds.includes(phaseId);
}
function channelSamples(session, phaseId, channel) {
  return session.phaseValues[phaseId]?.[channel] ?? [];
}
function allMotionSamples(session, channel) {
  const out = [];
  for (const phase of LIVEACT_PERSONAL_CALIBRATION_PHASES) {
    if (phase.kind === "neutral") continue;
    if (phaseSkipped(session, phase.id)) continue;
    out.push(...channelSamples(session, phase.id, channel));
  }
  return out;
}
function buildChannelCalib(session, channel, neutral, noiseFloor, forced) {
  if (forced === "skipped" || forced === "na" || forced === "unsupported") {
    return {
      capability: forced,
      neutral,
      usableMin: neutral,
      usableMax: neutral,
      noiseFloor,
      confidence: 0,
      asymmetry: 0,
      counterpartCrossTalk: 0
    };
  }
  const samples = allMotionSamples(session, channel);
  if (samples.length < 8) {
    return {
      capability: "weak",
      neutral,
      usableMin: neutral,
      usableMax: neutral,
      noiseFloor,
      confidence: 0.2,
      asymmetry: 0,
      counterpartCrossTalk: 0
    };
  }
  const q05 = quantile(samples, 0.05);
  const q95 = quantile(samples, 0.95);
  const usableMin = Math.min(q05, neutral);
  const usableMax = Math.max(q95, neutral);
  const span = usableMax - neutral;
  const conf2 = Math.min(1, samples.length / 40);
  let capability = "available";
  if (span < LIVEACT_PERSONAL_WEAK_SPAN) capability = "weak";
  else if (span < LIVEACT_PERSONAL_MIN_USABLE_SPAN) capability = "weak";
  if ((channel.startsWith("cheek") || channel.startsWith("noseSneer")) && capability === "available" && span < 0.2) {
    capability = "requires450";
  }
  let counterpartCrossTalk = 0;
  if (channel === "eyeBlinkLeft") {
    const right = allMotionSamples(session, "eyeBlinkRight");
    const leftPeak = quantile(samples, 0.95);
    const rightAtLeftIntent = quantile(right, 0.95);
    if (leftPeak > 0.4) counterpartCrossTalk = Math.max(0, rightAtLeftIntent - noiseFloor);
  } else if (channel === "eyeBlinkRight") {
    const left = allMotionSamples(session, "eyeBlinkLeft");
    const rightPeak = quantile(samples, 0.95);
    const leftAtRightIntent = quantile(left, 0.95);
    if (rightPeak > 0.4) counterpartCrossTalk = Math.max(0, leftAtRightIntent - noiseFloor);
  } else if (channel === "mouthSmileLeft") {
    counterpartCrossTalk = Math.max(
      0,
      quantile(allMotionSamples(session, "mouthSmileRight"), 0.95) - noiseFloor
    );
  } else if (channel === "mouthSmileRight") {
    counterpartCrossTalk = Math.max(
      0,
      quantile(allMotionSamples(session, "mouthSmileLeft"), 0.95) - noiseFloor
    );
  }
  return {
    capability,
    neutral,
    usableMin,
    usableMax,
    noiseFloor,
    confidence: conf2,
    asymmetry: 0,
    counterpartCrossTalk: clampLiveActChannel(counterpartCrossTalk)
  };
}
function finalizeLiveActPersonalCalibrationProfile(session, createdAtLocalMs) {
  const neutralFaceSamples = session.phaseValues.neutral ?? {};
  const faceNeutral = {
    ...createNeutralLiveActFaceChannels()
  };
  const faceNoise = {};
  for (const id of LIVEACT_FACE_CHANNELS) {
    if (id === "_neutral") continue;
    const vals = neutralFaceSamples[id] ?? [];
    const n = vals.length > 0 ? mean(vals) : 0;
    faceNeutral[id] = clampLiveActChannel(n);
    faceNoise[id] = robustNoise(vals, n);
  }
  const headNeutralYaw = mean(session.headYaw.slice(0, Math.min(session.headYaw.length, 60)));
  const headNeutralPitch = mean(session.headPitch.slice(0, Math.min(session.headPitch.length, 60)));
  const headNeutralRoll = mean(session.headRoll.slice(0, Math.min(session.headRoll.length, 60)));
  const gazeNeutralX = mean([
    ...session.eyeLeftX.slice(0, 60),
    ...session.eyeRightX.slice(0, 60)
  ]);
  const gazeNeutralY = mean([
    ...session.eyeLeftY.slice(0, 60),
    ...session.eyeRightY.slice(0, 60)
  ]);
  const channels = {};
  const eyesBrowsSkipped = phaseSkipped(session, "eyesBrows");
  const jawSmileSkipped = phaseSkipped(session, "jawSmile");
  const lipsSkipped = phaseSkipped(session, "lips");
  for (const id of LIVEACT_FACE_CHANNELS) {
    if (id === "_neutral") continue;
    let forced = null;
    if (eyesBrowsSkipped && (id.startsWith("eyeBlink") || id.startsWith("brow"))) {
      forced = "skipped";
    }
    if (jawSmileSkipped && (id === "jawOpen" || id === "mouthSmileLeft" || id === "mouthSmileRight")) {
      forced = "skipped";
    }
    if (lipsSkipped && (id.startsWith("mouth") || id.startsWith("cheek") || id.startsWith("nose"))) {
      forced = "skipped";
    }
    channels[id] = buildChannelCalib(
      session,
      id,
      faceNeutral[id] ?? 0,
      faceNoise[id] ?? 0,
      forced
    );
  }
  const smileL = channels.mouthSmileLeft;
  const smileR = channels.mouthSmileRight;
  if (smileL && smileR) {
    const spanL = smileL.usableMax - smileL.neutral;
    const spanR = smileR.usableMax - smileR.neutral;
    const asym = spanR - spanL;
    channels.mouthSmileLeft = { ...smileL, asymmetry: asym };
    channels.mouthSmileRight = { ...smileR, asymmetry: -asym };
  }
  const yawRange = Math.max(
    0,
    quantile(session.headYaw, 0.95) - quantile(session.headYaw, 0.05)
  );
  const pitchRange = Math.max(
    0,
    quantile(session.headPitch, 0.95) - quantile(session.headPitch, 0.05)
  );
  const rollRange = Math.max(
    0,
    quantile(session.headRoll, 0.95) - quantile(session.headRoll, 0.05)
  );
  const gazeXs = [...session.eyeLeftX, ...session.eyeRightX];
  const gazeYs = [...session.eyeLeftY, ...session.eyeRightY];
  const speechAmp = session.speechJaw.length > 0 ? Math.max(0, quantile(session.speechJaw, 0.95) - (faceNeutral.jawOpen ?? 0)) : 0;
  const speechVel = session.speechVelocityCount > 0 ? session.speechVelocityAbsSum / session.speechVelocityCount : 0;
  const speechSat = session.speechJaw.length > 0 ? session.speechJaw.filter((v2) => v2 >= 0.98).length / session.speechJaw.length : 0;
  const scope = {
    ownerLocalId: session.ownerLocalId,
    characterLocalId: session.characterLocalId
  };
  const enough = hasLiveActPersonalCalibrationEnoughValidSamples(session);
  const status = enough ? "valid" : "incompatible";
  return {
    contractVersion: LIVEACT_PERSONAL_CALIBRATION_CONTRACT,
    policyVersion: LIVEACT_PERSONAL_CALIBRATION_POLICY_VERSION,
    solverFingerprint: createLiveActSolverFingerprintV1(),
    createdAtLocalMs,
    ownerLocalId: isLiveActPersonalCalibrationScopeComplete(scope) ? scope.ownerLocalId : session.ownerLocalId,
    characterLocalId: isLiveActPersonalCalibrationScopeComplete(scope) ? scope.characterLocalId : session.characterLocalId,
    status,
    head: {
      neutralYaw: headNeutralYaw,
      neutralPitch: headNeutralPitch,
      neutralRoll: headNeutralRoll,
      rangeYaw: yawRange,
      rangePitch: pitchRange,
      rangeRoll: rollRange,
      headPoseSupported: session.headPoseSupported
    },
    gaze: {
      neutralX: gazeNeutralX,
      neutralY: gazeNeutralY,
      rangeLeft: Math.max(0, gazeNeutralX - quantile(gazeXs, 0.05)),
      rangeRight: Math.max(0, quantile(gazeXs, 0.95) - gazeNeutralX),
      rangeUp: Math.max(0, gazeNeutralY - quantile(gazeYs, 0.05)),
      rangeDown: Math.max(0, quantile(gazeYs, 0.95) - gazeNeutralY)
    },
    channels,
    speech: {
      amplitudeProxy: speechAmp,
      velocityProxy: speechVel,
      saturationProxy: speechSat,
      sampleCount: session.speechJaw.length
    },
    skippedPhaseIds: [...session.skippedPhaseIds]
  };
}
function resolveLiveActPersonalProfileStatus(profile, currentFingerprint = createLiveActSolverFingerprintV1()) {
  if (profile.contractVersion !== LIVEACT_PERSONAL_CALIBRATION_CONTRACT) {
    return "incompatible";
  }
  if (profile.policyVersion !== LIVEACT_PERSONAL_CALIBRATION_POLICY_VERSION) {
    return "needsMigration";
  }
  if (!liveActSolverFingerprintsEqual(profile.solverFingerprint, currentFingerprint)) {
    return "needsRecalibration";
  }
  return profile.status === "valid" ? "valid" : profile.status;
}
function liveActCalibrationSetFromPersonalProfile(profile) {
  const face = {
    ...createNeutralLiveActFaceChannels()
  };
  for (const id of LIVEACT_FACE_CHANNELS) {
    if (id === "_neutral") continue;
    face[id] = clampLiveActChannel(profile.channels[id]?.neutral ?? 0);
  }
  const neutral = {
    head: {
      yaw: profile.head.neutralYaw,
      pitch: profile.head.neutralPitch,
      roll: profile.head.neutralRoll
    },
    eyeLeft: { x: profile.gaze.neutralX, y: profile.gaze.neutralY },
    eyeRight: { x: profile.gaze.neutralX, y: profile.gaze.neutralY },
    face,
    headPoseSupported: profile.head.headPoseSupported
  };
  const gain = {};
  const effectiveSpan = (id) => {
    const ch = profile.channels[id];
    if (!ch || ch.capability !== "available") return null;
    const span = ch.usableMax - ch.neutral;
    const effective = span - ch.noiseFloor * LIVEACT_PERSONAL_NOISE_DEADZONE_MULT;
    if (effective < LIVEACT_PERSONAL_MIN_USABLE_SPAN) return null;
    return effective;
  };
  const pairs = [
    ["mouthSmileLeft", "mouthSmileRight"],
    ["eyeBlinkLeft", "eyeBlinkRight"],
    ["mouthPressLeft", "mouthPressRight"],
    ["mouthUpperUpLeft", "mouthUpperUpRight"],
    ["mouthLowerDownLeft", "mouthLowerDownRight"],
    ["browOuterUpLeft", "browOuterUpRight"],
    ["noseSneerLeft", "noseSneerRight"]
  ];
  const paired = /* @__PURE__ */ new Set();
  for (const [left, right] of pairs) {
    paired.add(left);
    paired.add(right);
    const spanL = effectiveSpan(left);
    const spanR = effectiveSpan(right);
    const best = Math.max(spanL ?? 0, spanR ?? 0);
    if (best < LIVEACT_PERSONAL_MIN_USABLE_SPAN) continue;
    const g = Math.min(LIVEACT_PERSONAL_MAX_GAIN, 1 / best);
    if (spanL !== null) gain[left] = g;
    if (spanR !== null) gain[right] = g;
  }
  for (const id of LIVEACT_FACE_CHANNELS) {
    if (id === "_neutral" || paired.has(id)) continue;
    const effective = effectiveSpan(id);
    if (effective === null) continue;
    gain[id] = Math.min(LIVEACT_PERSONAL_MAX_GAIN, 1 / effective);
  }
  const range = Object.keys(gain).length > 0 ? { gain } : null;
  return { neutral, range };
}
function applyLiveActPersonalCalibration(frame, profile, limits = DEFAULT_LIVEACT_LIMITS) {
  if (!profile || frame.trackingLost) return frame;
  if (resolveLiveActPersonalProfileStatus(profile) !== "valid") return frame;
  const set = liveActCalibrationSetFromPersonalProfile(profile);
  const neutral = set.neutral;
  if (!neutral) return frame;
  let head = frame.head;
  if (neutral.headPoseSupported) {
    head = {
      yaw: clampLiveActAngle(frame.head.yaw - neutral.head.yaw, limits.maxYaw),
      pitch: clampLiveActAngle(frame.head.pitch - neutral.head.pitch, limits.maxPitch),
      roll: clampLiveActAngle(frame.head.roll - neutral.head.roll, limits.maxRoll)
    };
  }
  const eyeLeft = {
    x: clampLiveActGaze(frame.eyeLeft.x - neutral.eyeLeft.x),
    y: clampLiveActGaze(frame.eyeLeft.y - neutral.eyeLeft.y)
  };
  const eyeRight = {
    x: clampLiveActGaze(frame.eyeRight.x - neutral.eyeRight.x),
    y: clampLiveActGaze(frame.eyeRight.y - neutral.eyeRight.y)
  };
  const face = { ...frame.face };
  for (const id of LIVEACT_FACE_CHANNELS) {
    if (id === "_neutral") continue;
    const ch = profile.channels[id];
    const raw = (face[id] ?? 0) - (neutral.face[id] ?? 0);
    const noise = ch?.noiseFloor ?? 0;
    const dead = noise * LIVEACT_PERSONAL_NOISE_DEADZONE_MULT;
    let v2 = Math.abs(raw) <= dead ? 0 : raw;
    const gain = set.range?.gain[id];
    if (typeof gain === "number" && ch?.capability === "available") {
      v2 *= gain;
    }
    face[id] = clampLiveActChannel(v2);
  }
  return {
    ...frame,
    head,
    eyeLeft,
    eyeRight,
    face
  };
}
function assertLiveActPersonalProfileLocalOnly(profile) {
  const json = JSON.stringify(profile);
  if (/data:image|landmarks|webcam|mediapipe|irisPoints/i.test(json)) {
    throw new Error("LiveAct personal profile must not embed raw biometric payloads");
  }
}
function currentLiveActPersonalPhaseId(session) {
  return LIVEACT_PERSONAL_CALIBRATION_PHASES[session.phaseIndex]?.id ?? null;
}

// src/domains/character/liveact/liveact-calibration.ts
var LIVEACT_CALIBRATION_FRAME_TARGET = 30;
var LIVEACT_CALIBRATION_TIMEOUT_MS = 2e3;
function createLiveActCalibrationAccumulator() {
  const faceSums = {};
  for (const id of LIVEACT_FACE_CHANNELS) {
    if (id === "_neutral") continue;
    faceSums[id] = 0;
  }
  return {
    count: 0,
    headYawSum: 0,
    headPitchSum: 0,
    headRollSum: 0,
    eyeLeftXSum: 0,
    eyeLeftYSum: 0,
    eyeRightXSum: 0,
    eyeRightYSum: 0,
    faceSums,
    headPoseSupported: true
  };
}
function isValidLiveActCalibrationSample(sample, limits = DEFAULT_LIVEACT_LIMITS) {
  return sample.faceIndex >= 0 && sample.presence >= limits.presenceThreshold;
}
function pushLiveActCalibrationSample(acc, sample, options) {
  const limits = options.limits ?? DEFAULT_LIVEACT_LIMITS;
  if (!isValidLiveActCalibrationSample(sample, limits)) {
    return false;
  }
  acc.count += 1;
  acc.headYawSum += sample.headYaw;
  acc.headPitchSum += sample.headPitch;
  acc.headRollSum += sample.headRoll;
  acc.eyeLeftXSum += sample.eyeLeftX;
  acc.eyeLeftYSum += sample.eyeLeftY;
  acc.eyeRightXSum += sample.eyeRightX;
  acc.eyeRightYSum += sample.eyeRightY;
  acc.headPoseSupported = options.headPoseSupported;
  for (const id of LIVEACT_FACE_CHANNELS) {
    if (id === "_neutral") continue;
    const value = sample.face[id];
    if (typeof value === "number" && Number.isFinite(value)) {
      acc.faceSums[id] = (acc.faceSums[id] ?? 0) + value;
    }
  }
  return true;
}
function finalizeLiveActCalibration(acc) {
  if (acc.count < LIVEACT_CALIBRATION_FRAME_TARGET) {
    return null;
  }
  const n = acc.count;
  const face = createNeutralLiveActFaceChannels();
  for (const id of LIVEACT_FACE_CHANNELS) {
    if (id === "_neutral") continue;
    const sum = acc.faceSums[id] ?? 0;
    face[id] = clampLiveActChannel(sum / n);
  }
  return {
    head: {
      yaw: acc.headYawSum / n,
      pitch: acc.headPitchSum / n,
      roll: acc.headRollSum / n
    },
    eyeLeft: { x: acc.eyeLeftXSum / n, y: acc.eyeLeftYSum / n },
    eyeRight: { x: acc.eyeRightXSum / n, y: acc.eyeRightYSum / n },
    face,
    headPoseSupported: acc.headPoseSupported
  };
}
function applyLiveActNeutralBaseline(frame, baseline, limits = DEFAULT_LIVEACT_LIMITS) {
  if (!baseline || frame.trackingLost) {
    return frame;
  }
  const face = createNeutralLiveActFaceChannels();
  for (const id of LIVEACT_FACE_CHANNELS) {
    if (id === "_neutral") {
      face._neutral = frame.face._neutral;
      continue;
    }
    const raw = (frame.face[id] ?? 0) - (baseline.face[id] ?? 0);
    face[id] = clampLiveActChannel(raw);
  }
  const head = baseline.headPoseSupported ? {
    yaw: clampLiveActAngle(frame.head.yaw - baseline.head.yaw, limits.maxYaw),
    pitch: clampLiveActAngle(frame.head.pitch - baseline.head.pitch, limits.maxPitch),
    roll: clampLiveActAngle(frame.head.roll - baseline.head.roll, limits.maxRoll)
  } : frame.head;
  return {
    ...frame,
    head,
    eyeLeft: {
      x: clampLiveActGaze(frame.eyeLeft.x - baseline.eyeLeft.x),
      y: clampLiveActGaze(frame.eyeLeft.y - baseline.eyeLeft.y)
    },
    eyeRight: {
      x: clampLiveActGaze(frame.eyeRight.x - baseline.eyeRight.x),
      y: clampLiveActGaze(frame.eyeRight.y - baseline.eyeRight.y)
    },
    face
  };
}
var LIVEACT_RANGE_CALIBRATION_STEPS = [
  {
    id: "jawOpen",
    labelDe: "Mund weit auf",
    holdDe: "Mund weit \xF6ffnen",
    holdMs: 3e3,
    channels: ["jawOpen"]
  },
  {
    id: "eyesClosed",
    labelDe: "Augen fest zu",
    holdDe: "Augen zu bis der Ton kommt",
    holdMs: 3e3,
    channels: ["eyeBlinkLeft", "eyeBlinkRight"]
  },
  {
    id: "browsUp",
    labelDe: "Brauen hoch",
    holdDe: "Brauen hochziehen",
    holdMs: 3e3,
    channels: ["browInnerUp", "browOuterUpLeft", "browOuterUpRight"]
  },
  {
    id: "smile",
    labelDe: "Breit l\xE4cheln",
    holdDe: "2\u20133\xD7 breit l\xE4cheln",
    holdMs: 6e3,
    channels: ["mouthSmileLeft", "mouthSmileRight"]
  },
  {
    id: "rollUpper",
    labelDe: "Oberlippe einrollen",
    holdDe: "Oberlippe nach innen \u2014 2\u20133\xD7",
    holdMs: 6e3,
    channels: ["mouthRollUpper"]
  },
  {
    id: "rollLower",
    labelDe: "Unterlippe einrollen",
    holdDe: "Unterlippe nach innen \u2014 2\u20133\xD7",
    holdMs: 6e3,
    channels: ["mouthRollLower"]
  },
  {
    id: "press",
    labelDe: "Lippen zusammenpressen",
    holdDe: "Lippen fest pressen \u2014 2\u20133\xD7",
    holdMs: 6e3,
    channels: ["mouthPressLeft", "mouthPressRight"]
  },
  {
    id: "mouthClose",
    labelDe: "Z\xE4hne zeigen, Lippen zukneifen",
    holdDe: "Mund etwas offen, Lippen zukneifen \u2014 2\u20133\xD7",
    holdMs: 6e3,
    channels: ["mouthClose", "jawOpen"]
  },
  {
    id: "upperUp",
    labelDe: "Oberlippe hochziehen",
    holdDe: "wie Naser\xFCmpfen \u2014 2\u20133\xD7",
    holdMs: 6e3,
    channels: ["mouthUpperUpLeft", "mouthUpperUpRight"]
  },
  {
    id: "lowerDown",
    labelDe: "Unterlippe herunterziehen",
    holdDe: "Unterlippe runter \u2014 2\u20133\xD7",
    holdMs: 6e3,
    channels: ["mouthLowerDownLeft", "mouthLowerDownRight"]
  },
  {
    id: "funnel",
    labelDe: "Starkes O / Funnel",
    holdDe: "rundes O \u2014 2\u20133\xD7",
    holdMs: 6e3,
    channels: ["mouthFunnel"]
  },
  {
    id: "pucker",
    labelDe: "Kussmund / Pucker",
    holdDe: "Lippen spitzen \u2014 2\u20133\xD7",
    holdMs: 6e3,
    channels: ["mouthPucker"]
  },
  {
    id: "shrug",
    labelDe: "Schmollmund",
    holdDe: "Schmollen \u2014 2\u20133\xD7",
    holdMs: 6e3,
    channels: ["mouthShrugUpper", "mouthShrugLower"]
  },
  {
    id: "mouthLeft",
    labelDe: "Mund zur linken Wange",
    holdDe: "Mund zu deiner linken Wange \u2014 2\u20133\xD7",
    holdMs: 6e3,
    channels: ["mouthLeft"]
  },
  {
    id: "mouthRight",
    labelDe: "Mund zur rechten Wange",
    holdDe: "Mund zu deiner rechten Wange \u2014 2\u20133\xD7",
    holdMs: 6e3,
    channels: ["mouthRight"]
  }
];
var LIVEACT_RANGE_STEP_MIN_FRAMES = 20;
var LIVEACT_RANGE_STEP_MIN_MS = 3e3;
var LIVEACT_RANGE_CALIBRATION_DURATION_MS = LIVEACT_RANGE_CALIBRATION_STEPS.reduce(
  (sum, step) => sum + step.holdMs,
  0
);
var LIVEACT_RANGE_CALIBRATION_MIN_FRAMES = 30;
var LIVEACT_RANGE_MIN_SPAN = 0.1;
var LIVEACT_RANGE_MAX_GAIN = 4;
var LIVEACT_RANGE_PEAK_QUANTILE = 0.95;
function liveActCalibrationStepTotal() {
  return LIVEACT_RANGE_CALIBRATION_STEPS.length + 1;
}
function liveActNeutralCalibrationPrompt() {
  return `Schritt 1/${liveActCalibrationStepTotal()}: Neutral halten \u2026`;
}
function liveActRangeStepHoldMs(stepIndex) {
  const step = LIVEACT_RANGE_CALIBRATION_STEPS[stepIndex];
  return step?.holdMs ?? LIVEACT_RANGE_STEP_MIN_MS;
}
function liveActRangeStepChannels(stepIndex) {
  return LIVEACT_RANGE_CALIBRATION_STEPS[stepIndex]?.channels ?? [];
}
function liveActRangeCalibrationStepPrompt(stepIndex) {
  const steps = LIVEACT_RANGE_CALIBRATION_STEPS;
  const total = liveActCalibrationStepTotal();
  const step = steps[stepIndex];
  if (!step) return `Schritt ${total}/${total}: Fertig`;
  const ordinal = stepIndex + 2;
  const seconds = Math.round(liveActRangeStepHoldMs(stepIndex) / 1e3);
  return `Schritt ${ordinal}/${total}: ${step.labelDe} \u2014 ${step.holdDe} (${seconds} s)`;
}
function createLiveActRangeCalibrationAccumulator() {
  return { count: 0, values: {} };
}
function pushLiveActRangeCalibrationSample(acc, sample, limits = DEFAULT_LIVEACT_LIMITS) {
  if (!isValidLiveActCalibrationSample(sample, limits)) {
    return false;
  }
  acc.count += 1;
  for (const id of LIVEACT_FACE_CHANNELS) {
    if (id === "_neutral") continue;
    const value = sample.face[id];
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    const bucket = acc.values[id] ?? [];
    bucket.push(value);
    acc.values[id] = bucket;
  }
  return true;
}
function liveActQuantile(values, q) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(q * (sorted.length - 1)))] ?? 0;
}
function finalizeLiveActRangeCalibration(acc, baseline) {
  if (acc.count < LIVEACT_RANGE_CALIBRATION_MIN_FRAMES) {
    return null;
  }
  const gain = {};
  for (const id of LIVEACT_FACE_CHANNELS) {
    if (id === "_neutral") continue;
    const values = acc.values[id];
    if (!values || values.length < LIVEACT_RANGE_CALIBRATION_MIN_FRAMES) continue;
    const span = liveActQuantile(values, LIVEACT_RANGE_PEAK_QUANTILE) - (baseline.face[id] ?? 0);
    if (span < LIVEACT_RANGE_MIN_SPAN) continue;
    gain[id] = Math.min(LIVEACT_RANGE_MAX_GAIN, 1 / span);
  }
  return Object.keys(gain).length > 0 ? { gain } : null;
}
function applyLiveActRangeCalibration(frame, range) {
  if (!range || frame.trackingLost) {
    return frame;
  }
  const face = { ...frame.face };
  for (const id of Object.keys(range.gain)) {
    const gain = range.gain[id];
    if (typeof gain !== "number") continue;
    face[id] = clampLiveActChannel((face[id] ?? 0) * gain);
  }
  return { ...frame, face };
}
function applyLiveActCalibration(frame, calibration, limits = DEFAULT_LIVEACT_LIMITS) {
  return applyLiveActRangeCalibration(
    applyLiveActNeutralBaseline(frame, calibration.neutral, limits),
    calibration.range
  );
}
function liveActUncalibratedLostPose(calibrated, neutral, limits) {
  if (!neutral) return calibrated;
  return {
    ...calibrated,
    head: neutral.headPoseSupported ? {
      yaw: clampLiveActAngle(calibrated.head.yaw + neutral.head.yaw, limits.maxYaw),
      pitch: clampLiveActAngle(calibrated.head.pitch + neutral.head.pitch, limits.maxPitch),
      roll: clampLiveActAngle(calibrated.head.roll + neutral.head.roll, limits.maxRoll)
    } : calibrated.head,
    eyeLeft: {
      x: clampLiveActGaze(calibrated.eyeLeft.x + neutral.eyeLeft.x),
      y: clampLiveActGaze(calibrated.eyeLeft.y + neutral.eyeLeft.y)
    },
    eyeRight: {
      x: clampLiveActGaze(calibrated.eyeRight.x + neutral.eyeRight.x),
      y: clampLiveActGaze(calibrated.eyeRight.y + neutral.eyeRight.y)
    },
    face: neutral.face
  };
}
function applyCalibrationStage(frame, calibration, personalProfile, limits) {
  if (personalProfile && resolveLiveActPersonalProfileStatus(personalProfile) === "valid") {
    return applyLiveActPersonalCalibration(frame, personalProfile, limits);
  }
  return applyLiveActCalibration(frame, calibration, limits);
}
function stepLiveActCalibratedFrame(previous, mapped, calibration, limits = DEFAULT_LIVEACT_LIMITS, mode = "adaptive", personalProfile = null) {
  if (mode === "v1-fixed") {
    if (mapped.trackingLost && previous) {
      const calibrated = smoothLiveActFrame(previous.calibrated, mapped, limits.smooth);
      return {
        smoothed: liveActUncalibratedLostPose(calibrated, calibration.neutral, limits),
        calibrated,
        temporal: null
      };
    }
    const smoothed = smoothLiveActFrame(previous?.smoothed ?? null, mapped, limits.smooth);
    return {
      smoothed,
      calibrated: applyCalibrationStage(smoothed, calibration, personalProfile, limits),
      temporal: null
    };
  }
  const { frame: smoothedRaw, state: temporal } = stepAdaptiveTemporal(
    previous?.temporal ?? null,
    mapped
  );
  if (mapped.trackingLost) {
    const calibrated = applyCalibrationStage(
      smoothedRaw,
      calibration,
      personalProfile,
      limits
    );
    return {
      smoothed: smoothedRaw,
      calibrated,
      temporal
    };
  }
  return {
    smoothed: smoothedRaw,
    calibrated: applyCalibrationStage(smoothedRaw, calibration, personalProfile, limits),
    temporal
  };
}

// src/domains/character/liveact/liveact-runtime-policy.ts
var LIVEACT_UI_STATUS_MAX_HZ = 5;
var LIVEACT_INFERENCE_MAX_IN_FLIGHT = 1;
function liveActUiStatusMinIntervalMs(maxHz = LIVEACT_UI_STATUS_MAX_HZ) {
  return 1e3 / Math.max(1, maxHz);
}
function shouldThrottleLiveActUiStatus(lastEmitMs, nowMs, maxHz = LIVEACT_UI_STATUS_MAX_HZ) {
  if (lastEmitMs <= 0) return false;
  return nowMs - lastEmitMs < liveActUiStatusMinIntervalMs(maxHz);
}
function shouldDropLiveActInferenceTick(inFlightCount, maxInFlight = LIVEACT_INFERENCE_MAX_IN_FLIGHT) {
  return inFlightCount >= Math.max(1, maxInFlight);
}

// src/domains/character/liveact/liveact-perfect-fidelity-contract.ts
var LIVEACT_FIDELITY_NOMINAL_SAMPLE_RATE_HZ = 30;

// src/domains/character/liveact/liveact-perfect-fidelity-fixtures.ts
var HZ = LIVEACT_FIDELITY_NOMINAL_SAMPLE_RATE_HZ;
var DT = 1e3 / HZ;

// src/domains/character/liveact/liveact-dense-face-features-normalize.ts
var SCALE_EPS = 1e-5;
function v(x, y, z) {
  return { x, y, z };
}
function sub(a, b) {
  return v(a.x - b.x, a.y - b.y, a.z - b.z);
}
function add(a, b) {
  return v(a.x + b.x, a.y + b.y, a.z + b.z);
}
function scale(a, s) {
  return v(a.x * s, a.y * s, a.z * s);
}
function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}
function cross(a, b) {
  return v(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
}
function len(a) {
  return Math.hypot(a.x, a.y, a.z);
}
function normalize(a) {
  const l = len(a);
  if (!Number.isFinite(l) || l < SCALE_EPS) return null;
  return scale(a, 1 / l);
}
function midpoint(a, b) {
  return scale(add(a, b), 0.5);
}
function asVec(p) {
  if (!p.available) return null;
  if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.z)) return null;
  return v(p.x, p.y, p.z);
}
function requirePoint(geometry, id) {
  return asVec(geometry.points[id]);
}
function degenerateFrame() {
  const z = v(0, 0, 0);
  return {
    status: "degenerate",
    origin: z,
    axisX: z,
    axisY: z,
    axisZ: z,
    scale: 0
  };
}
function buildDenseFaceLocalFrame(geometry) {
  const eyeOuterL = requirePoint(geometry, "eyeOuterLeft");
  const eyeInnerL = requirePoint(geometry, "eyeInnerLeft");
  const eyeOuterR = requirePoint(geometry, "eyeOuterRight");
  const eyeInnerR = requirePoint(geometry, "eyeInnerRight");
  const forehead = requirePoint(geometry, "forehead");
  const noseBridge = requirePoint(geometry, "noseBridge");
  const noseTip = requirePoint(geometry, "noseTip");
  if (!eyeOuterL || !eyeInnerL || !eyeOuterR || !eyeInnerR) {
    return { ...degenerateFrame(), status: "unavailable" };
  }
  const eyeCenterL = midpoint(eyeOuterL, eyeInnerL);
  const eyeCenterR = midpoint(eyeOuterR, eyeInnerR);
  const origin = midpoint(eyeCenterL, eyeCenterR);
  const xRaw = sub(eyeCenterL, eyeCenterR);
  const axisX = normalize(xRaw);
  if (!axisX) return degenerateFrame();
  const upRef = forehead ?? noseBridge;
  if (!upRef) return degenerateFrame();
  let yCand = sub(upRef, origin);
  yCand = sub(yCand, scale(axisX, dot(yCand, axisX)));
  let axisY = normalize(yCand);
  if (!axisY) return degenerateFrame();
  let axisZ = cross(axisX, axisY);
  axisZ = normalize(axisZ) ?? v(0, 0, 0);
  if (len(axisZ) < SCALE_EPS) return degenerateFrame();
  if (noseTip) {
    const noseRel = sub(noseTip, origin);
    if (dot(noseRel, axisZ) < 0) {
      axisZ = scale(axisZ, -1);
    }
  }
  axisY = cross(axisZ, axisX);
  axisY = normalize(axisY) ?? v(0, 0, 0);
  if (len(axisY) < SCALE_EPS) return degenerateFrame();
  axisZ = cross(axisX, axisY);
  axisZ = normalize(axisZ) ?? v(0, 0, 0);
  if (len(axisZ) < SCALE_EPS) return degenerateFrame();
  const scaleDist = len(sub(eyeCenterL, eyeCenterR));
  if (!Number.isFinite(scaleDist) || scaleDist < SCALE_EPS) return degenerateFrame();
  if (Math.abs(dot(axisX, axisY)) > 1e-3) return degenerateFrame();
  if (Math.abs(dot(axisX, axisZ)) > 1e-3) return degenerateFrame();
  if (Math.abs(dot(axisY, axisZ)) > 1e-3) return degenerateFrame();
  return {
    status: "ok",
    origin,
    axisX,
    axisY,
    axisZ,
    scale: scaleDist
  };
}
function toDenseLocalPoint(world, frame) {
  if (frame.status !== "ok" || frame.scale < SCALE_EPS) return null;
  const rel = sub(world, frame.origin);
  const lx = dot(rel, frame.axisX) / frame.scale;
  const ly = dot(rel, frame.axisY) / frame.scale;
  const lz = dot(rel, frame.axisZ) / frame.scale;
  if (!Number.isFinite(lx) || !Number.isFinite(ly) || !Number.isFinite(lz)) return null;
  return v(lx, ly, lz);
}
function mapGeometryToDenseLocal(geometry, frame) {
  const out = {};
  for (const id of Object.keys(geometry.points)) {
    const world = asVec(geometry.points[id]);
    out[id] = world ? toDenseLocalPoint(world, frame) : null;
  }
  return out;
}
function denseLocalDistance(a, b) {
  return len(sub(a, b));
}
function isFiniteVec3(p) {
  return !!p && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z);
}

// src/domains/character/liveact/liveact-dense-face-features-extract.ts
function conf(face, geomAvail) {
  return clamp012(face * clamp012(geomAvail));
}
function scalarFrom(value, faceConf, geomAvail) {
  if (value === null || !Number.isFinite(value)) {
    return unavailableDenseScalar(conf(faceConf, geomAvail));
  }
  return availableDenseScalar(value, conf(faceConf, geomAvail));
}
function gapAt(upper, lower) {
  if (!isFiniteVec3(upper) || !isFiniteVec3(lower)) return null;
  return denseLocalDistance(upper, lower);
}
function stationY(p, mouthCenter) {
  if (!isFiniteVec3(p)) return null;
  return p.y - mouthCenter.y;
}
function buildContour(ids, local, mouthCenter, faceConf) {
  const s0 = scalarFrom(stationY(local[ids[0]], mouthCenter), faceConf, isFiniteVec3(local[ids[0]]) ? 1 : 0);
  const s1 = scalarFrom(stationY(local[ids[1]], mouthCenter), faceConf, isFiniteVec3(local[ids[1]]) ? 1 : 0);
  const s2 = scalarFrom(stationY(local[ids[2]], mouthCenter), faceConf, isFiniteVec3(local[ids[2]]) ? 1 : 0);
  const s3 = scalarFrom(stationY(local[ids[3]], mouthCenter), faceConf, isFiniteVec3(local[ids[3]]) ? 1 : 0);
  const s4 = scalarFrom(stationY(local[ids[4]], mouthCenter), faceConf, isFiniteVec3(local[ids[4]]) ? 1 : 0);
  const stations = [s0, s1, s2, s3, s4];
  const availableCount = stations.filter((s) => s.available).length;
  if (availableCount < 3) {
    return { available: false, confidence: 0, stations: null };
  }
  return {
    available: true,
    confidence: conf(faceConf, availableCount / 5),
    stations
  };
}
function extractLips(local, faceConf) {
  const cL = local.mouthCornerLeft;
  const cR = local.mouthCornerRight;
  const uC = local.lipUpperCenter;
  const lC = local.lipLowerCenter;
  const uOL = local.lipUpperOuterLeft;
  const uIL = local.lipUpperInnerLeft;
  const uIR = local.lipUpperInnerRight;
  const uOR = local.lipUpperOuterRight;
  const lOL = local.lipLowerOuterLeft;
  const lIL = local.lipLowerInnerLeft;
  const lIR = local.lipLowerInnerRight;
  const lOR = local.lipLowerOuterRight;
  const width = isFiniteVec3(cL) && isFiniteVec3(cR) ? denseLocalDistance(cL, cR) : null;
  const gapCenter = gapAt(uC, lC);
  const gapLeft = gapAt(uIL ?? uOL, lIL ?? lOL);
  const gapRight = gapAt(uIR ?? uOR, lIR ?? lOR);
  const mouthCenter = isFiniteVec3(uC) && isFiniteVec3(lC) ? {
    x: (uC.x + lC.x) * 0.5,
    y: (uC.y + lC.y) * 0.5,
    z: (uC.z + lC.z) * 0.5
  } : isFiniteVec3(cL) && isFiniteVec3(cR) ? {
    x: (cL.x + cR.x) * 0.5,
    y: (cL.y + cR.y) * 0.5,
    z: (cL.z + cR.z) * 0.5
  } : null;
  const upperContour = mouthCenter ? buildContour(
    [
      "lipUpperOuterLeft",
      "lipUpperInnerLeft",
      "lipUpperCenter",
      "lipUpperInnerRight",
      "lipUpperOuterRight"
    ],
    local,
    mouthCenter,
    faceConf
  ) : { available: false, confidence: 0, stations: null };
  const lowerContour = mouthCenter ? buildContour(
    [
      "lipLowerOuterLeft",
      "lipLowerInnerLeft",
      "lipLowerCenter",
      "lipLowerInnerRight",
      "lipLowerOuterRight"
    ],
    local,
    mouthCenter,
    faceConf
  ) : { available: false, confidence: 0, stations: null };
  let curvature = null;
  if (mouthCenter && isFiniteVec3(cL) && isFiniteVec3(cR)) {
    curvature = (cL.y + cR.y) * 0.5 - mouthCenter.y;
  }
  let compression = null;
  if (width !== null && width > 1e-6 && gapCenter !== null) {
    compression = clamp012(1 - gapCenter / (0.35 * width));
  }
  let protrusion = null;
  if (isFiniteVec3(uC) && isFiniteVec3(lC)) {
    const lipZ = (uC.z + lC.z) * 0.5;
    const cheekL = local.cheekLeft;
    const cheekR = local.cheekRight;
    if (isFiniteVec3(cheekL) && isFiniteVec3(cheekR)) {
      const refZ = (cheekL.z + cheekR.z) * 0.5;
      protrusion = lipZ - refZ;
    } else {
      protrusion = lipZ;
    }
  }
  const cornerLeft = mouthCenter && isFiniteVec3(cL) ? cL.y - mouthCenter.y : null;
  const cornerRight = mouthCenter && isFiniteVec3(cR) ? cR.y - mouthCenter.y : null;
  const asymmetry = cornerLeft !== null && cornerRight !== null ? cornerLeft - cornerRight : null;
  return {
    width: scalarFrom(width, faceConf, width === null ? 0 : 1),
    gapLeft: scalarFrom(gapLeft, faceConf, gapLeft === null ? 0 : 1),
    gapCenter: scalarFrom(gapCenter, faceConf, gapCenter === null ? 0 : 1),
    gapRight: scalarFrom(gapRight, faceConf, gapRight === null ? 0 : 1),
    upperContour,
    lowerContour,
    curvature: scalarFrom(curvature, faceConf, curvature === null ? 0 : 1),
    compression: scalarFrom(compression, faceConf, compression === null ? 0 : 1),
    protrusion: scalarFrom(protrusion, faceConf, protrusion === null ? 0 : 1),
    cornerLeft: scalarFrom(cornerLeft, faceConf, cornerLeft === null ? 0 : 1),
    cornerRight: scalarFrom(cornerRight, faceConf, cornerRight === null ? 0 : 1),
    asymmetry: scalarFrom(asymmetry, faceConf, asymmetry === null ? 0 : 1)
  };
}
function extractEyes(local, faceConf) {
  const openL = gapAt(local.eyeUpperLeft, local.eyeLowerLeft);
  const openR = gapAt(local.eyeUpperRight, local.eyeLowerRight);
  const eyeCenterL = isFiniteVec3(local.eyeOuterLeft) && isFiniteVec3(local.eyeInnerLeft) ? {
    x: (local.eyeOuterLeft.x + local.eyeInnerLeft.x) * 0.5,
    y: (local.eyeOuterLeft.y + local.eyeInnerLeft.y) * 0.5,
    z: (local.eyeOuterLeft.z + local.eyeInnerLeft.z) * 0.5
  } : null;
  const eyeCenterR = isFiniteVec3(local.eyeOuterRight) && isFiniteVec3(local.eyeInnerRight) ? {
    x: (local.eyeOuterRight.x + local.eyeInnerRight.x) * 0.5,
    y: (local.eyeOuterRight.y + local.eyeInnerRight.y) * 0.5,
    z: (local.eyeOuterRight.z + local.eyeInnerRight.z) * 0.5
  } : null;
  const upperLidLeft = eyeCenterL && isFiniteVec3(local.eyeUpperLeft) ? local.eyeUpperLeft.y - eyeCenterL.y : null;
  const lowerLidLeft = eyeCenterL && isFiniteVec3(local.eyeLowerLeft) ? eyeCenterL.y - local.eyeLowerLeft.y : null;
  const upperLidRight = eyeCenterR && isFiniteVec3(local.eyeUpperRight) ? local.eyeUpperRight.y - eyeCenterR.y : null;
  const lowerLidRight = eyeCenterR && isFiniteVec3(local.eyeLowerRight) ? eyeCenterR.y - local.eyeLowerRight.y : null;
  return {
    eyeOpeningLeft: scalarFrom(openL, faceConf, openL === null ? 0 : 1),
    eyeOpeningRight: scalarFrom(openR, faceConf, openR === null ? 0 : 1),
    upperLidLeft: scalarFrom(upperLidLeft, faceConf, upperLidLeft === null ? 0 : 1),
    upperLidRight: scalarFrom(upperLidRight, faceConf, upperLidRight === null ? 0 : 1),
    lowerLidLeft: scalarFrom(lowerLidLeft, faceConf, lowerLidLeft === null ? 0 : 1),
    lowerLidRight: scalarFrom(lowerLidRight, faceConf, lowerLidRight === null ? 0 : 1)
  };
}
function extractBrows(local, faceConf) {
  function disp(brow, eyeRef) {
    if (!isFiniteVec3(brow) || !eyeRef) return null;
    return brow.y - eyeRef.y;
  }
  const eyeL = isFiniteVec3(local.eyeOuterLeft) && isFiniteVec3(local.eyeInnerLeft) ? {
    x: (local.eyeOuterLeft.x + local.eyeInnerLeft.x) * 0.5,
    y: (local.eyeOuterLeft.y + local.eyeInnerLeft.y) * 0.5,
    z: (local.eyeOuterLeft.z + local.eyeInnerLeft.z) * 0.5
  } : null;
  const eyeR = isFiniteVec3(local.eyeOuterRight) && isFiniteVec3(local.eyeInnerRight) ? {
    x: (local.eyeOuterRight.x + local.eyeInnerRight.x) * 0.5,
    y: (local.eyeOuterRight.y + local.eyeInnerRight.y) * 0.5,
    z: (local.eyeOuterRight.z + local.eyeInnerRight.z) * 0.5
  } : null;
  const iL = disp(local.browInnerLeft, eyeL);
  const mL = disp(local.browMidLeft, eyeL);
  const oL = disp(local.browOuterLeft, eyeL);
  const iR = disp(local.browInnerRight, eyeR);
  const mR = disp(local.browMidRight, eyeR);
  const oR = disp(local.browOuterRight, eyeR);
  return {
    innerLeft: scalarFrom(iL, faceConf, iL === null ? 0 : 1),
    midLeft: scalarFrom(mL, faceConf, mL === null ? 0 : 1),
    outerLeft: scalarFrom(oL, faceConf, oL === null ? 0 : 1),
    innerRight: scalarFrom(iR, faceConf, iR === null ? 0 : 1),
    midRight: scalarFrom(mR, faceConf, mR === null ? 0 : 1),
    outerRight: scalarFrom(oR, faceConf, oR === null ? 0 : 1)
  };
}
function extractCheeks(local, faceConf) {
  const eyeL = isFiniteVec3(local.eyeOuterLeft) && isFiniteVec3(local.eyeInnerLeft) ? {
    x: (local.eyeOuterLeft.x + local.eyeInnerLeft.x) * 0.5,
    y: (local.eyeOuterLeft.y + local.eyeInnerLeft.y) * 0.5,
    z: (local.eyeOuterLeft.z + local.eyeInnerLeft.z) * 0.5
  } : null;
  const eyeR = isFiniteVec3(local.eyeOuterRight) && isFiniteVec3(local.eyeInnerRight) ? {
    x: (local.eyeOuterRight.x + local.eyeInnerRight.x) * 0.5,
    y: (local.eyeOuterRight.y + local.eyeInnerRight.y) * 0.5,
    z: (local.eyeOuterRight.z + local.eyeInnerRight.z) * 0.5
  } : null;
  const raiseL = eyeL && isFiniteVec3(local.cheekLeft) ? local.cheekLeft.y - eyeL.y : null;
  const raiseR = eyeR && isFiniteVec3(local.cheekRight) ? local.cheekRight.y - eyeR.y : null;
  const compL = isFiniteVec3(local.cheekLeft) && isFiniteVec3(local.noseAlarLeft) ? 1 - Math.min(1, Math.abs(local.cheekLeft.x - local.noseAlarLeft.x) * 2) : null;
  const compR = isFiniteVec3(local.cheekRight) && isFiniteVec3(local.noseAlarRight) ? 1 - Math.min(1, Math.abs(local.cheekRight.x - local.noseAlarRight.x) * 2) : null;
  const volL = isFiniteVec3(local.cheekLeft) && isFiniteVec3(local.noseTip) ? local.cheekLeft.z - local.noseTip.z : isFiniteVec3(local.cheekLeft) ? local.cheekLeft.z : null;
  const volR = isFiniteVec3(local.cheekRight) && isFiniteVec3(local.noseTip) ? local.cheekRight.z - local.noseTip.z : isFiniteVec3(local.cheekRight) ? local.cheekRight.z : null;
  return {
    raiseLeft: scalarFrom(raiseL, faceConf, raiseL === null ? 0 : 1),
    raiseRight: scalarFrom(raiseR, faceConf, raiseR === null ? 0 : 1),
    compressionLeft: scalarFrom(compL, faceConf, compL === null ? 0 : 1),
    compressionRight: scalarFrom(compR, faceConf, compR === null ? 0 : 1),
    volumeProxyLeft: scalarFrom(volL, faceConf, volL === null ? 0 : 1),
    volumeProxyRight: scalarFrom(volR, faceConf, volR === null ? 0 : 1)
  };
}
function extractNose(local, faceConf) {
  const bridge = local.noseBridge;
  const tip = local.noseTip;
  const alarL = local.noseAlarLeft;
  const alarR = local.noseAlarRight;
  const nlL = local.nasolabialLeft;
  const nlR = local.nasolabialRight;
  const alarDispL = isFiniteVec3(alarL) && isFiniteVec3(tip) ? denseLocalDistance(alarL, tip) : null;
  const alarDispR = isFiniteVec3(alarR) && isFiniteVec3(tip) ? denseLocalDistance(alarR, tip) : null;
  const nlDispL = isFiniteVec3(nlL) && isFiniteVec3(bridge) ? denseLocalDistance(nlL, bridge) : isFiniteVec3(nlL) && isFiniteVec3(tip) ? denseLocalDistance(nlL, tip) : null;
  const nlDispR = isFiniteVec3(nlR) && isFiniteVec3(bridge) ? denseLocalDistance(nlR, bridge) : isFiniteVec3(nlR) && isFiniteVec3(tip) ? denseLocalDistance(nlR, tip) : null;
  const width = isFiniteVec3(alarL) && isFiniteVec3(alarR) ? denseLocalDistance(alarL, alarR) : null;
  return {
    alarLeft: scalarFrom(alarDispL, faceConf, alarDispL === null ? 0 : 1),
    alarRight: scalarFrom(alarDispR, faceConf, alarDispR === null ? 0 : 1),
    nasolabialLeft: scalarFrom(nlDispL, faceConf, nlDispL === null ? 0 : 1),
    nasolabialRight: scalarFrom(nlDispR, faceConf, nlDispR === null ? 0 : 1),
    width: scalarFrom(width, faceConf, width === null ? 0 : 1)
  };
}
function extractJaw(local, faceConf) {
  const chin = local.chin;
  const jawL = local.jawLeft;
  const jawR = local.jawRight;
  const mouth = isFiniteVec3(local.lipUpperCenter) && isFiniteVec3(local.lipLowerCenter) ? {
    x: (local.lipUpperCenter.x + local.lipLowerCenter.x) * 0.5,
    y: (local.lipUpperCenter.y + local.lipLowerCenter.y) * 0.5,
    z: (local.lipUpperCenter.z + local.lipLowerCenter.z) * 0.5
  } : null;
  const chinDrop = isFiniteVec3(chin) && mouth ? mouth.y - chin.y : isFiniteVec3(chin) ? -chin.y : null;
  const chinForward = isFiniteVec3(chin) ? chin.z : null;
  const jawWidth = isFiniteVec3(jawL) && isFiniteVec3(jawR) ? denseLocalDistance(jawL, jawR) : null;
  return {
    chinDrop: scalarFrom(chinDrop, faceConf, chinDrop === null ? 0 : 1),
    chinForward: scalarFrom(chinForward, faceConf, chinForward === null ? 0 : 1),
    jawWidth: scalarFrom(jawWidth, faceConf, jawWidth === null ? 0 : 1)
  };
}
function extractDenseFaceFeatures(input) {
  const faceConf = clamp012(input.geometry.faceConfidence);
  const frame = buildDenseFaceLocalFrame(input.geometry);
  if (frame.status !== "ok") {
    return createEmptyDenseFaceFeatures({
      sequence: input.sequence,
      timestampMs: input.timestampMs,
      faceConfidence: faceConf,
      normalizationStatus: frame.status
    });
  }
  const local = mapGeometryToDenseLocal(input.geometry, frame);
  const features = {
    contractVersion: LIVEACT_DENSE_FACE_FEATURES_CONTRACT,
    sequence: input.sequence,
    timestampMs: input.timestampMs,
    presence: true,
    normalizationStatus: "ok",
    faceConfidence: faceConf,
    lips: extractLips(local, faceConf),
    eyes: extractEyes(local, faceConf),
    brows: extractBrows(local, faceConf),
    cheeks: extractCheeks(local, faceConf),
    nose: extractNose(local, faceConf),
    jaw: extractJaw(local, faceConf)
  };
  return features;
}

// src/domains/character/liveact/liveact-iris-gaze-sphere.ts
var EPS = 1e-8;
function gazeVec3(x, y, z) {
  return { x, y, z };
}
function gazeAdd(a, b) {
  return gazeVec3(a.x + b.x, a.y + b.y, a.z + b.z);
}
function gazeSub(a, b) {
  return gazeVec3(a.x - b.x, a.y - b.y, a.z - b.z);
}
function gazeScale(a, s) {
  return gazeVec3(a.x * s, a.y * s, a.z * s);
}
function gazeDot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}
function gazeCross(a, b) {
  return gazeVec3(
    a.y * b.z - a.z * b.y,
    a.z * b.x - a.x * b.z,
    a.x * b.y - a.y * b.x
  );
}
function gazeLen(a) {
  return Math.hypot(a.x, a.y, a.z);
}
function gazeNormalize(a) {
  const l = gazeLen(a);
  if (!Number.isFinite(l) || l < EPS) return null;
  return gazeScale(a, 1 / l);
}
function irisEyeballRadiusFromHalfWidth(halfWidth) {
  if (!Number.isFinite(halfWidth) || halfWidth < EPS) return null;
  const maxYawRad = LIVEACT_IRIS_GAZE_MAX_YAW_DEG * Math.PI / 180;
  const s = Math.sin(maxYawRad);
  if (s < EPS) return null;
  return halfWidth / s;
}
function yawPitchDegFromGazeDirection(dir) {
  const n = gazeNormalize(dir);
  if (!n) return null;
  const yawDeg = Math.atan2(n.x, n.z) * 180 / Math.PI;
  const pitchDeg = Math.asin(Math.min(1, Math.max(-1, n.y))) * 180 / Math.PI;
  if (!Number.isFinite(yawDeg) || !Number.isFinite(pitchDeg)) return null;
  return { yawDeg, pitchDeg };
}
function solveGazeFromIrisOnSphere(frame, irisCenter) {
  const rel = gazeSub(irisCenter, frame.eyeballCenter);
  const dirWorld = gazeNormalize(rel);
  if (!dirWorld) return null;
  const lx = gazeDot(dirWorld, frame.axisX);
  const ly = gazeDot(dirWorld, frame.axisY);
  const lz = gazeDot(dirWorld, frame.axisZ);
  const dirLocal = gazeNormalize(gazeVec3(lx, ly, lz));
  if (!dirLocal) return null;
  const yp = yawPitchDegFromGazeDirection(dirLocal);
  if (!yp) return null;
  if (Math.abs(yp.yawDeg) > LIVEACT_IRIS_GAZE_MAX_YAW_DEG + 15) return null;
  if (Math.abs(yp.pitchDeg) > LIVEACT_IRIS_GAZE_MAX_PITCH_DEG + 15) return null;
  if (lz < -0.15) return null;
  return { yawDeg: yp.yawDeg, pitchDeg: yp.pitchDeg, direction: dirLocal };
}
function buildEyeSphereFrameFromCorners(input) {
  const { inner, outer, upper, lower, anatomicalLeft } = input;
  const origin = gazeScale(
    gazeAdd(gazeAdd(inner, outer), gazeAdd(upper, lower)),
    0.25
  );
  const xRaw = anatomicalLeft ? gazeSub(outer, inner) : gazeSub(inner, outer);
  const axisX = gazeNormalize(xRaw);
  if (!axisX) return null;
  let yCand = gazeSub(upper, lower);
  yCand = gazeSub(yCand, gazeScale(axisX, gazeDot(yCand, axisX)));
  let axisY = gazeNormalize(yCand);
  if (!axisY) return null;
  let axisZ = gazeNormalize(gazeCross(axisX, axisY));
  if (!axisZ) return null;
  if (gazeDot(axisZ, gazeVec3(0, 0, 1)) < 0) {
    axisZ = gazeScale(axisZ, -1);
  }
  axisY = gazeNormalize(gazeCross(axisZ, axisX));
  if (!axisY) return null;
  axisZ = gazeNormalize(gazeCross(axisX, axisY));
  if (!axisZ) return null;
  const halfWidth = gazeLen(gazeSub(outer, inner)) * 0.5;
  const halfHeight = gazeLen(gazeSub(upper, lower)) * 0.5;
  const radius = irisEyeballRadiusFromHalfWidth(halfWidth);
  if (!radius || halfHeight < EPS) return null;
  const maxYawRad = LIVEACT_IRIS_GAZE_MAX_YAW_DEG * Math.PI / 180;
  const depth = radius * Math.cos(maxYawRad);
  const eyeballCenter = gazeSub(origin, gazeScale(axisZ, depth));
  return {
    eyeOrigin: origin,
    axisX,
    axisY,
    axisZ,
    halfWidth,
    halfHeight,
    radius,
    eyeballCenter
  };
}
function planarApertureGazeFromIris(frame, irisCenter) {
  const rel = gazeSub(irisCenter, frame.eyeOrigin);
  const lx = gazeDot(rel, frame.axisX);
  const ly = gazeDot(rel, frame.axisY);
  if (frame.halfWidth < EPS || frame.halfHeight < EPS) return null;
  let x = lx / frame.halfWidth;
  let y = ly / frame.halfHeight;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  x = Math.min(1, Math.max(-1, x));
  y = Math.min(1, Math.max(-1, y));
  return { x, y };
}

// src/domains/character/liveact/liveact-iris-gaze-solve.ts
function asVec2(p) {
  if (!p.available) return null;
  if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.z)) return null;
  return { x: p.x, y: p.y, z: p.z };
}
function toDensePoint(p) {
  return { available: p.available, x: p.x, y: p.y, z: p.z };
}
function irisGeometryToDenseSemanticGeometry(geometry) {
  const missing = {
    available: false,
    x: Number.NaN,
    y: Number.NaN,
    z: Number.NaN
  };
  const points = {};
  for (const id of DENSE_SEMANTIC_POINT_IDS) points[id] = missing;
  points.eyeOuterLeft = toDensePoint(geometry.left.outerCorner);
  points.eyeInnerLeft = toDensePoint(geometry.left.innerCorner);
  points.eyeUpperLeft = toDensePoint(geometry.left.upperLid);
  points.eyeLowerLeft = toDensePoint(geometry.left.lowerLid);
  points.eyeOuterRight = toDensePoint(geometry.right.outerCorner);
  points.eyeInnerRight = toDensePoint(geometry.right.innerCorner);
  points.eyeUpperRight = toDensePoint(geometry.right.upperLid);
  points.eyeLowerRight = toDensePoint(geometry.right.lowerLid);
  points.forehead = toDensePoint(geometry.forehead);
  points.noseBridge = toDensePoint(geometry.noseBridge);
  points.noseTip = toDensePoint(geometry.noseTip);
  return {
    contractVersion: LIVEACT_DENSE_SEMANTIC_GEOMETRY_CONTRACT,
    points,
    faceConfidence: geometry.faceConfidence
  };
}
function faceLocalCorners(eye, faceFrame) {
  const innerW = asVec2(eye.innerCorner);
  const outerW = asVec2(eye.outerCorner);
  const upperW = asVec2(eye.upperLid);
  const lowerW = asVec2(eye.lowerLid);
  const irisW = asVec2(eye.irisCenter);
  if (!innerW || !outerW || !upperW || !lowerW || !irisW) return null;
  const inner = toDenseLocalPoint(innerW, faceFrame);
  const outer = toDenseLocalPoint(outerW, faceFrame);
  const upper = toDenseLocalPoint(upperW, faceFrame);
  const lower = toDenseLocalPoint(lowerW, faceFrame);
  const iris = toDenseLocalPoint(irisW, faceFrame);
  if (!inner || !outer || !upper || !lower || !iris) return null;
  return { inner, outer, upper, lower, iris };
}
function buildEyeSphere(eye, faceFrame, anatomicalLeft) {
  const c = faceLocalCorners(eye, faceFrame);
  if (!c) return null;
  const frame = buildEyeSphereFrameFromCorners({
    inner: gazeVec3(c.inner.x, c.inner.y, c.inner.z),
    outer: gazeVec3(c.outer.x, c.outer.y, c.outer.z),
    upper: gazeVec3(c.upper.x, c.upper.y, c.upper.z),
    lower: gazeVec3(c.lower.x, c.lower.y, c.lower.z),
    anatomicalLeft
  });
  if (!frame) return null;
  return { frame, iris: c.iris };
}
function solveOneEye(eye, faceFrame, anatomicalLeft, faceConf, neutralX, neutralY) {
  if (eye.irisContourAvailableCount < 4) {
    return unavailableIrisEyeGaze(faceConf * 0.2);
  }
  const built = buildEyeSphere(eye, faceFrame, anatomicalLeft);
  if (!built) return unavailableIrisEyeGaze(faceConf * 0.3);
  const solved = solveGazeFromIrisOnSphere(
    built.frame,
    gazeVec3(built.iris.x, built.iris.y, built.iris.z)
  );
  if (!solved) return unavailableIrisEyeGaze(faceConf * 0.3);
  const planar = planarApertureGazeFromIris(
    built.frame,
    gazeVec3(built.iris.x, built.iris.y, built.iris.z)
  );
  if (!planar || Math.abs(planar.x) > 1.35 || Math.abs(planar.y) > 1.35) {
    return unavailableIrisEyeGaze(faceConf * 0.25);
  }
  let { x, y } = yawPitchToNormalizedGaze(solved.yawDeg, solved.pitchDeg);
  x = Math.min(1, Math.max(-1, x - neutralX));
  y = Math.min(1, Math.max(-1, y - neutralY));
  const outYaw = x * LIVEACT_IRIS_GAZE_MAX_YAW_DEG;
  const outPitch = y * LIVEACT_IRIS_GAZE_MAX_PITCH_DEG;
  const geomAvail = eye.irisContourAvailableCount / 4;
  const confidence = Math.min(
    1,
    Math.max(0, faceConf * geomAvail * (faceFrame.status === "ok" ? 1 : 0.2))
  );
  return {
    available: true,
    yawDeg: outYaw,
    pitchDeg: outPitch,
    x,
    y,
    confidence
  };
}
function solveIrisGaze(input) {
  const neutral = input.neutral ?? LIVEACT_IRIS_GAZE_NEUTRAL_ZERO;
  const dense = irisGeometryToDenseSemanticGeometry(input.geometry);
  const faceFrame = buildDenseFaceLocalFrame(dense);
  const faceConf = typeof input.geometry.faceConfidence === "number" && Number.isFinite(input.geometry.faceConfidence) ? Math.min(1, Math.max(0, input.geometry.faceConfidence)) : 0;
  if (faceFrame.status !== "ok") {
    return {
      contractVersion: LIVEACT_IRIS_GAZE_CONTRACT,
      sequence: input.sequence,
      timestampMs: input.timestampMs,
      left: unavailableIrisEyeGaze(faceConf),
      right: unavailableIrisEyeGaze(faceConf),
      fallbackState: "unavailable",
      binocularYawDisagreementDeg: null,
      binocularPitchDisagreementDeg: null,
      faceNormalizationOk: false
    };
  }
  const left = solveOneEye(
    input.geometry.left,
    faceFrame,
    true,
    faceConf,
    neutral.leftX,
    neutral.leftY
  );
  const right = solveOneEye(
    input.geometry.right,
    faceFrame,
    false,
    faceConf,
    neutral.rightX,
    neutral.rightY
  );
  let binocularYawDisagreementDeg = null;
  let binocularPitchDisagreementDeg = null;
  if (left.available && right.available && left.yawDeg !== null && right.yawDeg !== null && left.pitchDeg !== null && right.pitchDeg !== null) {
    binocularYawDisagreementDeg = Math.abs(left.yawDeg - right.yawDeg);
    binocularPitchDisagreementDeg = Math.abs(left.pitchDeg - right.pitchDeg);
  }
  return {
    contractVersion: LIVEACT_IRIS_GAZE_CONTRACT,
    sequence: input.sequence,
    timestampMs: input.timestampMs,
    left,
    right,
    fallbackState: "iris",
    binocularYawDisagreementDeg,
    binocularPitchDisagreementDeg,
    faceNormalizationOk: true
  };
}
function arbitrateLiveActGaze(input) {
  const minC = input.minConfidence ?? LIVEACT_IRIS_GAZE_MIN_CONFIDENCE;
  const iris = input.iris;
  if (!iris || !iris.faceNormalizationOk) {
    return {
      ...input.blendshape,
      fallbackState: "blendshape",
      iris
    };
  }
  const useLeft = iris.left.available && iris.left.x !== null && iris.left.y !== null && iris.left.confidence >= minC;
  const useRight = iris.right.available && iris.right.x !== null && iris.right.y !== null && iris.right.confidence >= minC;
  if (!useLeft && !useRight) {
    return { ...input.blendshape, fallbackState: "blendshape", iris };
  }
  const eyeLeftX = useLeft ? iris.left.x : input.blendshape.eyeLeftX;
  const eyeLeftY = useLeft ? iris.left.y : input.blendshape.eyeLeftY;
  const eyeRightX = useRight ? iris.right.x : input.blendshape.eyeRightX;
  const eyeRightY = useRight ? iris.right.y : input.blendshape.eyeRightY;
  let fallbackState = "iris";
  if (useLeft && useRight) fallbackState = "iris";
  else if (useLeft || useRight) fallbackState = "mixed";
  else fallbackState = "blendshape";
  return {
    eyeLeftX,
    eyeLeftY,
    eyeRightX,
    eyeRightY,
    fallbackState,
    iris: {
      ...iris,
      fallbackState
    }
  };
}
function mirrorIrisGaze(gaze) {
  const flipEye = (e) => {
    if (!e.available || e.x === null || e.y === null || e.yawDeg === null || e.pitchDeg === null) {
      return e;
    }
    return {
      available: e.available,
      yawDeg: -e.yawDeg,
      pitchDeg: e.pitchDeg,
      x: -e.x,
      y: e.y,
      confidence: e.confidence
    };
  };
  return {
    ...gaze,
    left: flipEye(gaze.right),
    right: flipEye(gaze.left),
    binocularYawDisagreementDeg: gaze.binocularYawDisagreementDeg,
    binocularPitchDisagreementDeg: gaze.binocularPitchDisagreementDeg
  };
}

// src/domains/character/liveact/liveact-hybrid-face-fusion.ts
function clamp014(n) {
  if (!Number.isFinite(n)) return 0;
  if (n <= 0) return 0;
  if (n >= 1) return 1;
  return n;
}
function readSemantic(face, id) {
  const v2 = face[id];
  if (typeof v2 !== "number" || !Number.isFinite(v2)) return null;
  return clamp014(v2);
}
function denseScalar(f) {
  if (!f || !f.available || f.value === null || !Number.isFinite(f.value)) {
    return { available: false, value: null, confidence: f?.confidence ?? 0 };
  }
  return {
    available: true,
    value: f.value,
    confidence: clamp014(f.confidence)
  };
}
function denseActivationFromSigned(value, available, positiveMeansActive = true) {
  if (!available || value === null || !Number.isFinite(value)) return null;
  const signed = positiveMeansActive ? value : -value;
  return clamp014(signed * 2.2);
}
function fuseSemanticDense(input) {
  const sem = input.semantic;
  const dense = input.denseEvidence;
  const dConf = clamp014(input.denseConfidence);
  const sConf = input.semanticConfidence !== void 0 ? clamp014(input.semanticConfidence) : sem === null ? 0 : 0.85;
  if (sem === null && (dense === null || dConf < LIVEACT_HYBRID_DENSE_MIN_CONFIDENCE)) {
    return unavailableHybridControl(null);
  }
  if (dense === null || dConf < LIVEACT_HYBRID_DENSE_MIN_CONFIDENCE) {
    return semanticPassthroughControl(sem, sConf);
  }
  if (sem === null) {
    if (input.allowDenseOnly && dConf >= LIVEACT_HYBRID_DENSE_MIN_CONFIDENCE) {
      return {
        value: clamp014(dense),
        confidence: dConf * 0.85,
        source: "dense",
        semanticInput: null,
        denseEvidence: clamp014(dense)
      };
    }
    return unavailableHybridControl(null);
  }
  const s = clamp014(sem);
  const d = clamp014(dense);
  const diff = Math.abs(s - d);
  const agree = diff <= LIVEACT_HYBRID_DISAGREE_ABS;
  if (!agree && s >= 0.45 && sConf >= 0.7 && dConf >= 0.7) {
    return {
      value: s,
      confidence: clamp014(Math.min(sConf, dConf) * 0.55),
      source: "semantic",
      semanticInput: s,
      denseEvidence: d
    };
  }
  if (s < d - 0.12 && dConf >= LIVEACT_HYBRID_DENSE_MIN_CONFIDENCE) {
    const w2 = clamp014(dConf * 0.75);
    const value2 = clamp014(s * (1 - w2 * 0.7) + d * (w2 * 0.7));
    return {
      value: value2,
      confidence: clamp014(0.4 * sConf + 0.6 * dConf),
      source: "hybrid",
      semanticInput: s,
      denseEvidence: d
    };
  }
  if (s > d + 0.15 && dConf >= LIVEACT_HYBRID_DENSE_MIN_CONFIDENCE) {
    const w2 = clamp014(dConf * 0.55);
    const value2 = clamp014(s * (1 - w2) + d * w2);
    return {
      value: value2,
      confidence: clamp014(0.55 * sConf + 0.45 * dConf),
      source: "hybrid",
      semanticInput: s,
      denseEvidence: d
    };
  }
  if (agree) {
    const nudge = (d - s) * 0.12 * dConf;
    const value2 = clamp014(s + nudge);
    return {
      value: value2,
      confidence: clamp014(Math.max(sConf, 0.4 * sConf + 0.6 * dConf)),
      source: Math.abs(nudge) > 1e-4 ? "hybrid" : "semantic",
      semanticInput: s,
      denseEvidence: d
    };
  }
  const w = clamp014(dConf / (sConf + dConf + 1e-6)) * 0.4;
  const value = clamp014(s * (1 - w) + d * w);
  return {
    value,
    confidence: clamp014(0.45 * sConf + 0.45 * dConf),
    source: "hybrid",
    semanticInput: s,
    denseEvidence: d
  };
}
function combineDenseEvidence(parts, mode = "max") {
  const ok = parts.filter((p) => p.available && p.value !== null);
  if (ok.length === 0) return { value: null, confidence: 0 };
  if (mode === "max") {
    let best = ok[0];
    for (const p of ok) {
      if ((p.value ?? 0) > (best.value ?? 0)) best = p;
    }
    return { value: clamp014(best.value), confidence: clamp014(best.confidence) };
  }
  let sum = 0;
  let cSum = 0;
  for (const p of ok) {
    sum += p.value;
    cSum += p.confidence;
  }
  return {
    value: clamp014(sum / ok.length),
    confidence: clamp014(cSum / ok.length)
  };
}

// src/domains/character/liveact/liveact-hybrid-face-solve.ts
function ctrl(map, id, result) {
  map[id] = result;
}
function solveHybridFace(input) {
  const empty = createEmptyHybridFace({
    sequence: input.sequence,
    timestampMs: input.timestampMs
  });
  const dense = input.dense;
  const denseSeq = typeof input.denseSequence === "number" ? input.denseSequence : dense?.sequence;
  const aligned = dense !== null && dense.presence && dense.normalizationStatus === "ok" && denseSeq === input.sequence;
  const controls = {};
  if (!aligned || !dense) {
    for (const id of LIVEACT_HYBRID_FACE_CONTROL_IDS) {
      ctrl(controls, id, fuseSemanticDense({
        semantic: readSemantic(input.semanticFace, id),
        denseEvidence: null,
        denseConfidence: 0
      }));
    }
    return {
      contractVersion: LIVEACT_HYBRID_FACE_CONTRACT,
      sequence: input.sequence,
      timestampMs: input.timestampMs,
      presence: Object.values(controls).some((c) => c.value !== null),
      denseSequenceAligned: false,
      controls
    };
  }
  const lips = dense.lips;
  const cheeks = dense.cheeks;
  const nose = dense.nose;
  const jaw = dense.jaw;
  const cornerL = denseScalar(lips.cornerLeft);
  const cornerR = denseScalar(lips.cornerRight);
  const curv = denseScalar(lips.curvature);
  const raiseL = denseScalar(cheeks.raiseLeft);
  const raiseR = denseScalar(cheeks.raiseRight);
  const cornerActL = denseActivationFromSigned(cornerL.value, cornerL.available);
  const cornerActR = denseActivationFromSigned(cornerR.value, cornerR.available);
  const sideActive = (cornerAct, raise) => cornerAct !== null && cornerAct > 0.08 || raise.available && (raise.value ?? 0) > 0.08;
  const smileDenseL = combineDenseEvidence(
    [
      {
        available: cornerL.available,
        value: cornerActL,
        confidence: cornerL.confidence
      },
      {
        available: raiseL.available,
        value: raiseL.available && raiseL.value !== null ? clamp014(raiseL.value) : null,
        confidence: raiseL.confidence
      },
      {
        available: curv.available && sideActive(cornerActL, raiseL),
        value: denseActivationFromSigned(curv.value, curv.available),
        confidence: curv.confidence * 0.55
      }
    ],
    "mean"
  );
  const smileDenseR = combineDenseEvidence(
    [
      {
        available: cornerR.available,
        value: cornerActR,
        confidence: cornerR.confidence
      },
      {
        available: raiseR.available,
        value: raiseR.available && raiseR.value !== null ? clamp014(raiseR.value) : null,
        confidence: raiseR.confidence
      },
      {
        available: curv.available && sideActive(cornerActR, raiseR),
        value: denseActivationFromSigned(curv.value, curv.available),
        confidence: curv.confidence * 0.55
      }
    ],
    "mean"
  );
  ctrl(
    controls,
    "mouthSmileLeft",
    fuseSemanticDense({
      semantic: readSemantic(input.semanticFace, "mouthSmileLeft"),
      denseEvidence: smileDenseL.value,
      denseConfidence: smileDenseL.confidence,
      allowDenseOnly: true
    })
  );
  ctrl(
    controls,
    "mouthSmileRight",
    fuseSemanticDense({
      semantic: readSemantic(input.semanticFace, "mouthSmileRight"),
      denseEvidence: smileDenseR.value,
      denseConfidence: smileDenseR.confidence,
      allowDenseOnly: true
    })
  );
  const width = denseScalar(lips.width);
  const protrude = denseScalar(lips.protrusion);
  const compress = denseScalar(lips.compression);
  const gapC = denseScalar(lips.gapCenter);
  const puckerGate = protrude.available && (protrude.value ?? 0) > 0.12 || compress.available && (compress.value ?? 0) > 0.12;
  const puckerDense = combineDenseEvidence(
    [
      {
        available: protrude.available,
        value: protrude.value !== null ? clamp014(protrude.value) : null,
        confidence: protrude.confidence
      },
      {
        available: compress.available,
        value: compress.value !== null ? clamp014(compress.value) : null,
        confidence: compress.confidence
      },
      {
        available: puckerGate && gapC.available && gapC.value !== null,
        value: gapC.value !== null ? clamp014(1 - gapC.value) : null,
        confidence: gapC.confidence * 0.45
      }
    ],
    "mean"
  );
  const funnelGate = gapC.available && (gapC.value ?? 0) > 0.08 || protrude.available && (protrude.value ?? 0) > 0.12;
  const funnelDense = combineDenseEvidence(
    [
      {
        available: funnelGate && protrude.available,
        value: protrude.value !== null ? clamp014(protrude.value * 0.9) : null,
        confidence: protrude.confidence
      },
      {
        available: funnelGate && gapC.available,
        value: gapC.value !== null ? clamp014(gapC.value) : null,
        confidence: gapC.confidence
      }
    ],
    "mean"
  );
  ctrl(
    controls,
    "mouthPucker",
    fuseSemanticDense({
      semantic: readSemantic(input.semanticFace, "mouthPucker"),
      denseEvidence: puckerDense.value,
      denseConfidence: puckerDense.confidence
    })
  );
  ctrl(
    controls,
    "mouthFunnel",
    fuseSemanticDense({
      semantic: readSemantic(input.semanticFace, "mouthFunnel"),
      denseEvidence: funnelDense.value,
      denseConfidence: funnelDense.confidence
    })
  );
  const gapL = denseScalar(lips.gapLeft);
  const gapR = denseScalar(lips.gapRight);
  const pressCompressActive = compress.available && compress.value !== null && compress.value > 0.12;
  const pressDenseL = combineDenseEvidence(
    [
      {
        available: pressCompressActive,
        value: compress.value,
        confidence: compress.confidence
      },
      {
        available: pressCompressActive && gapL.available && gapL.value !== null,
        value: gapL.value !== null ? clamp014(1 - gapL.value) : null,
        confidence: gapL.confidence * 0.55
      }
    ],
    "mean"
  );
  const pressDenseR = combineDenseEvidence(
    [
      {
        available: pressCompressActive,
        value: compress.value,
        confidence: compress.confidence
      },
      {
        available: pressCompressActive && gapR.available && gapR.value !== null,
        value: gapR.value !== null ? clamp014(1 - gapR.value) : null,
        confidence: gapR.confidence * 0.55
      }
    ],
    "mean"
  );
  ctrl(
    controls,
    "mouthPressLeft",
    fuseSemanticDense({
      semantic: readSemantic(input.semanticFace, "mouthPressLeft"),
      denseEvidence: pressDenseL.value,
      denseConfidence: pressDenseL.confidence
    })
  );
  ctrl(
    controls,
    "mouthPressRight",
    fuseSemanticDense({
      semantic: readSemantic(input.semanticFace, "mouthPressRight"),
      denseEvidence: pressDenseR.value,
      denseConfidence: pressDenseR.confidence
    })
  );
  const upperConf = lips.upperContour.available ? lips.upperContour.confidence : 0;
  const lowerConf = lips.lowerContour.available ? lips.lowerContour.confidence : 0;
  const rollCompressActive = compress.available && compress.value !== null && compress.value > 0.12;
  const rollUpperDense = lips.upperContour.available && rollCompressActive ? {
    value: clamp014(
      ((compress.value ?? 0) + (gapC.available && gapC.value !== null ? 1 - gapC.value : 0)) / 2
    ),
    confidence: clamp014(0.5 * upperConf + 0.5 * compress.confidence)
  } : { value: null, confidence: 0 };
  const rollLowerDense = lips.lowerContour.available && rollCompressActive ? {
    value: clamp014(
      ((compress.value ?? 0) + (gapC.available && gapC.value !== null ? 1 - gapC.value : 0)) / 2
    ),
    confidence: clamp014(0.5 * lowerConf + 0.5 * compress.confidence)
  } : { value: null, confidence: 0 };
  ctrl(
    controls,
    "mouthRollUpper",
    fuseSemanticDense({
      semantic: readSemantic(input.semanticFace, "mouthRollUpper"),
      denseEvidence: rollUpperDense.value,
      denseConfidence: rollUpperDense.confidence
    })
  );
  ctrl(
    controls,
    "mouthRollLower",
    fuseSemanticDense({
      semantic: readSemantic(input.semanticFace, "mouthRollLower"),
      denseEvidence: rollLowerDense.value,
      denseConfidence: rollLowerDense.confidence
    })
  );
  const upperStations = lips.upperContour.stations;
  const lowerStations = lips.lowerContour.stations;
  const stationAct = (stations, index, conf2) => {
    if (!stations) return { value: null, confidence: 0 };
    const s = stations[index];
    if (!s || !s.available || s.value === null) return { value: null, confidence: 0 };
    return {
      value: clamp014(Math.abs(s.value) * 2),
      confidence: clamp014(Math.min(conf2, s.confidence))
    };
  };
  const upL = stationAct(upperStations, 1, upperConf);
  const upR = stationAct(upperStations, 3, upperConf);
  const lowL = stationAct(lowerStations, 1, lowerConf);
  const lowR = stationAct(lowerStations, 3, lowerConf);
  ctrl(
    controls,
    "mouthUpperUpLeft",
    fuseSemanticDense({
      semantic: readSemantic(input.semanticFace, "mouthUpperUpLeft"),
      denseEvidence: upL.value,
      denseConfidence: upL.confidence
    })
  );
  ctrl(
    controls,
    "mouthUpperUpRight",
    fuseSemanticDense({
      semantic: readSemantic(input.semanticFace, "mouthUpperUpRight"),
      denseEvidence: upR.value,
      denseConfidence: upR.confidence
    })
  );
  ctrl(
    controls,
    "mouthLowerDownLeft",
    fuseSemanticDense({
      semantic: readSemantic(input.semanticFace, "mouthLowerDownLeft"),
      denseEvidence: lowL.value,
      denseConfidence: lowL.confidence
    })
  );
  ctrl(
    controls,
    "mouthLowerDownRight",
    fuseSemanticDense({
      semantic: readSemantic(input.semanticFace, "mouthLowerDownRight"),
      denseEvidence: lowR.value,
      denseConfidence: lowR.confidence
    })
  );
  const compL = denseScalar(cheeks.compressionLeft);
  const compR = denseScalar(cheeks.compressionRight);
  const volL = denseScalar(cheeks.volumeProxyLeft);
  const volR = denseScalar(cheeks.volumeProxyRight);
  ctrl(
    controls,
    "cheekSquintLeft",
    fuseSemanticDense({
      semantic: readSemantic(input.semanticFace, "cheekSquintLeft"),
      denseEvidence: combineDenseEvidence(
        [
          {
            available: raiseL.available,
            value: raiseL.value !== null ? clamp014(raiseL.value) : null,
            confidence: raiseL.confidence
          },
          {
            available: compL.available,
            value: compL.value !== null ? clamp014(compL.value) : null,
            confidence: compL.confidence * 0.7
          }
        ],
        "mean"
      ).value,
      denseConfidence: Math.max(raiseL.confidence, compL.confidence * 0.7)
    })
  );
  ctrl(
    controls,
    "cheekSquintRight",
    fuseSemanticDense({
      semantic: readSemantic(input.semanticFace, "cheekSquintRight"),
      denseEvidence: combineDenseEvidence(
        [
          {
            available: raiseR.available,
            value: raiseR.value !== null ? clamp014(raiseR.value) : null,
            confidence: raiseR.confidence
          },
          {
            available: compR.available,
            value: compR.value !== null ? clamp014(compR.value) : null,
            confidence: compR.confidence * 0.7
          }
        ],
        "mean"
      ).value,
      denseConfidence: Math.max(raiseR.confidence, compR.confidence * 0.7)
    })
  );
  const puffDense = combineDenseEvidence(
    [
      {
        available: volL.available || volR.available,
        value: clamp014(((volL.value ?? 0) + (volR.value ?? 0)) / 2),
        confidence: clamp014((volL.confidence + volR.confidence) / 2)
      },
      {
        available: compL.available || compR.available,
        value: clamp014(((compL.value ?? 0) + (compR.value ?? 0)) / 2),
        confidence: clamp014((compL.confidence + compR.confidence) / 2) * 0.6
      }
    ],
    "mean"
  );
  ctrl(
    controls,
    "cheekPuff",
    fuseSemanticDense({
      semantic: readSemantic(input.semanticFace, "cheekPuff"),
      denseEvidence: puffDense.value,
      denseConfidence: puffDense.confidence
    })
  );
  const alarL = denseScalar(nose.alarLeft);
  const alarR = denseScalar(nose.alarRight);
  const nlL = denseScalar(nose.nasolabialLeft);
  const nlR = denseScalar(nose.nasolabialRight);
  ctrl(
    controls,
    "noseSneerLeft",
    fuseSemanticDense({
      semantic: readSemantic(input.semanticFace, "noseSneerLeft"),
      denseEvidence: combineDenseEvidence(
        [
          {
            available: alarL.available,
            value: alarL.value !== null ? clamp014(alarL.value) : null,
            confidence: alarL.confidence
          },
          {
            available: nlL.available,
            value: nlL.value !== null ? clamp014(nlL.value) : null,
            confidence: nlL.confidence * 0.8
          }
        ],
        "mean"
      ).value,
      denseConfidence: Math.max(alarL.confidence, nlL.confidence * 0.8)
    })
  );
  ctrl(
    controls,
    "noseSneerRight",
    fuseSemanticDense({
      semantic: readSemantic(input.semanticFace, "noseSneerRight"),
      denseEvidence: combineDenseEvidence(
        [
          {
            available: alarR.available,
            value: alarR.value !== null ? clamp014(alarR.value) : null,
            confidence: alarR.confidence
          },
          {
            available: nlR.available,
            value: nlR.value !== null ? clamp014(nlR.value) : null,
            confidence: nlR.confidence * 0.8
          }
        ],
        "mean"
      ).value,
      denseConfidence: Math.max(alarR.confidence, nlR.confidence * 0.8)
    })
  );
  void jaw;
  const jawOpenGapActive = gapC.available && gapC.value !== null && gapC.value > 0.08;
  const jawOpenDense = jawOpenGapActive ? {
    value: clamp014(gapC.value),
    confidence: gapC.confidence
  } : { value: null, confidence: 0 };
  ctrl(
    controls,
    "jawOpen",
    fuseSemanticDense({
      semantic: readSemantic(input.semanticFace, "jawOpen"),
      denseEvidence: jawOpenDense.value,
      denseConfidence: jawOpenDense.confidence
    })
  );
  ctrl(
    controls,
    "jawForward",
    fuseSemanticDense({
      semantic: readSemantic(input.semanticFace, "jawForward"),
      denseEvidence: null,
      denseConfidence: 0
    })
  );
  void width;
  void empty;
  return {
    contractVersion: LIVEACT_HYBRID_FACE_CONTRACT,
    sequence: input.sequence,
    timestampMs: input.timestampMs,
    presence: true,
    denseSequenceAligned: true,
    controls
  };
}
function applyHybridFaceToSemantic(semanticFace, hybrid) {
  const out = { ...semanticFace };
  for (const id of LIVEACT_HYBRID_FACE_CONTROL_IDS) {
    const c = hybrid.controls[id];
    if (c.value !== null && Number.isFinite(c.value)) {
      out[id] = c.value;
    }
  }
  return out;
}

// src/domains/character/liveact/liveact-personal-calibration-store.ts
function getLocalStorage() {
  if (typeof globalThis === "undefined") return null;
  try {
    const ls = globalThis.localStorage;
    if (!ls || typeof ls.getItem !== "function") return null;
    return ls;
  } catch {
    return null;
  }
}
function isProfileShape(value) {
  if (!value || typeof value !== "object") return false;
  const p = value;
  return p.contractVersion === LIVEACT_PERSONAL_CALIBRATION_CONTRACT && typeof p.policyVersion === "string" && typeof p.solverFingerprint === "object" && typeof p.ownerLocalId === "string" && typeof p.characterLocalId === "string" && typeof p.head === "object" && typeof p.gaze === "object" && typeof p.channels === "object" && typeof p.speech === "object";
}
function scopeFromProfile(profile) {
  return {
    ownerLocalId: profile.ownerLocalId,
    characterLocalId: profile.characterLocalId
  };
}
function saveLiveActPersonalCalibrationProfile(profile) {
  assertLiveActPersonalProfileLocalOnly(profile);
  const scope = scopeFromProfile(profile);
  if (!isLiveActPersonalCalibrationScopeComplete(scope)) {
    return false;
  }
  const ls = getLocalStorage();
  if (!ls) return false;
  const key = liveActPersonalCalibrationStorageKey(scope);
  try {
    ls.setItem(key, JSON.stringify(profile));
    return true;
  } catch {
    return false;
  }
}
function loadLiveActPersonalCalibrationProfile(scope) {
  if (!isLiveActPersonalCalibrationScopeComplete(scope)) {
    return { profile: null, status: "missing" };
  }
  const ls = getLocalStorage();
  if (!ls) return { profile: null, status: "missing" };
  const key = liveActPersonalCalibrationStorageKey(scope);
  try {
    const raw = ls.getItem(key);
    if (!raw) return { profile: null, status: "missing" };
    const parsed = JSON.parse(raw);
    if (!isProfileShape(parsed)) {
      return { profile: null, status: "incompatible" };
    }
    if (parsed.policyVersion !== LIVEACT_PERSONAL_CALIBRATION_POLICY_VERSION) {
      return { profile: parsed, status: "needsMigration" };
    }
    if (parsed.ownerLocalId !== scope.ownerLocalId || parsed.characterLocalId !== scope.characterLocalId) {
      return { profile: null, status: "incompatible" };
    }
    const status = resolveLiveActPersonalProfileStatus(parsed);
    return { profile: parsed, status };
  } catch {
    return { profile: null, status: "incompatible" };
  }
}

// src/domains/character/liveact/liveact-performance-face-contract.ts
var PERFORMANCE_FACE_REQUIRED_PREMIUM_CONTROLS = [
  "nasolabialFoldLeft",
  "nasolabialFoldRight",
  "cheekVolumeLeft",
  "cheekVolumeRight",
  "lipContourUpperLeft",
  "lipContourUpperRight",
  "lipContourLowerLeft",
  "lipContourLowerRight"
];
var PERFORMANCE_FACE_OPTIONAL_PREMIUM_CONTROLS = [
  "lidTightenLeft",
  "lidTightenRight"
];
var PERFORMANCE_FACE_ALL_CONTROLS = [
  ...PERFORMANCE_FACE_REQUIRED_PREMIUM_CONTROLS,
  ...PERFORMANCE_FACE_OPTIONAL_PREMIUM_CONTROLS
];
function clampPerformanceFaceWeight(value) {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

// src/domains/character/liveact/liveact-performance-face-aliases.ts
function pascalCase2(id) {
  if (!id.length) return id;
  return id.charAt(0).toUpperCase() + id.slice(1);
}
function aliasesForControl(id) {
  const list = [id, pascalCase2(id)];
  const underscored = id.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
  if (underscored !== id) list.push(underscored);
  return list;
}
var PERFORMANCE_FACE_TARGET_ALIASES = Object.fromEntries(
  PERFORMANCE_FACE_ALL_CONTROLS.map((id) => [id, aliasesForControl(id)])
);

// src/domains/character/liveact/liveact-performance-face-drive.ts
function hybridOrFace(hybrid, face, hybridKey, faceKey2) {
  const h = hybrid?.controls[hybridKey];
  if (h && typeof h.value === "number" && Number.isFinite(h.value)) {
    return clampPerformanceFaceWeight(h.value);
  }
  if (face && typeof face[faceKey2] === "number") {
    return clampLiveActChannel(face[faceKey2]);
  }
  return 0;
}
function max2(a, b) {
  return a >= b ? a : b;
}
function drivePerformanceFaceWeights(input) {
  const { hybrid, face } = input;
  const out = {
    nasolabialFoldLeft: hybridOrFace(hybrid, face, "noseSneerLeft", "noseSneerLeft"),
    nasolabialFoldRight: hybridOrFace(hybrid, face, "noseSneerRight", "noseSneerRight"),
    cheekVolumeLeft: max2(
      hybridOrFace(hybrid, face, "cheekSquintLeft", "cheekSquintLeft"),
      hybridOrFace(hybrid, face, "cheekPuff", "cheekPuff") * 0.85
    ),
    cheekVolumeRight: max2(
      hybridOrFace(hybrid, face, "cheekSquintRight", "cheekSquintRight"),
      hybridOrFace(hybrid, face, "cheekPuff", "cheekPuff") * 0.85
    ),
    lipContourUpperLeft: hybridOrFace(
      hybrid,
      face,
      "mouthUpperUpLeft",
      "mouthUpperUpLeft"
    ),
    lipContourUpperRight: hybridOrFace(
      hybrid,
      face,
      "mouthUpperUpRight",
      "mouthUpperUpRight"
    ),
    lipContourLowerLeft: hybridOrFace(
      hybrid,
      face,
      "mouthLowerDownLeft",
      "mouthLowerDownLeft"
    ),
    lipContourLowerRight: hybridOrFace(
      hybrid,
      face,
      "mouthLowerDownRight",
      "mouthLowerDownRight"
    ),
    lidTightenLeft: face ? clampLiveActChannel(face.eyeSquintLeft) : 0,
    lidTightenRight: face ? clampLiveActChannel(face.eyeSquintRight) : 0
  };
  for (const id of PERFORMANCE_FACE_ALL_CONTROLS) {
    const w = out[id];
    if (w === void 0) continue;
    out[id] = clampPerformanceFaceWeight(w);
  }
  return out;
}

// src/infrastructure/character/liveact/liveact-face-diagnostics.ts
function toPoint2d(landmarks, index) {
  const hit = landmarks[index];
  const x = typeof hit?.x === "number" && Number.isFinite(hit.x) ? hit.x : 0;
  const y = typeof hit?.y === "number" && Number.isFinite(hit.y) ? hit.y : 0;
  return { x, y };
}
function polylineFromConnections(landmarks, connections) {
  const out = [];
  for (const edge of connections) {
    if (typeof edge.start !== "number" || typeof edge.end !== "number") continue;
    out.push(toPoint2d(landmarks, edge.start));
    out.push(toPoint2d(landmarks, edge.end));
  }
  return out;
}
function mapMediaPipeLandmarksToLiveActDiagnostics(input) {
  if (input.trackingLost || !input.landmarks || input.landmarks.length === 0) {
    return createEmptyLiveActFaceDiagnosticsFrame({
      timestampMs: input.timestampMs,
      sequence: input.sequence
    });
  }
  const landmarks = input.landmarks.map((lm) => ({
    x: typeof lm.x === "number" && Number.isFinite(lm.x) ? lm.x : 0,
    y: typeof lm.y === "number" && Number.isFinite(lm.y) ? lm.y : 0
  }));
  const contours = {
    faceOval: polylineFromConnections(input.landmarks, input.connections.faceOval),
    lips: polylineFromConnections(input.landmarks, input.connections.lips),
    leftEye: polylineFromConnections(input.landmarks, input.connections.leftEye),
    rightEye: polylineFromConnections(input.landmarks, input.connections.rightEye),
    leftEyebrow: polylineFromConnections(input.landmarks, input.connections.leftEyebrow),
    rightEyebrow: polylineFromConnections(input.landmarks, input.connections.rightEyebrow)
  };
  const frame = {
    contractVersion: "SagaTreeLiveActFaceDiagnosticsV1",
    timestampMs: input.timestampMs,
    sequence: input.sequence,
    trackingLost: false,
    faceIndex: input.faceIndex,
    faceCount: input.faceCount,
    landmarks,
    contours
  };
  assertLiveActFaceDiagnosticsLocalOnly(frame);
  return frame;
}

// src/infrastructure/character/liveact/mediapipe-sagatree-face-anchor-map-v1.ts
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

// src/infrastructure/character/liveact/mediapipe-dense-semantic-points-v1.ts
var ANCHOR_TO_DENSE = {
  eyeLeftOuter: "eyeOuterLeft",
  eyeLeftInner: "eyeInnerLeft",
  eyeLeftUpper: "eyeUpperLeft",
  eyeLeftLower: "eyeLowerLeft",
  eyeRightOuter: "eyeOuterRight",
  eyeRightInner: "eyeInnerRight",
  eyeRightUpper: "eyeUpperRight",
  eyeRightLower: "eyeLowerRight",
  browLeftInner: "browInnerLeft",
  browLeftCenter: "browMidLeft",
  browLeftOuter: "browOuterLeft",
  browRightInner: "browInnerRight",
  browRightCenter: "browMidRight",
  browRightOuter: "browOuterRight",
  mouthCornerLeft: "mouthCornerLeft",
  mouthCornerRight: "mouthCornerRight",
  mouthUpper: "lipUpperCenter",
  mouthLower: "lipLowerCenter",
  noseTip: "noseTip",
  chin: "chin",
  forehead: "forehead"
};
var MEDIAPIPE_DENSE_EXTENSION_MAP_V1 = [
  // Upper lip stations (anatomical left → right)
  { pointId: "lipUpperOuterLeft", landmarkIndices: [291, 312], kind: "midpoint" },
  { pointId: "lipUpperInnerLeft", landmarkIndices: [311, 312], kind: "midpoint" },
  { pointId: "lipUpperInnerRight", landmarkIndices: [81, 82], kind: "midpoint" },
  { pointId: "lipUpperOuterRight", landmarkIndices: [61, 82], kind: "midpoint" },
  // Lower lip stations
  { pointId: "lipLowerOuterLeft", landmarkIndices: [291, 321], kind: "midpoint" },
  { pointId: "lipLowerInnerLeft", landmarkIndices: [321, 405], kind: "midpoint" },
  { pointId: "lipLowerInnerRight", landmarkIndices: [91, 181], kind: "midpoint" },
  { pointId: "lipLowerOuterRight", landmarkIndices: [61, 91], kind: "midpoint" },
  // Nose bridge / alar (tip already from anchors)
  { pointId: "noseBridge", landmarkIndices: [6, 168], kind: "midpoint" },
  { pointId: "noseAlarLeft", landmarkIndices: [129, 358], kind: "midpoint" },
  { pointId: "noseAlarRight", landmarkIndices: [102, 49], kind: "midpoint" },
  // Cheeks
  { pointId: "cheekLeft", landmarkIndices: [425, 427], kind: "midpoint" },
  { pointId: "cheekRight", landmarkIndices: [205, 207], kind: "midpoint" },
  // Nasolabial proxies
  { pointId: "nasolabialLeft", landmarkIndices: [410, 287], kind: "midpoint" },
  { pointId: "nasolabialRight", landmarkIndices: [186, 57], kind: "midpoint" },
  // Jaw
  { pointId: "jawLeft", landmarkIndices: [397, 365], kind: "midpoint" },
  { pointId: "jawRight", landmarkIndices: [172, 136], kind: "midpoint" }
];
function emptyPoint() {
  return { available: false, x: Number.NaN, y: Number.NaN, z: Number.NaN };
}
function resolveExtension(landmarks, entry) {
  const fake = {
    anchorId: "noseTip",
    landmarkIndices: entry.landmarkIndices,
    kind: entry.kind,
    rationale: "dense extension",
    expectedRegion: "mouth",
    laterality: "center"
  };
  const sample = resolveMediaPipeAnchorSample(landmarks, fake);
  if (!sample.available) return emptyPoint();
  let z = 0;
  let zCount = 0;
  for (const index of entry.landmarkIndices) {
    const lm = landmarks[index];
    if (lm && typeof lm.z === "number" && Number.isFinite(lm.z)) {
      z += lm.z;
      zCount += 1;
    }
  }
  return {
    available: true,
    x: sample.x,
    y: sample.y,
    z: zCount > 0 ? z / zCount : 0
  };
}
function resolveAnchorPoint(landmarks, entry) {
  const sample = resolveMediaPipeAnchorSample(landmarks, entry);
  if (!sample.available) return emptyPoint();
  let z = 0;
  let zCount = 0;
  for (const index of entry.landmarkIndices) {
    const lm = landmarks[index];
    if (lm && typeof lm.z === "number" && Number.isFinite(lm.z)) {
      z += lm.z;
      zCount += 1;
    }
  }
  return {
    available: true,
    x: sample.x,
    y: sample.y,
    z: zCount > 0 ? z / zCount : 0
  };
}
function mapMediaPipeLandmarksToDenseSemanticGeometry(input) {
  const points = {};
  for (const id of DENSE_SEMANTIC_POINT_IDS) {
    points[id] = emptyPoint();
  }
  const landmarks = input.landmarks;
  if (!landmarks || landmarks.length === 0) {
    return {
      contractVersion: LIVEACT_DENSE_SEMANTIC_GEOMETRY_CONTRACT,
      points,
      faceConfidence: 0
    };
  }
  for (const entry of MEDIAPIPE_SAGATREE_FACE_ANCHOR_MAP_V1) {
    const denseId = ANCHOR_TO_DENSE[entry.anchorId];
    if (!denseId) continue;
    points[denseId] = resolveAnchorPoint(landmarks, entry);
  }
  for (const entry of MEDIAPIPE_DENSE_EXTENSION_MAP_V1) {
    points[entry.pointId] = resolveExtension(landmarks, entry);
  }
  const faceConfidence = typeof input.faceConfidence === "number" && Number.isFinite(input.faceConfidence) ? Math.min(1, Math.max(0, input.faceConfidence)) : 1;
  return {
    contractVersion: LIVEACT_DENSE_SEMANTIC_GEOMETRY_CONTRACT,
    points,
    faceConfidence
  };
}

// src/infrastructure/character/liveact/mediapipe-iris-geometry-v1.ts
var MEDIAPIPE_LEFT_IRIS_CONTOUR_INDICES = [474, 475, 476, 477];
var MEDIAPIPE_RIGHT_IRIS_CONTOUR_INDICES = [469, 470, 471, 472];
function emptyPoint2() {
  return { available: false, x: Number.NaN, y: Number.NaN, z: Number.NaN };
}
function at2(landmarks, index) {
  const p = landmarks[index];
  if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return null;
  const z = typeof p.z === "number" && Number.isFinite(p.z) ? p.z : 0;
  return { available: true, x: p.x, y: p.y, z };
}
function centroid(points) {
  if (points.length === 0) return emptyPoint2();
  let x = 0;
  let y = 0;
  let z = 0;
  for (const p of points) {
    x += p.x;
    y += p.y;
    z += p.z;
  }
  const n = points.length;
  return { available: true, x: x / n, y: y / n, z: z / n };
}
function resolveAnchor(landmarks, anchorId) {
  const entry = MEDIAPIPE_SAGATREE_FACE_ANCHOR_MAP_V1.find((e) => e.anchorId === anchorId);
  if (!entry) return emptyPoint2();
  const sample = resolveMediaPipeAnchorSample(landmarks, entry);
  if (!sample.available) return emptyPoint2();
  let z = 0;
  let zCount = 0;
  for (const index of entry.landmarkIndices) {
    const lm = landmarks[index];
    if (lm && typeof lm.z === "number" && Number.isFinite(lm.z)) {
      z += lm.z;
      zCount += 1;
    }
  }
  return {
    available: true,
    x: sample.x,
    y: sample.y,
    z: zCount > 0 ? z / zCount : 0
  };
}
function resolveEye(landmarks, side) {
  const prefix = side === "left" ? "eyeLeft" : "eyeRight";
  const contour = side === "left" ? MEDIAPIPE_LEFT_IRIS_CONTOUR_INDICES : MEDIAPIPE_RIGHT_IRIS_CONTOUR_INDICES;
  const contourPts = [];
  for (const index of contour) {
    const p = at2(landmarks, index);
    if (p) contourPts.push(p);
  }
  return {
    innerCorner: resolveAnchor(landmarks, `${prefix}Inner`),
    outerCorner: resolveAnchor(landmarks, `${prefix}Outer`),
    upperLid: resolveAnchor(landmarks, `${prefix}Upper`),
    lowerLid: resolveAnchor(landmarks, `${prefix}Lower`),
    irisCenter: contourPts.length >= 4 ? centroid(contourPts) : emptyPoint2(),
    irisContourAvailableCount: contourPts.length
  };
}
function mapMediaPipeLandmarksToIrisGeometry(input) {
  const landmarks = input.landmarks;
  const faceConfidence = typeof input.faceConfidence === "number" && Number.isFinite(input.faceConfidence) ? Math.min(1, Math.max(0, input.faceConfidence)) : 1;
  if (!landmarks || landmarks.length === 0) {
    const emptyEye = {
      innerCorner: emptyPoint2(),
      outerCorner: emptyPoint2(),
      upperLid: emptyPoint2(),
      lowerLid: emptyPoint2(),
      irisCenter: emptyPoint2(),
      irisContourAvailableCount: 0
    };
    return {
      contractVersion: LIVEACT_IRIS_EYE_GEOMETRY_CONTRACT,
      left: emptyEye,
      right: emptyEye,
      forehead: emptyPoint2(),
      noseBridge: emptyPoint2(),
      noseTip: emptyPoint2(),
      faceConfidence: 0
    };
  }
  return {
    contractVersion: LIVEACT_IRIS_EYE_GEOMETRY_CONTRACT,
    left: resolveEye(landmarks, "left"),
    right: resolveEye(landmarks, "right"),
    forehead: resolveAnchor(landmarks, "forehead"),
    noseBridge: (() => {
      const tip = resolveAnchor(landmarks, "noseTip");
      const fh = resolveAnchor(landmarks, "forehead");
      if (tip.available && fh.available) {
        return {
          available: true,
          x: (tip.x + fh.x) * 0.5,
          y: (tip.y + fh.y) * 0.5,
          z: (tip.z + fh.z) * 0.5
        };
      }
      return tip.available ? tip : fh;
    })(),
    noseTip: resolveAnchor(landmarks, "noseTip"),
    faceConfidence
  };
}

// src/infrastructure/character/liveact/mediapipe-face-source.ts
var MEDIAPIPE_VISION_WASM_PATH = "/mediapipe/wasm";
var MEDIAPIPE_FACE_LANDMARKER_MODEL_PATH = "/mediapipe/models/face_landmarker.task";
async function createMediaPipeLiveActFaceSource(profile = resolveLiveActQualityProfile({})) {
  if (typeof window === "undefined") return null;
  try {
    const mod = await import("@mediapipe/tasks-vision");
    const fileset = await mod.FilesetResolver.forVisionTasks(MEDIAPIPE_VISION_WASM_PATH);
    const landmarker = await mod.FaceLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: MEDIAPIPE_FACE_LANDMARKER_MODEL_PATH,
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numFaces: 1,
      outputFaceBlendshapes: profile.outputFaceBlendshapes,
      outputFacialTransformationMatrixes: profile.outputFacialTransformationMatrixes
    });
    const connections = {
      faceOval: mod.FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
      lips: mod.FaceLandmarker.FACE_LANDMARKS_LIPS,
      leftEye: mod.FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
      rightEye: mod.FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
      leftEyebrow: mod.FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
      rightEyebrow: mod.FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW
    };
    return {
      detect(video, timestampMs) {
        const result = landmarker.detectForVideo(video, timestampMs);
        const shapes = result.faceBlendshapes ?? [];
        const rawLandmarks = result.faceLandmarks ?? [];
        if (shapes.length === 0) {
          return { samples: [], diagnostics: [], denseFeatures: [], irisGaze: [] };
        }
        const blendshapeSamples = shapes.map(
          (shape, index) => mapMediaPipeFaceToLiveActSample({
            categories: shape.categories,
            matrix: result.facialTransformationMatrixes?.[index]?.data,
            enableHeadPose: profile.enableHeadPose,
            faceIndex: index,
            faceCount: shapes.length
          })
        );
        const diagnostics = shapes.map(
          (_, index) => mapMediaPipeLandmarksToLiveActDiagnostics({
            landmarks: rawLandmarks[index],
            connections,
            timestampMs,
            sequence: 0,
            faceIndex: index,
            faceCount: shapes.length,
            trackingLost: false
          })
        );
        const denseFeatures = shapes.map((_, index) => {
          const geometry = mapMediaPipeLandmarksToDenseSemanticGeometry({
            landmarks: rawLandmarks[index],
            faceConfidence: 1
          });
          return extractDenseFaceFeatures({
            geometry,
            sequence: 0,
            timestampMs
          });
        });
        const irisGaze = [];
        const samples = blendshapeSamples.map((sample, index) => {
          const irisGeom = mapMediaPipeLandmarksToIrisGeometry({
            landmarks: rawLandmarks[index],
            faceConfidence: 1
          });
          const solved = solveIrisGaze({
            geometry: irisGeom,
            sequence: 0,
            timestampMs
          });
          const arb = arbitrateLiveActGaze({
            iris: solved,
            blendshape: {
              eyeLeftX: sample.eyeLeftX,
              eyeLeftY: sample.eyeLeftY,
              eyeRightX: sample.eyeRightX,
              eyeRightY: sample.eyeRightY
            }
          });
          irisGaze.push(arb.iris ?? solved);
          return {
            ...sample,
            eyeLeftX: arb.eyeLeftX,
            eyeLeftY: arb.eyeLeftY,
            eyeRightX: arb.eyeRightX,
            eyeRightY: arb.eyeRightY
          };
        });
        return { samples, diagnostics, denseFeatures, irisGaze };
      },
      dispose() {
        try {
          landmarker.close?.();
        } catch {
        }
      }
    };
  } catch (error) {
    console.warn("[liveact] MediaPipe face source unavailable", error);
    return null;
  }
}

// src/infrastructure/character/liveact/liveact-camera-claim.ts
var activeClaim = null;
function claimLiveActCamera(owner) {
  if (activeClaim && activeClaim !== owner) {
    activeClaim.stop();
  }
  activeClaim = owner;
}
function releaseLiveActCamera(owner) {
  if (activeClaim === owner) {
    activeClaim = null;
  }
}

// src/infrastructure/character/liveact/liveact-engine.ts
function isMobileHint() {
  if (typeof navigator === "undefined") return false;
  return /Mobi|Android/i.test(navigator.userAgent) || (navigator.maxTouchPoints ?? 0) > 1;
}
var activeLiveActEngine = null;
function getActiveLiveActEngine() {
  return activeLiveActEngine;
}
var LiveActEngine = class {
  constructor(sourceFactory = async (profile) => {
    const source = await createMediaPipeLiveActFaceSource(profile);
    if (!source) {
      throw new Error("unsupported");
    }
    return source;
  }, limits = DEFAULT_LIVEACT_LIMITS) {
    this.sourceFactory = sourceFactory;
    this.limits = limits;
    this.qualityProfile = resolveLiveActQualityProfile({
      isMobile: isMobileHint(),
      maxTouchPoints: typeof navigator !== "undefined" ? navigator.maxTouchPoints : 0,
      limits
    });
    this.fpsCap = this.qualityProfile.fpsCap;
    this.emitStatus(true);
  }
  status = "idle";
  message = liveActStatusLabelDe("idle");
  stream = null;
  video = null;
  source = null;
  raf = 0;
  lastFrameAt = 0;
  frame = null;
  pipelineStep = null;
  sequence = 0;
  disposed = false;
  visibilityHandler = null;
  limits;
  qualityProfile;
  fpsCap;
  output = null;
  statusListeners = /* @__PURE__ */ new Set();
  frameListeners = /* @__PURE__ */ new Set();
  diagnosticsListeners = /* @__PURE__ */ new Set();
  diagnosticsV2Listeners = /* @__PURE__ */ new Set();
  denseFaceFeaturesListeners = /* @__PURE__ */ new Set();
  irisGazeListeners = /* @__PURE__ */ new Set();
  hybridFaceListeners = /* @__PURE__ */ new Set();
  diagnosticsV2 = null;
  denseFaceFeatures = null;
  irisGaze = null;
  hybridFace = null;
  neutralBaseline = null;
  rangeCalibration = null;
  personalProfile = null;
  personalSession = null;
  personalCalibrating = false;
  /** Owner + character scope for Profile V2; incomplete ⇒ no persistent load/save. */
  personalCalibrationScope = null;
  personalCapturePaused = false;
  calibrating = false;
  calibrationPhase = "neutral";
  calibrationAccumulator = createLiveActCalibrationAccumulator();
  rangeAccumulator = createLiveActRangeCalibrationAccumulator();
  /** Index into LIVEACT_RANGE_CALIBRATION_STEPS while phase === 'range'. */
  rangeStepIndex = 0;
  rangeStepStartedAtMs = 0;
  rangeStepFrameCount = 0;
  rangeStepHoldMs = LIVEACT_RANGE_STEP_MIN_MS;
  rangeStepPhase = "armed";
  rangeStepPeakMax = {};
  rangeStepPeaks = [];
  lastEmittedCountdownSec = null;
  calibrationStartedAtMs = 0;
  calibrationResolve = null;
  calibrationStatus = "idle";
  calibrationMessage = "";
  canAdvanceCalibration = false;
  startGeneration = 0;
  inferenceInFlight = 0;
  droppedInferenceFrames = 0;
  lastStatusEmitMs = 0;
  pendingStatusCoalesce = false;
  statusCoalesceTimer = null;
  preferredDeviceId;
  deviceChangeHandler = null;
  retargetProfile = DEFAULT_LIVEACT_RETARGET_PROFILE;
  /**
   * Bind Personal Calibration persistence to authenticated owner + character.
   * Incomplete scope clears runtime personal profile and never loads `_default`.
   */
  setPersonalCalibrationScope(scope) {
    const next = scope && isLiveActPersonalCalibrationScopeComplete(scope) ? {
      ownerLocalId: scope.ownerLocalId.trim(),
      characterLocalId: scope.characterLocalId.trim()
    } : null;
    const prev = this.personalCalibrationScope;
    const same = prev?.ownerLocalId === next?.ownerLocalId && prev?.characterLocalId === next?.characterLocalId;
    if (same) return;
    this.personalProfile = null;
    this.personalCalibrationScope = next;
    this.reloadPersonalProfileFromStore();
    this.emitStatus(true);
  }
  /** @deprecated Use {@link setPersonalCalibrationScope}. Character-only is insufficient. */
  setCharacterLocalId(characterLocalId) {
    if (!characterLocalId) {
      this.setPersonalCalibrationScope(null);
      return;
    }
    const owner = this.personalCalibrationScope?.ownerLocalId ?? "";
    this.setPersonalCalibrationScope(
      owner ? { ownerLocalId: owner, characterLocalId } : null
    );
  }
  getPersonalCalibrationProfile() {
    return this.personalProfile;
  }
  getPersonalCalibrationScope() {
    return this.personalCalibrationScope;
  }
  reloadPersonalProfileFromStore() {
    if (!isLiveActPersonalCalibrationScopeComplete(this.personalCalibrationScope)) {
      this.personalProfile = null;
      return;
    }
    const loaded = loadLiveActPersonalCalibrationProfile(this.personalCalibrationScope);
    if (loaded.status === "valid" && loaded.profile) {
      this.applyPersonalProfile(loaded.profile);
      return;
    }
    this.personalProfile = null;
  }
  applyPersonalProfile(profile) {
    this.personalProfile = profile;
    const set = liveActCalibrationSetFromPersonalProfile(profile);
    this.neutralBaseline = set.neutral;
    this.rangeCalibration = set.range;
  }
  bindOutput(output) {
    const swapped = output !== this.output;
    this.output = output;
    if (!output) {
      this.diagnosticsV2 = null;
    }
    if (swapped) {
      this.pipelineStep = null;
    }
  }
  /** First-party retarget profile (identity by default; no filename-based selection). */
  setRetargetProfile(profile) {
    this.retargetProfile = profile ?? DEFAULT_LIVEACT_RETARGET_PROFILE;
  }
  subscribeStatus(listener) {
    this.statusListeners.add(listener);
    listener(this.getState());
    return () => {
      this.statusListeners.delete(listener);
    };
  }
  subscribeFrame(listener) {
    this.frameListeners.add(listener);
    if (this.frame) listener(this.frame);
    return () => {
      this.frameListeners.delete(listener);
    };
  }
  subscribeDiagnostics(listener) {
    this.diagnosticsListeners.add(listener);
    return () => {
      this.diagnosticsListeners.delete(listener);
    };
  }
  /** Diagnostics V2 stage trace (#397) — ref-friendly; no hot-path React state. */
  subscribeDiagnosticsV2(listener) {
    this.diagnosticsV2Listeners.add(listener);
    if (this.diagnosticsV2) listener(this.diagnosticsV2);
    return () => {
      this.diagnosticsV2Listeners.delete(listener);
    };
  }
  /**
   * Dense face features side-channel (#445).
   * Single access point for future #446/#447 — not part of LiveActFrameV1.
   */
  subscribeDenseFaceFeatures(listener) {
    this.denseFaceFeaturesListeners.add(listener);
    if (this.denseFaceFeatures) listener(this.denseFaceFeatures);
    return () => {
      this.denseFaceFeaturesListeners.delete(listener);
    };
  }
  getDenseFaceFeatures() {
    return this.denseFaceFeatures;
  }
  subscribeIrisGaze(listener) {
    this.irisGazeListeners.add(listener);
    if (this.irisGaze) listener(this.irisGaze);
    return () => {
      this.irisGazeListeners.delete(listener);
    };
  }
  getIrisGaze() {
    return this.irisGaze;
  }
  /**
   * Hybrid mouth/cheek/nose face side-channel (#447).
   * Semantic controls only — raw dense geometry stays out of LiveActFrameV1.
   */
  subscribeHybridFace(listener) {
    this.hybridFaceListeners.add(listener);
    if (this.hybridFace) listener(this.hybridFace);
    return () => {
      this.hybridFaceListeners.delete(listener);
    };
  }
  getHybridFace() {
    return this.hybridFace;
  }
  getDiagnosticsV2() {
    return this.diagnosticsV2;
  }
  /** Session range gains from the last successful max pass; null until then. */
  getRangeCalibration() {
    return this.rangeCalibration;
  }
  getState() {
    return {
      status: this.status,
      message: this.message,
      frame: this.frame,
      fpsCap: this.fpsCap,
      qualityProfileId: this.qualityProfile.id,
      qualityProfileLabelDe: this.qualityProfile.labelDe,
      calibrationStatus: this.calibrationStatus,
      calibrationMessage: this.calibrationMessage,
      hasNeutralBaseline: this.neutralBaseline !== null,
      hasRangeCalibration: this.rangeCalibration !== null,
      canAdvanceCalibration: this.computeCanAdvanceCalibration(),
      calibrationAdvanceLabelDe: this.computeCalibrationAdvanceLabel(),
      calibrationStepPhase: this.calibrating && this.calibrationPhase === "range" ? this.rangeStepPhase : null,
      canStartCalibrationHold: this.computeCanStartCalibrationHold(),
      canRetryCalibrationHold: this.computeCanRetryCalibrationHold(),
      calibrationStepPeaks: this.rangeStepPeaks,
      calibrationCountdownSec: this.computeCalibrationCountdownSec(),
      personalCalibrationActive: this.personalCalibrating,
      personalCalibrationPhaseLabelDe: this.computePersonalPhaseLabelDe(),
      canSkipPersonalCalibrationPhase: this.computeCanSkipPersonalPhase(),
      hasPersonalCalibrationProfile: this.personalProfile !== null,
      droppedInferenceFrames: this.droppedInferenceFrames
    };
  }
  /** Switch active camera device without releasing the global claim. */
  async switchCameraDevice(deviceId) {
    if (this.disposed) return;
    const sameDevice = deviceId === this.preferredDeviceId && Boolean(this.stream?.getVideoTracks().some((track) => track.readyState === "live"));
    if (sameDevice) return;
    this.preferredDeviceId = deviceId;
    if (this.status !== "active" && this.status !== "lost" && this.status !== "paused") {
      return;
    }
    const gen = this.startGeneration;
    await this.reopenCameraStream(gen);
  }
  getQualityProfile() {
    return this.qualityProfile;
  }
  /**
   * Engine/face-source input support only (#381) — never derived from avatar mesh.
   * Available before tracking starts (quality profile); face always true for MediaPipe Face.
   */
  getInputCapabilities() {
    return createLiveActInputCapabilities({
      face: true,
      headPose: this.qualityProfile.enableHeadPose,
      eyeGaze: true
    });
  }
  /** Preview video element while tracking (engine remains stream owner). */
  getPreviewVideo() {
    return this.video;
  }
  /**
   * Step 1: 30 valid neutral frames within 2 s (on failure the previous calibration is kept).
   * Then one max-pass expression at a time; the user advances with {@link advanceCalibration}.
   * Classic V1 / fallback path — prefer {@link calibratePersonalV2} for Premium Fidelity.
   */
  calibrate() {
    if (this.disposed) {
      return Promise.resolve({
        ok: false,
        messageDe: "LiveAct ist nicht verf\xFCgbar."
      });
    }
    if (this.status !== "active" && this.status !== "lost") {
      return Promise.resolve({
        ok: false,
        messageDe: "Kalibrierung erfordert aktives Tracking."
      });
    }
    if (this.calibrating || this.personalCalibrating) {
      return Promise.resolve({
        ok: false,
        messageDe: "Kalibrierung l\xE4uft bereits."
      });
    }
    return new Promise((resolve) => {
      this.personalProfile = null;
      this.calibrating = true;
      this.calibrationPhase = "neutral";
      this.canAdvanceCalibration = false;
      this.rangeStepIndex = 0;
      this.rangeStepFrameCount = 0;
      this.rangeStepPhase = "armed";
      this.rangeStepPeaks = [];
      this.rangeStepPeakMax = {};
      this.lastEmittedCountdownSec = Math.ceil(LIVEACT_CALIBRATION_TIMEOUT_MS / 1e3);
      this.calibrationAccumulator = createLiveActCalibrationAccumulator();
      this.calibrationStartedAtMs = typeof performance !== "undefined" ? performance.now() : Date.now();
      this.calibrationResolve = resolve;
      this.setCalibrationUi("running", liveActNeutralCalibrationPrompt());
      this.emitStatus(true);
    });
  }
  /**
   * Premium Personal Calibration V2 (#449) — compact auto-advancing ~20–40 s session.
   * Persists a local fingerprint-bound profile; V1 classic {@link calibrate} remains.
   */
  calibratePersonalV2() {
    if (this.disposed) {
      return Promise.resolve({
        ok: false,
        messageDe: "LiveAct ist nicht verf\xFCgbar."
      });
    }
    if (this.status !== "active" && this.status !== "lost") {
      return Promise.resolve({
        ok: false,
        messageDe: "Kalibrierung erfordert aktives Tracking."
      });
    }
    if (this.calibrating || this.personalCalibrating) {
      return Promise.resolve({
        ok: false,
        messageDe: "Kalibrierung l\xE4uft bereits."
      });
    }
    return new Promise((resolve) => {
      this.personalCalibrating = true;
      this.personalCapturePaused = false;
      this.personalSession = createLiveActPersonalCalibrationSessionV2(
        this.personalCalibrationScope
      );
      this.calibrationResolve = resolve;
      const phase0 = LIVEACT_PERSONAL_CALIBRATION_PHASES[0];
      this.setCalibrationUi(
        "running",
        phase0 ? `${phase0.labelDe}: ${phase0.holdDe}` : "Premium-Kalibrierung\u2026"
      );
      this.emitStatus(true);
    });
  }
  /** Skip current Personal V2 phase when allowed (motor limitation / N/A). */
  skipPersonalCalibrationPhase() {
    if (!this.personalCalibrating || !this.personalSession) return;
    if (!this.computeCanSkipPersonalPhase()) return;
    this.personalCapturePaused = false;
    const advanced = skipLiveActPersonalCalibrationPhase(this.personalSession);
    if (!advanced) {
      this.completePersonalCalibration();
      return;
    }
    this.emitPersonalPhasePrompt();
    this.emitStatus(true);
  }
  /** Begin the countdown/hold for the current armed expression. */
  startCalibrationHold() {
    if (!this.computeCanStartCalibrationHold()) return;
    this.rangeStepPhase = "holding";
    this.rangeStepFrameCount = 0;
    this.rangeStepPeakMax = {};
    this.rangeStepPeaks = [];
    this.canAdvanceCalibration = false;
    this.rangeStepStartedAtMs = typeof performance !== "undefined" ? performance.now() : Date.now();
    this.lastEmittedCountdownSec = Math.ceil(this.rangeStepHoldMs / 1e3);
    this.emitStatus(true);
  }
  /** Discard the last hold and wait for Start again. */
  retryCalibrationHold() {
    if (!this.computeCanRetryCalibrationHold()) return;
    this.beginRangeStep(this.rangeStepIndex);
    this.emitStatus(true);
  }
  /**
   * Advance from review to the next expression, or finish after the last.
   * No-op until the hold is complete and reviewed.
   */
  advanceCalibration() {
    if (!this.calibrating || this.calibrationPhase !== "range") return;
    if (!this.computeCanAdvanceCalibration()) return;
    const next = this.rangeStepIndex + 1;
    if (next >= LIVEACT_RANGE_CALIBRATION_STEPS.length) {
      this.completeRangeCalibration();
      return;
    }
    this.beginRangeStep(next);
    this.emitStatus(true);
  }
  /** Explicit user action only — never auto-start on construct/reload. */
  async start(deviceId) {
    if (this.disposed) return;
    if (this.status === "active" || this.status === "starting") return;
    if (typeof deviceId === "string" && deviceId.length > 0) {
      this.preferredDeviceId = deviceId;
    }
    const generation = ++this.startGeneration;
    if (activeLiveActEngine && activeLiveActEngine !== this) {
      activeLiveActEngine.stop();
    }
    claimLiveActCamera(this);
    activeLiveActEngine = this;
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      this.setStatus("unsupported", liveActStatusLabelDe("unsupported"));
      this.releaseActiveClaim();
      return;
    }
    this.setStatus("starting", liveActStatusLabelDe("starting"));
    try {
      this.stream = await this.openCameraStream();
    } catch (error) {
      if (generation !== this.startGeneration) {
        return;
      }
      const name = error instanceof DOMException ? error.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        this.setStatus("denied", liveActStatusLabelDe("denied"));
        this.releaseActiveClaim();
        return;
      }
      if (name === "NotFoundError" || name === "OverconstrainedError") {
        this.setStatus("unsupported", "Keine Kamera gefunden.");
        this.releaseActiveClaim();
        return;
      }
      this.setStatus("error", liveActStatusLabelDe("error"));
      this.releaseActiveClaim();
      return;
    }
    if (this.disposed || activeLiveActEngine !== this || generation !== this.startGeneration) {
      this.cleanupMedia();
      return;
    }
    try {
      this.source = await this.sourceFactory(this.qualityProfile);
    } catch {
      this.cleanupMedia();
      this.setStatus("unsupported", liveActStatusLabelDe("unsupported"));
      this.releaseActiveClaim();
      return;
    }
    if (this.disposed || activeLiveActEngine !== this || generation !== this.startGeneration) {
      this.cleanupMedia();
      return;
    }
    this.video = document.createElement("video");
    this.video.muted = true;
    this.video.playsInline = true;
    this.video.autoplay = true;
    this.video.srcObject = this.stream;
    await this.video.play().catch(() => void 0);
    if (generation !== this.startGeneration) {
      this.cleanupMedia();
      return;
    }
    this.attachRuntimeListeners();
    this.setStatus("active", liveActStatusLabelDe("active"));
    this.lastFrameAt = 0;
    this.droppedInferenceFrames = 0;
    this.loop();
  }
  stop() {
    if (this.disposed) return;
    this.startGeneration += 1;
    this.cancelCalibration("LiveAct gestoppt.");
    this.cancelLoop();
    this.cleanupMedia();
    this.frame = null;
    this.pipelineStep = null;
    this.diagnosticsV2 = null;
    this.denseFaceFeatures = null;
    this.irisGaze = null;
    this.hybridFace = null;
    this.output?.resetLiveActPose();
    this.releaseActiveClaim();
    this.setStatus("stopped", liveActStatusLabelDe("stopped"));
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.startGeneration += 1;
    this.cancelCalibration("LiveAct beendet.");
    this.neutralBaseline = null;
    this.rangeCalibration = null;
    this.personalProfile = null;
    this.personalSession = null;
    this.personalCalibrating = false;
    this.cancelLoop();
    this.cleanupMedia();
    this.frame = null;
    this.pipelineStep = null;
    this.diagnosticsV2 = null;
    this.denseFaceFeatures = null;
    this.irisGaze = null;
    this.hybridFace = null;
    this.output = null;
    this.statusListeners.clear();
    this.frameListeners.clear();
    this.diagnosticsListeners.clear();
    this.diagnosticsV2Listeners.clear();
    this.denseFaceFeaturesListeners.clear();
    this.irisGazeListeners.clear();
    this.hybridFaceListeners.clear();
    this.releaseActiveClaim();
    this.setStatus("idle", liveActStatusLabelDe("idle"));
    this.setCalibrationUi("idle", "");
  }
  /** Test helper: push one sample through map/smooth without camera. */
  ingestSampleForTests(sample, timestampMs = 0) {
    return this.processSample(sample, timestampMs, null, null, null);
  }
  /** Test helper: inject dense features without MediaPipe (#445). */
  ingestDenseFaceFeaturesForTests(frame) {
    assertDenseFaceFeaturesLocalOnly(frame);
    this.denseFaceFeatures = frame;
    this.emitDenseFaceFeatures(frame);
  }
  releaseActiveClaim() {
    if (activeLiveActEngine === this) {
      activeLiveActEngine = null;
    }
    releaseLiveActCamera(this);
  }
  loop = () => {
    if (this.disposed || this.status === "stopped" || this.status === "idle") return;
    this.raf = requestAnimationFrame(this.loop);
    if (this.status === "paused") return;
    const video = this.video;
    const source = this.source;
    if (!video || !source || video.readyState < 2) return;
    const now = performance.now();
    const minDelta = 1e3 / Math.max(1, this.fpsCap);
    if (now - this.lastFrameAt < minDelta) return;
    this.lastFrameAt = now;
    if (shouldDropLiveActInferenceTick(this.inferenceInFlight)) {
      this.droppedInferenceFrames += 1;
      this.scheduleCoalescedStatusEmit();
      return;
    }
    this.inferenceInFlight += 1;
    let detect;
    try {
      detect = source.detect(video, now);
    } catch (error) {
      console.warn("[liveact] detect failed", error);
      this.setStatus("error", liveActStatusLabelDe("error"));
      this.stop();
      return;
    } finally {
      this.inferenceInFlight = Math.max(0, this.inferenceInFlight - 1);
    }
    const primary = selectPrimaryLiveActFaceIndex(detect.samples);
    const sample = primary >= 0 ? { ...detect.samples[primary], faceIndex: primary, faceCount: detect.samples.length } : createEmptyLiveActSourceSample();
    const diagnosticsRaw = primary >= 0 && detect.diagnostics[primary] ? detect.diagnostics[primary] : createEmptyLiveActFaceDiagnosticsFrame({ timestampMs: now, sequence: this.sequence + 1 });
    const denseRaw = primary >= 0 && detect.denseFeatures[primary] ? detect.denseFeatures[primary] : null;
    const irisRaw = primary >= 0 && detect.irisGaze[primary] ? detect.irisGaze[primary] : null;
    this.processSample(sample, now, diagnosticsRaw, denseRaw, irisRaw);
  };
  processSample(sample, timestampMs, diagnosticsSeed, denseSeed, irisSeed) {
    this.sequence += 1;
    const denseForHybrid = denseSeed ? {
      ...denseSeed,
      sequence: this.sequence,
      timestampMs,
      presence: denseSeed.presence
    } : null;
    const hybrid = solveHybridFace({
      semanticFace: sample.face,
      dense: denseForHybrid,
      sequence: this.sequence,
      timestampMs,
      denseSequence: denseForHybrid?.sequence ?? null
    });
    assertHybridFaceLocalOnly(hybrid);
    this.hybridFace = hybrid;
    this.emitHybridFace(hybrid);
    const anatomicalFused = {
      ...sample,
      face: applyHybridFaceToSemantic(sample.face, hybrid)
    };
    const oriented = LIVEACT_MIRROR_AVATAR ? mirrorLiveActSourceSample(anatomicalFused) : anatomicalFused;
    const mapped = mapLiveActSourceSample(oriented, {
      timestampMs,
      sequence: this.sequence,
      limits: this.limits
    });
    this.tickCalibration(oriented);
    const step = stepLiveActCalibratedFrame(
      this.pipelineStep,
      mapped,
      { neutral: this.neutralBaseline, range: this.rangeCalibration },
      this.limits,
      "adaptive",
      this.personalProfile
    );
    this.pipelineStep = step;
    const { smoothed, calibrated } = step;
    assertLiveActFrameLocalOnly(calibrated);
    this.frame = calibrated;
    const retargeted = applyLiveActRetargetProfile(calibrated, this.retargetProfile);
    this.output?.applyLiveActFrame(retargeted);
    const performanceWeights = drivePerformanceFaceWeights({
      hybrid: this.hybridFace,
      face: retargeted.face
    });
    this.output?.applyPerformanceFaceWeights(performanceWeights);
    this.emitFrame(calibrated);
    const applied = this.output ? this.output.getAppliedDiagnostics() : createUnavailableLiveActAppliedValues();
    const diagnosticsV2 = createLiveActDiagnosticsV2Snapshot({
      timestampMs,
      sequence: this.sequence,
      trackingLost: mapped.trackingLost,
      // RAW remains pre-hybrid tracker sample; mapped includes hybrid face controls.
      raw: snapshotLiveActDiagnosticsV2FromSample(sample),
      mapped: snapshotLiveActDiagnosticsV2FromFrame(mapped),
      smoothed: snapshotLiveActDiagnosticsV2FromFrame(smoothed),
      calibrated: snapshotLiveActDiagnosticsV2FromFrame(calibrated),
      retargeted: snapshotLiveActDiagnosticsV2FromFrame(retargeted),
      applied
    });
    assertLiveActDiagnosticsV2LocalOnly(diagnosticsV2);
    this.diagnosticsV2 = diagnosticsV2;
    this.emitDiagnosticsV2(diagnosticsV2);
    const diagnostics = diagnosticsSeed ? {
      ...diagnosticsSeed,
      timestampMs,
      sequence: this.sequence,
      trackingLost: mapped.trackingLost,
      faceIndex: sample.faceIndex,
      faceCount: sample.faceCount
    } : createEmptyLiveActFaceDiagnosticsFrame({
      timestampMs,
      sequence: this.sequence
    });
    this.emitDiagnostics(diagnostics);
    const dense = denseSeed ? {
      ...denseSeed,
      sequence: this.sequence,
      timestampMs,
      presence: denseSeed.presence && !mapped.trackingLost
    } : createEmptyDenseFaceFeatures({
      sequence: this.sequence,
      timestampMs,
      faceConfidence: 0,
      normalizationStatus: "unavailable"
    });
    assertDenseFaceFeaturesLocalOnly(dense);
    assertLiveActFrameLocalOnly(calibrated);
    this.denseFaceFeatures = dense;
    this.emitDenseFaceFeatures(dense);
    const irisBase = irisSeed ?? createEmptyIrisGaze({ sequence: this.sequence, timestampMs });
    const irisOriented = LIVEACT_MIRROR_AVATAR ? mirrorIrisGaze(irisBase) : irisBase;
    const iris = {
      ...irisOriented,
      sequence: this.sequence,
      timestampMs
    };
    assertIrisGazeLocalOnly(iris);
    this.irisGaze = iris;
    this.emitIrisGaze(iris);
    if (mapped.trackingLost) {
      if (this.status !== "lost") this.setStatus("lost", liveActStatusLabelDe("lost"));
    } else if (this.status === "lost") {
      this.setStatus("active", liveActStatusLabelDe("active"));
    } else {
      this.emitStatus(false);
    }
    return calibrated;
  }
  async openCameraStream() {
    const videoConstraints = {
      facingMode: "user",
      width: { ideal: 640 },
      height: { ideal: 480 },
      frameRate: { ideal: this.fpsCap, max: this.fpsCap }
    };
    if (this.preferredDeviceId) {
      videoConstraints.deviceId = { exact: this.preferredDeviceId };
      delete videoConstraints.facingMode;
    }
    return navigator.mediaDevices.getUserMedia({
      audio: false,
      video: videoConstraints
    });
  }
  async reopenCameraStream(generation) {
    this.cleanupStreamOnly();
    if (generation !== this.startGeneration || this.disposed) return;
    try {
      this.stream = await this.openCameraStream();
    } catch {
      this.setStatus("unsupported", "Kamera nicht verf\xFCgbar.");
      this.stop();
      return;
    }
    if (generation !== this.startGeneration || this.disposed) {
      this.cleanupStreamOnly();
      return;
    }
    this.video = document.createElement("video");
    this.video.muted = true;
    this.video.playsInline = true;
    this.video.autoplay = true;
    this.video.srcObject = this.stream;
    await this.video.play().catch(() => void 0);
    if (generation !== this.startGeneration) {
      this.cleanupStreamOnly();
    }
  }
  attachRuntimeListeners() {
    if (typeof document !== "undefined" && !this.visibilityHandler) {
      this.visibilityHandler = () => {
        if (typeof document === "undefined") return;
        if (document.visibilityState === "hidden") {
          if (this.status === "active") {
            this.setStatus("paused", liveActStatusLabelDe("paused"));
          }
        } else if (this.status === "paused") {
          this.setStatus("active", liveActStatusLabelDe("active"));
        }
      };
      document.addEventListener("visibilitychange", this.visibilityHandler);
    }
    if (typeof navigator !== "undefined" && navigator.mediaDevices && !this.deviceChangeHandler) {
      this.deviceChangeHandler = () => {
        if (this.status !== "active" && this.status !== "lost" && this.status !== "paused") {
          return;
        }
        void this.switchCameraDevice(this.preferredDeviceId);
      };
      navigator.mediaDevices.addEventListener("devicechange", this.deviceChangeHandler);
    }
  }
  cleanupStreamOnly() {
    if (this.video) {
      this.video.pause();
      this.video.srcObject = null;
      this.video = null;
    }
    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        track.stop();
      }
      this.stream = null;
    }
  }
  tickCalibration(sample) {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (this.personalCalibrating) {
      this.tickPersonalCalibration(sample, now);
      return;
    }
    if (!this.calibrating) return;
    if (this.calibrationPhase === "range") {
      this.tickRangeCalibration(sample, now);
      return;
    }
    this.emitCountdownIfChanged();
    if (now - this.calibrationStartedAtMs > LIVEACT_CALIBRATION_TIMEOUT_MS) {
      this.failCalibration("Kalibrierung fehlgeschlagen \u2014 zu wenig g\xFCltige Frames.");
      return;
    }
    const pushed = pushLiveActCalibrationSample(this.calibrationAccumulator, sample, {
      headPoseSupported: this.qualityProfile.enableHeadPose,
      limits: this.limits
    });
    if (!pushed) {
      this.failCalibration("Gesicht verloren \u2014 Kalibrierung abgebrochen.");
      return;
    }
    if (this.calibrationAccumulator.count >= LIVEACT_CALIBRATION_FRAME_TARGET) {
      this.completeCalibration();
    }
  }
  completeCalibration() {
    const next = finalizeLiveActCalibration(this.calibrationAccumulator);
    if (!next) {
      this.failCalibration("Kalibrierung fehlgeschlagen.");
      return;
    }
    this.neutralBaseline = next;
    this.rangeCalibration = null;
    this.calibrationPhase = "range";
    this.rangeAccumulator = createLiveActRangeCalibrationAccumulator();
    this.beginRangeStep(0);
    this.emitStatus(true);
  }
  beginRangeStep(stepIndex) {
    this.rangeStepIndex = stepIndex;
    this.rangeStepFrameCount = 0;
    this.canAdvanceCalibration = false;
    this.rangeStepHoldMs = liveActRangeStepHoldMs(stepIndex);
    this.rangeStepPhase = "armed";
    this.rangeStepPeakMax = {};
    this.rangeStepPeaks = [];
    this.lastEmittedCountdownSec = null;
    this.setCalibrationUi("running", liveActRangeCalibrationStepPrompt(stepIndex));
  }
  computeCanStartCalibrationHold() {
    return this.calibrating && this.calibrationPhase === "range" && this.rangeStepPhase === "armed";
  }
  computeCanRetryCalibrationHold() {
    return this.calibrating && this.calibrationPhase === "range" && this.rangeStepPhase === "review";
  }
  computeCanAdvanceCalibration() {
    return this.calibrating && this.calibrationPhase === "range" && this.rangeStepPhase === "review";
  }
  computeCalibrationAdvanceLabel() {
    if (!this.computeCanAdvanceCalibration()) return null;
    return this.rangeStepIndex >= LIVEACT_RANGE_CALIBRATION_STEPS.length - 1 ? "Fertig" : "Weiter";
  }
  computeCalibrationCountdownSec() {
    if (this.calibrationStatus !== "running") return null;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (this.personalCalibrating && this.personalSession) {
      return liveActPersonalCalibrationPhaseRemainingSec(this.personalSession);
    }
    if (!this.calibrating) return null;
    if (this.calibrationPhase === "neutral") {
      const remaining2 = LIVEACT_CALIBRATION_TIMEOUT_MS - (now - this.calibrationStartedAtMs);
      return Math.max(0, Math.ceil(remaining2 / 1e3));
    }
    if (this.rangeStepPhase !== "holding") return null;
    const remaining = this.rangeStepHoldMs - (now - this.rangeStepStartedAtMs);
    return Math.max(0, Math.ceil(remaining / 1e3));
  }
  emitCountdownIfChanged() {
    const sec = this.computeCalibrationCountdownSec();
    if (sec === this.lastEmittedCountdownSec) return;
    this.lastEmittedCountdownSec = sec;
    this.emitStatus(true);
  }
  tickRangeCalibration(sample, now) {
    if (this.rangeStepPhase !== "holding") return;
    const pushed = pushLiveActRangeCalibrationSample(this.rangeAccumulator, sample, this.limits);
    if (pushed) {
      this.rangeStepFrameCount += 1;
      for (const channel of liveActRangeStepChannels(this.rangeStepIndex)) {
        const value = sample.face[channel];
        if (typeof value !== "number" || !Number.isFinite(value)) continue;
        const prev = this.rangeStepPeakMax[channel] ?? 0;
        if (value > prev) this.rangeStepPeakMax[channel] = value;
      }
    }
    this.emitCountdownIfChanged();
    const holdDone = this.rangeStepFrameCount >= LIVEACT_RANGE_STEP_MIN_FRAMES && now - this.rangeStepStartedAtMs >= this.rangeStepHoldMs;
    if (!holdDone) return;
    this.rangeStepPeaks = liveActRangeStepChannels(this.rangeStepIndex).map((channel) => ({
      channel,
      max: Math.round((this.rangeStepPeakMax[channel] ?? 0) * 1e3) / 1e3
    }));
    this.rangeStepPhase = "review";
    this.canAdvanceCalibration = true;
    this.lastEmittedCountdownSec = 0;
    this.emitStatus(true);
  }
  completeRangeCalibration() {
    const baseline = this.neutralBaseline;
    const range = baseline ? finalizeLiveActRangeCalibration(this.rangeAccumulator, baseline) : null;
    this.rangeCalibration = range;
    this.calibrating = false;
    this.calibrationPhase = "neutral";
    this.canAdvanceCalibration = false;
    this.rangeStepPhase = "armed";
    this.rangeStepPeaks = [];
    this.lastEmittedCountdownSec = null;
    const resolve = this.calibrationResolve;
    this.calibrationResolve = null;
    const channelCount = range ? Object.keys(range.gain).length : 0;
    const messageDe = range ? `Kalibriert: Neutral + Maximal (${channelCount} Kan\xE4le, nur diese Sitzung).` : "Neutral gespeichert \u2014 Maximal-Schritt ohne genug Bewegung, Ausschlag bleibt 1:1.";
    if (!range) {
      console.warn("[liveact] range calibration skipped", {
        frames: this.rangeAccumulator.count
      });
    }
    this.setCalibrationUi("success", messageDe);
    resolve?.({ ok: true, messageDe });
    this.emitStatus(true);
  }
  tickPersonalCalibration(sample, now) {
    const session = this.personalSession;
    if (!session) return;
    const pushed = pushLiveActPersonalCalibrationSample(session, sample, {
      headPoseSupported: this.qualityProfile.enableHeadPose,
      limits: this.limits,
      nowMs: now
    });
    if (!pushed) {
      if (!this.personalCapturePaused) {
        this.personalCapturePaused = true;
        this.setCalibrationUi(
          "running",
          "Gesicht nicht erkannt \u2014 Kalibrierung pausiert"
        );
      }
      this.emitCountdownIfChanged();
      return;
    }
    if (this.personalCapturePaused) {
      this.personalCapturePaused = false;
      this.emitPersonalPhasePrompt();
    }
    this.emitCountdownIfChanged();
    if (!isLiveActPersonalCalibrationPhaseComplete(session, now)) return;
    const hasNext = advanceLiveActPersonalCalibrationPhase(session);
    if (!hasNext) {
      this.completePersonalCalibration();
      return;
    }
    this.emitPersonalPhasePrompt();
    this.emitStatus(true);
  }
  completePersonalCalibration() {
    const session = this.personalSession;
    if (!session || !hasLiveActPersonalCalibrationEnoughValidSamples(session)) {
      this.failCalibration(
        "Premium-Kalibrierung unvollst\xE4ndig \u2014 zu wenig g\xFCltige Samples."
      );
      return;
    }
    const createdAt = typeof performance !== "undefined" ? Date.now() : 17e11;
    const profile = finalizeLiveActPersonalCalibrationProfile(session, createdAt);
    if (profile.status !== "valid") {
      this.failCalibration(
        "Premium-Kalibrierung unvollst\xE4ndig \u2014 zu wenig g\xFCltige Samples."
      );
      return;
    }
    const persisted = saveLiveActPersonalCalibrationProfile(profile);
    this.applyPersonalProfile(profile);
    this.personalCalibrating = false;
    this.personalCapturePaused = false;
    this.personalSession = null;
    this.lastEmittedCountdownSec = null;
    const resolve = this.calibrationResolve;
    this.calibrationResolve = null;
    const messageDe = persisted ? "Premium-Kalibrierung gespeichert (lokal) \u2014 Neutral, Range, Noise Floor aktiv." : "Premium-Kalibrierung aktiv \u2014 lokales Speichern nicht verf\xFCgbar. Gilt nur f\xFCr diese Sitzung.";
    this.setCalibrationUi("success", messageDe);
    resolve?.({ ok: true, messageDe, persisted });
    this.emitStatus(true);
  }
  computePersonalPhaseLabelDe() {
    if (!this.personalCalibrating || !this.personalSession) return null;
    const id = currentLiveActPersonalPhaseId(this.personalSession);
    const phase = LIVEACT_PERSONAL_CALIBRATION_PHASES.find((p) => p.id === id);
    return phase?.labelDe ?? null;
  }
  computeCanSkipPersonalPhase() {
    if (!this.personalCalibrating || !this.personalSession) return false;
    const id = currentLiveActPersonalPhaseId(this.personalSession);
    const phase = LIVEACT_PERSONAL_CALIBRATION_PHASES.find((p) => p.id === id);
    return Boolean(phase?.skipAllowed);
  }
  emitPersonalPhasePrompt() {
    if (!this.personalSession) return;
    const id = currentLiveActPersonalPhaseId(this.personalSession);
    const phase = LIVEACT_PERSONAL_CALIBRATION_PHASES.find((p) => p.id === id);
    if (!phase) return;
    this.setCalibrationUi("running", `${phase.labelDe}: ${phase.holdDe}`);
  }
  failCalibration(messageDe) {
    this.calibrating = false;
    this.personalCalibrating = false;
    this.personalSession = null;
    this.calibrationPhase = "neutral";
    this.canAdvanceCalibration = false;
    this.rangeStepPhase = "armed";
    this.rangeStepPeaks = [];
    this.lastEmittedCountdownSec = null;
    const resolve = this.calibrationResolve;
    this.calibrationResolve = null;
    this.setCalibrationUi("failed", messageDe);
    resolve?.({ ok: false, messageDe });
    this.emitStatus(true);
  }
  cancelCalibration(messageDe) {
    if (!this.calibrating && !this.personalCalibrating) return;
    this.calibrating = false;
    this.personalCalibrating = false;
    this.personalSession = null;
    this.calibrationPhase = "neutral";
    this.canAdvanceCalibration = false;
    this.rangeStepPhase = "armed";
    this.rangeStepPeaks = [];
    this.lastEmittedCountdownSec = null;
    const resolve = this.calibrationResolve;
    this.calibrationResolve = null;
    this.setCalibrationUi("idle", messageDe);
    resolve?.({ ok: false, messageDe });
  }
  setCalibrationUi(status, message) {
    this.calibrationStatus = status;
    this.calibrationMessage = message;
  }
  cancelLoop() {
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }
  cleanupMedia() {
    if (this.statusCoalesceTimer !== null) {
      clearTimeout(this.statusCoalesceTimer);
      this.statusCoalesceTimer = null;
    }
    this.pendingStatusCoalesce = false;
    if (this.visibilityHandler && typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
      this.visibilityHandler = null;
    }
    if (this.deviceChangeHandler && typeof navigator !== "undefined" && navigator.mediaDevices) {
      navigator.mediaDevices.removeEventListener("devicechange", this.deviceChangeHandler);
      this.deviceChangeHandler = null;
    }
    try {
      this.source?.dispose();
    } catch {
    }
    this.source = null;
    this.cleanupStreamOnly();
    this.inferenceInFlight = 0;
  }
  setStatus(status, message) {
    this.status = status;
    this.message = message;
    this.emitStatus(true);
  }
  scheduleCoalescedStatusEmit() {
    if (this.pendingStatusCoalesce || this.statusCoalesceTimer !== null) return;
    this.pendingStatusCoalesce = true;
    const delay = Math.max(50, 1e3 / 5);
    this.statusCoalesceTimer = setTimeout(() => {
      this.statusCoalesceTimer = null;
      this.pendingStatusCoalesce = false;
      this.emitStatus(false);
    }, delay);
  }
  emitStatus(force) {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (!force && shouldThrottleLiveActUiStatus(this.lastStatusEmitMs, now)) {
      this.scheduleCoalescedStatusEmit();
      return;
    }
    this.lastStatusEmitMs = now;
    const state = this.getState();
    for (const listener of this.statusListeners) {
      listener(state);
    }
  }
  emitFrame(frame) {
    for (const listener of this.frameListeners) {
      listener(frame);
    }
  }
  emitDiagnostics(frame) {
    for (const listener of this.diagnosticsListeners) {
      listener(frame);
    }
  }
  emitDiagnosticsV2(snapshot) {
    for (const listener of this.diagnosticsV2Listeners) {
      listener(snapshot);
    }
  }
  emitDenseFaceFeatures(frame) {
    for (const listener of this.denseFaceFeaturesListeners) {
      listener(frame);
    }
  }
  emitIrisGaze(gaze) {
    for (const listener of this.irisGazeListeners) {
      listener(gaze);
    }
  }
  emitHybridFace(frame) {
    for (const listener of this.hybridFaceListeners) {
      listener(frame);
    }
  }
};
function createIdleLiveActFrame() {
  return createNeutralLiveActFrame({ timestampMs: 0, sequence: 0, trackingLost: true });
}
export {
  LiveActEngine,
  createIdleLiveActFrame,
  getActiveLiveActEngine
};
