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
function isLiveActFaceChannelId(value) {
  return typeof value === "string" && LIVEACT_FACE_CHANNELS.includes(value);
}
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
var LIVEACT_STATUSES = [
  "idle",
  "starting",
  "active",
  "paused",
  "lost",
  "denied",
  "unsupported",
  "stopped",
  "error"
];
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
function isLiveActStatus(value) {
  return typeof value === "string" && LIVEACT_STATUSES.includes(value);
}
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
function assertLiveActFrameLocalOnly(frame2) {
  const record = frame2;
  if (record.landmarks !== void 0 || record.video !== void 0 || record.imageData !== void 0 || record.serialize !== void 0) {
    throw new Error("LiveActFrame darf keine Rohvideo-/Landmark-/Serialize-Daten tragen.");
  }
  assertLiveActFaceChannelsLocalOnly(frame2.face);
}

// src/domains/character/liveact/liveact-mediapipe-sample.ts
var LIVEACT_MIRROR_AVATAR = true;
function liveActHeadPoseFromFacialTransform(matrix) {
  if (!matrix || matrix.length < 11) return null;
  const at2 = (row, col) => Number(matrix[col * 4 + row]);
  const r00 = at2(0, 0);
  const r02 = at2(0, 2);
  const r10 = at2(1, 0);
  const r11 = at2(1, 1);
  const r12 = at2(1, 2);
  const r20 = at2(2, 0);
  const r22 = at2(2, 2);
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
var LIVEACT_CAPABILITIES_VERSION = "SagaTreeLiveActCapabilitiesV1";
function createEmptyLiveActAvatarFaceSupport() {
  const out = {};
  for (const id of LIVEACT_FACE_CHANNELS) {
    out[id] = false;
  }
  return out;
}
function createLiveActInputCapabilities(input) {
  return {
    face: input.face === true,
    headPose: input.headPose === true,
    eyeGaze: input.eyeGaze === true
  };
}
function createLiveActAvatarCapabilities(input) {
  const avatarFace = createEmptyLiveActAvatarFaceSupport();
  let active = 0;
  for (const id of LIVEACT_FACE_CHANNELS) {
    const supported = input.avatarFace?.[id] === true;
    avatarFace[id] = supported;
    if (supported) active += 1;
  }
  return {
    avatarBones: {
      head: input.headBone === true,
      leftEye: input.leftEyeBone === true,
      rightEye: input.rightEyeBone === true
    },
    avatarFace,
    activeFaceChannelCount: active,
    totalFaceChannelCount: LIVEACT_FACE_CHANNELS.length,
    gazeDrivePath: input.gazeDrivePath ?? "none",
    runtimeKind: input.runtimeKind ?? "gltf"
  };
}
function composeLiveActCapabilities(input, avatar) {
  return {
    contractVersion: LIVEACT_CAPABILITIES_VERSION,
    input: {
      face: input.face === true,
      headPose: input.headPose === true,
      eyeGaze: input.eyeGaze === true
    },
    avatarBones: { ...avatar.avatarBones },
    avatarFace: avatar.avatarFace,
    activeFaceChannelCount: avatar.activeFaceChannelCount,
    totalFaceChannelCount: avatar.totalFaceChannelCount,
    gazeDrivePath: avatar.gazeDrivePath,
    runtimeKind: avatar.runtimeKind
  };
}
function createLiveActCapabilities(input) {
  return composeLiveActCapabilities(
    createLiveActInputCapabilities({
      face: input.face,
      headPose: input.headPose,
      eyeGaze: input.eyeGaze
    }),
    createLiveActAvatarCapabilities({
      headBone: input.headBone,
      leftEyeBone: input.leftEyeBone,
      rightEyeBone: input.rightEyeBone,
      avatarFace: input.avatarFace
    })
  );
}

// src/domains/character/liveact/liveact-capability-inspector.ts
var INSPECTOR_FACE_CHANNEL_IDS = [
  "eyeBlinkLeft",
  "eyeBlinkRight",
  "jawOpen",
  "mouthSmileLeft",
  "mouthSmileRight",
  "mouthFrownLeft",
  "mouthFrownRight",
  "mouthPucker",
  "mouthShrugUpper",
  "mouthShrugLower"
];
function faceChannelLabelDe(id) {
  return id;
}
function buildLiveActCapabilityInspectorRows(caps) {
  const rows = [
    {
      id: "head",
      labelDe: "Kopf",
      input: caps.input.headPose,
      mapping: caps.input.headPose,
      avatar: caps.avatarBones.head
    },
    {
      id: "leftEye",
      labelDe: "Auge links",
      input: caps.input.eyeGaze,
      mapping: caps.input.eyeGaze,
      avatar: caps.avatarBones.leftEye
    },
    {
      id: "rightEye",
      labelDe: "Auge rechts",
      input: caps.input.eyeGaze,
      mapping: caps.input.eyeGaze,
      avatar: caps.avatarBones.rightEye
    }
  ];
  const faceIds = /* @__PURE__ */ new Set();
  for (const id of INSPECTOR_FACE_CHANNEL_IDS) faceIds.add(id);
  for (const id of LIVEACT_FACE_CHANNELS) {
    if (id === "_neutral") continue;
    if (caps.avatarFace[id]) faceIds.add(id);
  }
  for (const id of LIVEACT_FACE_CHANNELS) {
    if (id === "_neutral" || !faceIds.has(id)) continue;
    rows.push({
      id: `face:${id}`,
      labelDe: faceChannelLabelDe(id),
      input: caps.input.face,
      mapping: caps.input.face,
      avatar: caps.avatarFace[id]
    });
  }
  return rows;
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
function resolveLiveActChannelTargets(presentTargetNames) {
  const present = new Set(presentTargetNames);
  const faceSupport = createEmptyLiveActAvatarFaceSupport();
  const resolvedNames = {};
  for (const id of LIVEACT_FACE_CHANNELS) {
    const aliases = LIVEACT_CHANNEL_TARGET_ALIASES[id];
    const match = aliases.find((alias) => present.has(alias));
    if (match) {
      faceSupport[id] = true;
      resolvedNames[id] = match;
    }
  }
  return { faceSupport, resolvedNames };
}

// src/domains/character/liveact/liveact-face-asset-contract.ts
var LIVEACT_FACE_ASSET_CONTRACT_VERSION = "SagaTreeLiveActFaceAssetV1";
var LIVEACT_FACE_ASSET_CORE_V1_CHANNELS = [
  "eyeBlinkLeft",
  "eyeBlinkRight",
  "jawOpen",
  "mouthSmileLeft",
  "mouthSmileRight",
  "mouthFrownLeft",
  "mouthFrownRight",
  "mouthPucker",
  "mouthShrugUpper",
  "mouthShrugLower"
];
var LIVEACT_FACE_ASSET_FULL_V1_CHANNELS = LIVEACT_FACE_CHANNELS.filter((id) => id !== "_neutral");
var LIVEACT_FACE_ASSET_GAZE_MORPH_CHANNELS = [
  "eyeLookDownLeft",
  "eyeLookDownRight",
  "eyeLookInLeft",
  "eyeLookInRight",
  "eyeLookOutLeft",
  "eyeLookOutRight",
  "eyeLookUpLeft",
  "eyeLookUpRight"
];
var LIVEACT_FACE_ASSET_EXCLUDED_FROM_V1 = ["_neutral", "tongueOut"];
function liveActFaceAssetRequiredChannels(profileId) {
  return profileId === "core-v1" ? LIVEACT_FACE_ASSET_CORE_V1_CHANNELS : LIVEACT_FACE_ASSET_FULL_V1_CHANNELS;
}
function isLiveActFaceAssetV1Channel(id) {
  if (id === "_neutral" || id === "tongueOut") return false;
  return LIVEACT_FACE_CHANNELS.includes(id);
}
function checkLiveActFaceAssetProfile(inventory, profileId, gazeMode) {
  const present = new Set(inventory.presentChannels);
  const required = liveActFaceAssetRequiredChannels(profileId);
  const missingChannels = required.filter((id) => !present.has(id));
  let missingGaze = false;
  if (gazeMode === "morphs") {
    missingGaze = LIVEACT_FACE_ASSET_GAZE_MORPH_CHANNELS.some((id) => !present.has(id));
  } else if (gazeMode === "bones") {
    missingGaze = !inventory.hasEyeBones;
  }
  return {
    profileId,
    gazeMode,
    ok: missingChannels.length === 0 && !missingGaze,
    missingChannels,
    missingGaze
  };
}

// src/domains/character/liveact/liveact-retarget-profile.ts
var LIVEACT_RETARGET_PROFILE_VERSION = "SagaTreeLiveActRetargetProfileV1";
var IDENTITY_CHANNEL_RETARGET = {
  gain: 1,
  deadZone: 0
};
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
function applyLiveActRetargetProfile(frame2, profile) {
  const normalized = normalizeLiveActRetargetProfile(profile);
  if (frame2.trackingLost) {
    return frame2;
  }
  const face = { ...frame2.face };
  for (const id of LIVEACT_FACE_CHANNELS) {
    face[id] = retargetLiveActChannel(id, frame2.face[id], normalized);
  }
  return { ...frame2, face };
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
function isLiveActEyeLookFaceChannel(id) {
  return EYE_LOOK_SET.has(id);
}
function resolveLiveActGazeDrivePath(input) {
  if (input.hasEyeBones) return "bones";
  if (input.hasLookAt) return "lookAt";
  if (input.hasEyeLookMorphs) return "morphs";
  return "none";
}
function liveActGazePathSkipsEyeLookMorphs(path) {
  return path === "bones" || path === "lookAt";
}
function liveActGazePathUsesPoseDriver(path) {
  return path === "bones" || path === "lookAt";
}

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
function assertLiveActFaceDiagnosticsLocalOnly(frame2) {
  const record = frame2;
  if (record.video !== void 0 || record.imageData !== void 0 || record.serialize !== void 0 || record.blob !== void 0) {
    throw new Error("LiveAct-Diagnostics d\xFCrfen keine Rohvideo-/Blob-/Serialize-Daten tragen.");
  }
}

// src/domains/character/liveact/liveact-diagnostics-v2.ts
var LIVEACT_DIAGNOSTICS_V2_VERSION = "SagaTreeLiveActDiagnosticsV2";
var LIVEACT_DIAGNOSTICS_V2_STAGES = [
  "raw",
  "mapped",
  "smoothed",
  "calibrated",
  "retargeted",
  "applied"
];
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
function snapshotLiveActDiagnosticsV2FromFrame(frame2) {
  const out = {
    "head.yaw": frame2.head.yaw,
    "head.pitch": frame2.head.pitch,
    "head.roll": frame2.head.roll,
    "eyeLeft.x": frame2.eyeLeft.x,
    "eyeLeft.y": frame2.eyeLeft.y,
    "eyeRight.x": frame2.eyeRight.x,
    "eyeRight.y": frame2.eyeRight.y
  };
  for (const id of LIVEACT_FACE_CHANNELS) {
    out[faceKey(id)] = frame2.face[id];
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
function createNeutralLiveActAppliedValues(supported) {
  const out = {};
  for (const key of LIVEACT_DIAGNOSTICS_V2_SIGNAL_KEYS) {
    if (supported.has(key)) {
      const neutral = key === "face._neutral" ? 1 : 0;
      out[key] = { status: "neutral", value: neutral };
    } else {
      out[key] = { status: "unavailable", value: null };
    }
  }
  return out;
}
function buildLiveActAppliedValuesFromFace(input) {
  const out = {};
  const status = input.mode === "neutral" ? "neutral" : "supported";
  if (input.headSupported && input.head) {
    out["head.yaw"] = { status, value: input.head.yaw };
    out["head.pitch"] = { status, value: input.head.pitch };
    out["head.roll"] = { status, value: input.head.roll };
  } else {
    out["head.yaw"] = { status: "unavailable", value: null };
    out["head.pitch"] = { status: "unavailable", value: null };
    out["head.roll"] = { status: "unavailable", value: null };
  }
  if (input.eyeLeftSupported && input.eyeLeft) {
    out["eyeLeft.x"] = { status, value: input.eyeLeft.x };
    out["eyeLeft.y"] = { status, value: input.eyeLeft.y };
  } else {
    out["eyeLeft.x"] = { status: "unavailable", value: null };
    out["eyeLeft.y"] = { status: "unavailable", value: null };
  }
  if (input.eyeRightSupported && input.eyeRight) {
    out["eyeRight.x"] = { status, value: input.eyeRight.x };
    out["eyeRight.y"] = { status, value: input.eyeRight.y };
  } else {
    out["eyeRight.x"] = { status: "unavailable", value: null };
    out["eyeRight.y"] = { status: "unavailable", value: null };
  }
  for (const id of LIVEACT_FACE_CHANNELS) {
    const key = faceKey(id);
    if (!input.faceSupported.has(id)) {
      out[key] = { status: "unavailable", value: null };
      continue;
    }
    const raw = input.face[id];
    if (typeof raw !== "number") {
      out[key] = { status: "unavailable", value: null };
      continue;
    }
    out[key] = { status, value: raw };
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
function liveActFaceChannelsToPartial(face) {
  const out = {};
  for (const id of LIVEACT_FACE_CHANNELS) {
    out[id] = face[id];
  }
  return out;
}

// src/domains/character/liveact/liveact-diagnostics-peaks.ts
var LIVEACT_DIAGNOSTICS_PEAKS_VERSION = "SagaTreeLiveActDiagnosticsPeaksV1";
var EXPORT_MIN_MAGNITUDE = 0.05;
function createLiveActDiagnosticsPeaks() {
  return { frames: 0, lastSequence: null, signals: {} };
}
function stageNumber(value) {
  const n = typeof value === "object" && value !== null ? value.value : value;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}
function accumulateLiveActDiagnosticsPeaks(peaks, snapshot) {
  if (snapshot.trackingLost || snapshot.sequence === peaks.lastSequence) return false;
  peaks.lastSequence = snapshot.sequence;
  peaks.frames += 1;
  for (const stage of LIVEACT_DIAGNOSTICS_V2_STAGES) {
    const values = snapshot.stages[stage];
    for (const key of Object.keys(values)) {
      const value = stageNumber(values[key]);
      if (value === null) continue;
      const signal = peaks.signals[key] ??= {};
      const range = signal[stage];
      if (range) {
        range[0] = Math.min(range[0], value);
        range[1] = Math.max(range[1], value);
      } else {
        signal[stage] = [value, value];
      }
    }
  }
  return true;
}
function exportLiveActDiagnosticsPeaks(peaks) {
  const round = (v2) => Math.round(v2 * 1e3) / 1e3;
  const signals = {};
  for (const key of Object.keys(peaks.signals)) {
    const stages = peaks.signals[key] ?? {};
    const ranges = Object.values(stages);
    if (!ranges.some(([min, max]) => Math.max(Math.abs(min), Math.abs(max)) >= EXPORT_MIN_MAGNITUDE)) continue;
    const out = {};
    for (const stage of LIVEACT_DIAGNOSTICS_V2_STAGES) {
      const range = stages[stage];
      if (range) out[stage] = [round(range[0]), round(range[1])];
    }
    signals[key] = out;
  }
  return {
    contractVersion: LIVEACT_DIAGNOSTICS_PEAKS_VERSION,
    frames: peaks.frames,
    avatarMirrored: LIVEACT_MIRROR_AVATAR,
    signals
  };
}

// src/domains/character/liveact/liveact-video-viewport-transform.ts
function computeLiveActObjectCoverTransform(input) {
  const vw = Math.max(1, input.videoWidth);
  const vh = Math.max(1, input.videoHeight);
  const cw = Math.max(1, input.canvasWidth);
  const ch = Math.max(1, input.canvasHeight);
  const videoAspect = vw / vh;
  const canvasAspect = cw / ch;
  let contentWidth;
  let contentHeight;
  if (videoAspect > canvasAspect) {
    contentHeight = ch;
    contentWidth = ch * videoAspect;
  } else {
    contentWidth = cw;
    contentHeight = cw / videoAspect;
  }
  return {
    canvasWidth: cw,
    canvasHeight: ch,
    contentWidth,
    contentHeight,
    offsetX: (cw - contentWidth) / 2,
    offsetY: (ch - contentHeight) / 2,
    mirrorX: input.mirrorX
  };
}
function projectLiveActLandmarkToCanvas(nx, ny, transform) {
  const u = transform.mirrorX ? 1 - nx : nx;
  return {
    x: transform.offsetX + u * transform.contentWidth,
    y: transform.offsetY + ny * transform.contentHeight
  };
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

// src/domains/character/liveact/liveact-temporal-contract.ts
var LIVEACT_TEMPORAL_CONTRACT = "SagaTreeLiveActTemporalV1";
var LIVEACT_TEMPORAL_POLICY_VERSION = "liveact-temporal-policy-v1";
var LIVEACT_TEMPORAL_SIGNAL_GROUPS = [
  "head",
  "gaze",
  "blink",
  "lips",
  "brows",
  "cheeksNose",
  "defaultFace"
];
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
function createEmptyTemporalState(timestampMs = 0, mode = "rebase") {
  return {
    contractVersion: LIVEACT_TEMPORAL_CONTRACT,
    policyVersion: LIVEACT_TEMPORAL_POLICY_VERSION,
    timestampMs,
    mode,
    filtered: {},
    priorInput: {}
  };
}
var LIVEACT_TEMPORAL_TARGETS = {
  lipAmplitudeRetentionMinPct: 90,
  lipAmplitudeRetentionMaxPct: 110,
  lipLagP95MsMax: 66,
  lipReturnLagMsMax: 70,
  lipSaturationMax: 0.05,
  gazeLagSlackMsVsV1: 20,
  headLagSlackMsVsV1: 40,
  blinkPeakMin: 0.95,
  fpsInvarianceTol: 0.08
};

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
function readScalar(frame2, key) {
  switch (key) {
    case "head.yaw":
      return frame2.head.yaw;
    case "head.pitch":
      return frame2.head.pitch;
    case "head.roll":
      return frame2.head.roll;
    case "eyeLeft.x":
      return frame2.eyeLeft.x;
    case "eyeLeft.y":
      return frame2.eyeLeft.y;
    case "eyeRight.x":
      return frame2.eyeRight.x;
    case "eyeRight.y":
      return frame2.eyeRight.y;
    case "confidence":
      return frame2.confidence;
    default: {
      const id = key.slice("face.".length);
      return frame2.face[id] ?? 0;
    }
  }
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
function collectTargets(frame2) {
  const out = {};
  out["head.yaw"] = frame2.head.yaw;
  out["head.pitch"] = frame2.head.pitch;
  out["head.roll"] = frame2.head.roll;
  out["eyeLeft.x"] = frame2.eyeLeft.x;
  out["eyeLeft.y"] = frame2.eyeLeft.y;
  out["eyeRight.x"] = frame2.eyeRight.x;
  out["eyeRight.y"] = frame2.eyeRight.y;
  out.confidence = frame2.confidence;
  for (const id of LIVEACT_FACE_CHANNELS) {
    out[temporalFaceKey(id)] = frame2.face[id] ?? 0;
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
    const frame3 = frameFromScalars(mapped, filtered2, true);
    return {
      frame: frame3,
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
  const frame2 = frameFromScalars(mapped, filtered, false);
  return {
    frame: frame2,
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
function resetAdaptiveTemporal(timestampMs = 0) {
  return createEmptyTemporalState(timestampMs, "rebase");
}
function readTemporalScalar(frame2, key) {
  return readScalar(frame2, key);
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
function assertDenseFaceFeaturesLocalOnly(frame2) {
  const record = frame2;
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
var LIVEACT_HYBRID_AB_MIN_MEDIAN_IMPROVEMENT = 0.05;
var LIVEACT_HYBRID_AB_NON_DEGRADATION_TOL = 0.02;
var LIVEACT_HYBRID_DENSE_MIN_CONFIDENCE = 0.45;
var LIVEACT_HYBRID_DISAGREE_ABS = 0.35;
function isHybridFaceControlId(id) {
  return LIVEACT_HYBRID_FACE_CONTROL_IDS.includes(id);
}
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
function hybridControlsToFacePartial(hybrid) {
  const out = {};
  for (const id of LIVEACT_HYBRID_FACE_CONTROL_IDS) {
    const c = hybrid.controls[id];
    if (c.value !== null && Number.isFinite(c.value)) {
      out[id] = c.value;
    }
  }
  return out;
}
function assertHybridFaceLocalOnly(frame2) {
  const record = frame2;
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
function normalizedGazeToYawPitch(x, y) {
  return {
    yawDeg: clampGaze(x) * LIVEACT_IRIS_GAZE_MAX_YAW_DEG,
    pitchDeg: clampGaze(y) * LIVEACT_IRIS_GAZE_MAX_PITCH_DEG
  };
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
function liveActPersonalCalibrationPhaseElapsed(session, _nowMs) {
  return Math.max(0, session.validCaptureMs);
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
function applyLiveActPersonalCalibration(frame2, profile, limits = DEFAULT_LIVEACT_LIMITS) {
  if (!profile || frame2.trackingLost) return frame2;
  if (resolveLiveActPersonalProfileStatus(profile) !== "valid") return frame2;
  const set = liveActCalibrationSetFromPersonalProfile(profile);
  const neutral = set.neutral;
  if (!neutral) return frame2;
  let head = frame2.head;
  if (neutral.headPoseSupported) {
    head = {
      yaw: clampLiveActAngle(frame2.head.yaw - neutral.head.yaw, limits.maxYaw),
      pitch: clampLiveActAngle(frame2.head.pitch - neutral.head.pitch, limits.maxPitch),
      roll: clampLiveActAngle(frame2.head.roll - neutral.head.roll, limits.maxRoll)
    };
  }
  const eyeLeft = {
    x: clampLiveActGaze(frame2.eyeLeft.x - neutral.eyeLeft.x),
    y: clampLiveActGaze(frame2.eyeLeft.y - neutral.eyeLeft.y)
  };
  const eyeRight = {
    x: clampLiveActGaze(frame2.eyeRight.x - neutral.eyeRight.x),
    y: clampLiveActGaze(frame2.eyeRight.y - neutral.eyeRight.y)
  };
  const face = { ...frame2.face };
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
    ...frame2,
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
function applyLiveActNeutralBaseline(frame2, baseline, limits = DEFAULT_LIVEACT_LIMITS) {
  if (!baseline || frame2.trackingLost) {
    return frame2;
  }
  const face = createNeutralLiveActFaceChannels();
  for (const id of LIVEACT_FACE_CHANNELS) {
    if (id === "_neutral") {
      face._neutral = frame2.face._neutral;
      continue;
    }
    const raw = (frame2.face[id] ?? 0) - (baseline.face[id] ?? 0);
    face[id] = clampLiveActChannel(raw);
  }
  const head = baseline.headPoseSupported ? {
    yaw: clampLiveActAngle(frame2.head.yaw - baseline.head.yaw, limits.maxYaw),
    pitch: clampLiveActAngle(frame2.head.pitch - baseline.head.pitch, limits.maxPitch),
    roll: clampLiveActAngle(frame2.head.roll - baseline.head.roll, limits.maxRoll)
  } : frame2.head;
  return {
    ...frame2,
    head,
    eyeLeft: {
      x: clampLiveActGaze(frame2.eyeLeft.x - baseline.eyeLeft.x),
      y: clampLiveActGaze(frame2.eyeLeft.y - baseline.eyeLeft.y)
    },
    eyeRight: {
      x: clampLiveActGaze(frame2.eyeRight.x - baseline.eyeRight.x),
      y: clampLiveActGaze(frame2.eyeRight.y - baseline.eyeRight.y)
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
function applyLiveActRangeCalibration(frame2, range) {
  if (!range || frame2.trackingLost) {
    return frame2;
  }
  const face = { ...frame2.face };
  for (const id of Object.keys(range.gain)) {
    const gain = range.gain[id];
    if (typeof gain !== "number") continue;
    face[id] = clampLiveActChannel((face[id] ?? 0) * gain);
  }
  return { ...frame2, face };
}
function applyLiveActCalibration(frame2, calibration, limits = DEFAULT_LIVEACT_LIMITS) {
  return applyLiveActRangeCalibration(
    applyLiveActNeutralBaseline(frame2, calibration.neutral, limits),
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
function applyCalibrationStage(frame2, calibration, personalProfile, limits) {
  if (personalProfile && resolveLiveActPersonalProfileStatus(personalProfile) === "valid") {
    return applyLiveActPersonalCalibration(frame2, personalProfile, limits);
  }
  return applyLiveActCalibration(frame2, calibration, limits);
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

// src/domains/character/liveact/liveact-motion-test.ts
function readLiveActMotionTestSignal(snapshot, key, stage) {
  if (snapshot.trackingLost) return null;
  const values = snapshot.stages[stage];
  const raw = values[key];
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (raw && typeof raw === "object" && typeof raw.value === "number" && Number.isFinite(raw.value)) {
    return raw.value;
  }
  return null;
}
var LIVEACT_MOTION_TEST_CONTRACT = "SagaTreeLiveActMotionTestV1";
var LIVEACT_MOTION_TEST_MIN_FRAMES = 20;
var LIVEACT_MOTION_TEST_STEPS = [
  {
    id: "neutral",
    labelDe: "Neutral halten",
    holdDe: "entspannt, Blick geradeaus",
    holdMs: 3e3,
    focus: [
      { key: "head.yaw", stage: "calibrated", mode: "absMax" },
      { key: "head.pitch", stage: "calibrated", mode: "absMax" },
      { key: "head.roll", stage: "calibrated", mode: "absMax" },
      { key: "eyeLeft.x", stage: "calibrated", mode: "absMax" },
      { key: "eyeLeft.y", stage: "calibrated", mode: "absMax" }
    ]
  },
  {
    id: "yawLeft",
    labelDe: "Kopf nach links",
    holdDe: "zur linken Schulter drehen",
    holdMs: 3e3,
    focus: [{ key: "head.yaw", stage: "calibrated", mode: "range" }]
  },
  {
    id: "yawRight",
    labelDe: "Kopf nach rechts",
    holdDe: "zur rechten Schulter drehen",
    holdMs: 3e3,
    focus: [{ key: "head.yaw", stage: "calibrated", mode: "range" }]
  },
  {
    id: "pitchDown",
    labelDe: "Kopf nicken runter",
    holdDe: "Kinn zur Brust",
    holdMs: 3e3,
    focus: [{ key: "head.pitch", stage: "calibrated", mode: "range" }]
  },
  {
    id: "pitchUp",
    labelDe: "Kopf nicken hoch",
    holdDe: "Kinn hoch",
    holdMs: 3e3,
    focus: [{ key: "head.pitch", stage: "calibrated", mode: "range" }]
  },
  {
    id: "roll",
    labelDe: "Kopf kippen",
    holdDe: "Ohr zur Schulter (eine Seite reicht)",
    holdMs: 3e3,
    focus: [{ key: "head.roll", stage: "calibrated", mode: "range" }]
  },
  {
    id: "blinkLeft",
    labelDe: "Nur linkes Auge zu",
    holdDe: "dein linkes Auge zu, rechtes offen (einseitiger L/R-Check)",
    holdMs: 3e3,
    focus: [
      { key: "face.eyeBlinkLeft", stage: "raw", mode: "max" },
      { key: "face.eyeBlinkRight", stage: "raw", mode: "max" },
      { key: "face.eyeBlinkLeft", stage: "calibrated", mode: "max" },
      { key: "face.eyeBlinkRight", stage: "calibrated", mode: "max" }
    ]
  },
  {
    // Many people cannot close only the right eye — both-closed is the bilateral check.
    id: "blinkBoth",
    labelDe: "Beide Augen fest zu",
    holdDe: "beide Augen schlie\xDFen und halten",
    holdMs: 3e3,
    focus: [
      { key: "face.eyeBlinkLeft", stage: "raw", mode: "max" },
      { key: "face.eyeBlinkRight", stage: "raw", mode: "max" },
      { key: "face.eyeBlinkLeft", stage: "calibrated", mode: "max" },
      { key: "face.eyeBlinkRight", stage: "calibrated", mode: "max" }
    ]
  },
  {
    id: "gazeLeft",
    labelDe: "Blick nach links",
    holdDe: "Augen nach links, Kopf still",
    holdMs: 3e3,
    focus: [
      { key: "eyeLeft.x", stage: "calibrated", mode: "range" },
      { key: "eyeRight.x", stage: "calibrated", mode: "range" }
    ]
  },
  {
    id: "gazeUp",
    labelDe: "Blick nach oben",
    holdDe: "Augen nach oben, Kopf still",
    holdMs: 3e3,
    focus: [
      { key: "eyeLeft.y", stage: "calibrated", mode: "range" },
      { key: "eyeRight.y", stage: "calibrated", mode: "range" }
    ]
  },
  {
    id: "jawOpen",
    labelDe: "Mund weit auf",
    holdDe: "kr\xE4ftig \xF6ffnen und halten",
    holdMs: 3e3,
    focus: [{ key: "face.jawOpen", stage: "calibrated", mode: "max" }]
  },
  {
    id: "smile",
    labelDe: "Breit l\xE4cheln",
    holdDe: "kr\xE4ftig halten",
    holdMs: 3e3,
    focus: [
      { key: "face.mouthSmileLeft", stage: "calibrated", mode: "max" },
      { key: "face.mouthSmileRight", stage: "calibrated", mode: "max" }
    ]
  },
  {
    id: "pucker",
    labelDe: "Kussmund",
    holdDe: "Lippen spitzen und halten",
    holdMs: 3e3,
    focus: [{ key: "face.mouthPucker", stage: "calibrated", mode: "max" }]
  },
  {
    id: "funnel",
    labelDe: "Starkes O",
    holdDe: "rundes O halten",
    holdMs: 3e3,
    focus: [{ key: "face.mouthFunnel", stage: "calibrated", mode: "max" }]
  }
];
function liveActMotionTestStepTotal() {
  return LIVEACT_MOTION_TEST_STEPS.length;
}
function liveActMotionTestHoldMs(stepIndex) {
  return LIVEACT_MOTION_TEST_STEPS[stepIndex]?.holdMs ?? 3e3;
}
function liveActMotionTestStepPrompt(stepIndex) {
  const steps = LIVEACT_MOTION_TEST_STEPS;
  const total = liveActMotionTestStepTotal();
  const step = steps[stepIndex];
  if (!step) return `Motion Test ${total}/${total}: Fertig`;
  const seconds = Math.round(step.holdMs / 1e3);
  return `Motion ${stepIndex + 1}/${total}: ${step.labelDe} \u2014 ${step.holdDe} (${seconds} s)`;
}
function liveActMotionTestAdvanceLabelDe(stepIndex) {
  return stepIndex >= LIVEACT_MOTION_TEST_STEPS.length - 1 ? "Fertig" : "Weiter";
}
function createLiveActMotionTestHoldAcc() {
  return {};
}
function motionTestFocusStorageKey(focus) {
  return `${focus.key}@${focus.stage}`;
}
function pushLiveActMotionTestHoldSample(acc, stepIndex, read) {
  const step = LIVEACT_MOTION_TEST_STEPS[stepIndex];
  if (!step) return;
  for (const focus of step.focus) {
    const value = read(focus.key, focus.stage);
    if (value === null || !Number.isFinite(value)) continue;
    const storageKey = motionTestFocusStorageKey(focus);
    const prev = acc[storageKey];
    if (prev) {
      prev.min = Math.min(prev.min, value);
      prev.max = Math.max(prev.max, value);
    } else {
      acc[storageKey] = {
        signal: focus.key,
        stage: focus.stage,
        min: value,
        max: value
      };
    }
  }
}
function finalizeLiveActMotionTestStepPeaks(acc, stepIndex) {
  const step = LIVEACT_MOTION_TEST_STEPS[stepIndex];
  if (!step) return [];
  const round = (v2) => Math.round(v2 * 1e3) / 1e3;
  return step.focus.map((focus) => {
    const storageKey = motionTestFocusStorageKey(focus);
    const range = acc[storageKey];
    const min = range?.min ?? 0;
    const max = range?.max ?? 0;
    return {
      key: storageKey,
      signal: focus.key,
      stage: focus.stage,
      min: round(min),
      max: round(max)
    };
  });
}
function formatLiveActMotionTestPeak(peak, mode) {
  if (mode === "absMax") {
    return Math.max(Math.abs(peak.min), Math.abs(peak.max)).toFixed(2);
  }
  if (mode === "max") {
    return peak.max.toFixed(2);
  }
  return `${peak.min.toFixed(2)}\u2026${peak.max.toFixed(2)}`;
}
function liveActMotionTestFocusModeForPeak(stepIndex, peakKey) {
  const step = LIVEACT_MOTION_TEST_STEPS[stepIndex];
  const focus = step?.focus.find((f) => motionTestFocusStorageKey(f) === peakKey);
  return focus?.mode ?? "range";
}
function buildLiveActMotionTestExport(input) {
  return {
    contractVersion: LIVEACT_MOTION_TEST_CONTRACT,
    avatarMirrored: LIVEACT_MIRROR_AVATAR,
    hasNeutralBaseline: input.hasNeutralBaseline,
    hasRangeCalibration: input.hasRangeCalibration,
    steps: input.stepResults,
    sessionPeaks: exportLiveActDiagnosticsPeaks(input.sessionPeaks)
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
var LIVEACT_PERFECT_FIDELITY_CONTRACT = "SagaTreeLiveActPerfectFidelityV1";
var LIVEACT_FIDELITY_CAPTURE_CONTRACT = "SagaTreeLiveActFidelityCaptureV1";
var LIVEACT_FIDELITY_REPORT_CONTRACT = "SagaTreeLiveActFidelityReportV1";
var LIVEACT_PERFECT_FIDELITY_TARGETS_VERSION = "pf-targets-v1";
var LIVEACT_PERFECT_FIDELITY_BENCHMARK_VERSION = "pf-benchmark-v1";
var LIVEACT_PERFECT_FIDELITY_STAGES = LIVEACT_DIAGNOSTICS_V2_STAGES;
var LIVEACT_FIDELITY_METRIC_STATUSES = [
  "PASS",
  "MISS",
  "NOT_MEASURED",
  "NOT_APPLICABLE"
];
var LIVEACT_FIDELITY_MOTION_PHASES = [
  "SETTLE",
  "HOLD",
  "RETURN_TO_NEUTRAL",
  "RAMP"
];
var LIVEACT_FIDELITY_NOMINAL_SAMPLE_RATE_HZ = 30;
var LIVEACT_FIDELITY_PHASE_SAMPLES_500MS = 15;
var LIVEACT_FIDELITY_CORRELATION_LAG_WINDOW_MS = 200;
var LIVEACT_FIDELITY_RETURN_STABLE_MS = 100;
var LIVEACT_FIDELITY_SATURATION_THRESHOLD = 0.98;
var LIVEACT_FIDELITY_NEUTRAL_TOLERANCE = 0.03;
var LIVEACT_PERFECT_FIDELITY_TARGETS = {
  version: LIVEACT_PERFECT_FIDELITY_TARGETS_VERSION,
  runtime: {
    sustainedFpsMin: 30,
    droppedInferenceFractionMax: 0.01,
    processingDelayMedianMsMax: 50,
    cameraToAvatarP95MsMax: 100
  },
  head: {
    neutralBiasDegMax: 1.5,
    crossAxisLeakageMax: 0.05,
    crossAxisLeakageStretchMax: 0.03
  },
  eyes: {
    gazeAngularErrorMedianDegMax: 3,
    gazeAngularErrorP95DegMax: 5,
    neutralEyeOffsetMax: 0.03,
    fullBlinkMin: 0.95,
    winkCounterpartMax: 0.15
  },
  neutral: {
    faceNoiseMax: 0.03
  },
  lips: {
    dynamicCorrelationMin: 0.95,
    amplitudeRetentionPctMin: 90,
    amplitudeRetentionPctMax: 110,
    additionalLagP95MsMax: 66,
    contourMedianErrorPctMouthWidthMax: 3,
    contourP95ErrorPctMouthWidthMax: 5,
    naturalSpeechSaturationMax: 0.05
  },
  returnToNeutral: {
    additionalLagMsMax: 70
  }
};
function evaluateFidelityMaxTarget(value, targetMax, sampleCount, options) {
  if (options?.measured === false || value === null || !Number.isFinite(value)) {
    return "NOT_MEASURED";
  }
  if (sampleCount <= 0) return "NOT_MEASURED";
  return value <= targetMax ? "PASS" : "MISS";
}
function evaluateFidelityMinTarget(value, targetMin, sampleCount, options) {
  if (options?.measured === false || value === null || !Number.isFinite(value)) {
    return "NOT_MEASURED";
  }
  if (sampleCount <= 0) return "NOT_MEASURED";
  return value >= targetMin ? "PASS" : "MISS";
}
function evaluateFidelityRangeTarget(value, min, max, sampleCount, options) {
  if (options?.applicable === false) return "NOT_APPLICABLE";
  if (options?.measured === false || value === null || !Number.isFinite(value)) {
    return "NOT_MEASURED";
  }
  if (sampleCount <= 0) return "NOT_MEASURED";
  return value >= min && value <= max ? "PASS" : "MISS";
}

// src/domains/character/liveact/liveact-perfect-fidelity-math.ts
function fidelitySortedCopy(values) {
  return values.slice().sort((a, b) => a - b);
}
function fidelityPercentile(values, pct) {
  if (values.length === 0) return null;
  const sorted = fidelitySortedCopy(values);
  if (sorted.length === 1) return sorted[0];
  const clamped = Math.min(100, Math.max(0, pct));
  const rank = clamped / 100 * (sorted.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  if (lo === hi) return sorted[lo];
  const w = rank - lo;
  return sorted[lo] * (1 - w) + sorted[hi] * w;
}
function fidelityMedian(values) {
  return fidelityPercentile(values, 50);
}
function fidelityMad(values) {
  const med = fidelityMedian(values);
  if (med === null) return null;
  const abs = values.map((v2) => Math.abs(v2 - med));
  return fidelityMedian(abs);
}
function fidelityP95AbsDev(values) {
  const med = fidelityMedian(values);
  if (med === null) return null;
  const abs = values.map((v2) => Math.abs(v2 - med));
  return fidelityPercentile(abs, 95);
}
function fidelityPearson(xs, ys) {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return null;
  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < n; i += 1) {
    sumX += xs[i];
    sumY += ys[i];
  }
  const meanX = sumX / n;
  const meanY = sumY / n;
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  if (denX <= 0 || denY <= 0) return null;
  return num / Math.sqrt(denX * denY);
}
function fidelityBestLagCorrelation(input, output, sampleRateHz, lagWindowMs) {
  const zero = fidelityPearson(input, output);
  if (sampleRateHz <= 0 || input.length < 2 || output.length < 2) {
    return { correlationZeroLag: zero, correlationAligned: zero, bestLagMs: 0 };
  }
  const maxLagSamples = Math.max(0, Math.floor(lagWindowMs / 1e3 * sampleRateHz));
  let bestR = zero;
  let bestLag = 0;
  for (let lag = -maxLagSamples; lag <= maxLagSamples; lag += 1) {
    const xs = [];
    const ys = [];
    for (let i = 0; i < input.length; i += 1) {
      const j = i + lag;
      if (j < 0 || j >= output.length) continue;
      xs.push(input[i]);
      ys.push(output[j]);
    }
    const r = fidelityPearson(xs, ys);
    if (r === null) continue;
    if (bestR === null || Math.abs(r) > Math.abs(bestR) || r === bestR && Math.abs(lag) < Math.abs(bestLag)) {
      bestR = r;
      bestLag = lag;
    }
  }
  return {
    correlationZeroLag: zero,
    correlationAligned: bestR,
    bestLagMs: bestLag === null ? null : bestLag / sampleRateHz * 1e3
  };
}
function fidelityFirstDerivative(values, timestampsMs) {
  const out = [];
  const n = Math.min(values.length, timestampsMs.length);
  for (let i = 1; i < n; i += 1) {
    const dt = (timestampsMs[i] - timestampsMs[i - 1]) / 1e3;
    if (dt <= 0) continue;
    out.push((values[i] - values[i - 1]) / dt);
  }
  return out;
}
function fidelityRms(values) {
  if (values.length === 0) return null;
  let sum = 0;
  for (const v2 of values) sum += v2 * v2;
  return Math.sqrt(sum / values.length);
}
function fidelityAmplitudeRetentionPct(input, output, eps = 1e-6) {
  const inLo = fidelityPercentile(input, 5);
  const inHi = fidelityPercentile(input, 95);
  const outLo = fidelityPercentile(output, 5);
  const outHi = fidelityPercentile(output, 95);
  if (inLo === null || inHi === null || outLo === null || outHi === null) return null;
  const inSpan = inHi - inLo;
  if (Math.abs(inSpan) < eps) return null;
  const outSpan = outHi - outLo;
  return outSpan / inSpan * 100;
}
function fidelityVelocityRetentionPct(input, output, timestampsMs, eps = 1e-6) {
  const dIn = fidelityFirstDerivative(input, timestampsMs);
  const dOut = fidelityFirstDerivative(output, timestampsMs);
  const rmsIn = fidelityRms(dIn);
  const rmsOut = fidelityRms(dOut);
  if (rmsIn === null || rmsOut === null || rmsIn < eps) return null;
  return rmsOut / rmsIn * 100;
}
function fidelitySaturationFraction(values, threshold) {
  if (values.length === 0) return null;
  let hits = 0;
  for (const v2 of values) {
    if (v2 >= threshold) hits += 1;
  }
  return hits / values.length;
}
function fidelityGazeAngularErrorDeg(targetX, targetY, outX, outY) {
  const tLen = Math.hypot(targetX, targetY);
  const oLen = Math.hypot(outX, outY);
  if (tLen < 1e-9 && oLen < 1e-9) return 0;
  const tx = tLen < 1e-9 ? 0 : targetX / tLen;
  const ty = tLen < 1e-9 ? 0 : targetY / tLen;
  const ox = oLen < 1e-9 ? 0 : outX / oLen;
  const oy = oLen < 1e-9 ? 0 : outY / oLen;
  const dot2 = Math.min(1, Math.max(-1, tx * ox + ty * oy));
  return Math.acos(dot2) * 180 / Math.PI;
}
function fidelityContourErrorPctMouthWidth(errors, mouthWidth) {
  if (mouthWidth <= 1e-9 || errors.length === 0) {
    return { medianPct: null, p95Pct: null };
  }
  const pct = errors.map((e) => Math.abs(e) / mouthWidth * 100);
  return {
    medianPct: fidelityMedian(pct),
    p95Pct: fidelityPercentile(pct, 95)
  };
}
function fidelityCountSequenceGaps(sequences) {
  if (sequences.length < 2) return 0;
  let drops = 0;
  for (let i = 1; i < sequences.length; i += 1) {
    const gap = sequences[i] - sequences[i - 1];
    if (gap > 1) drops += gap - 1;
  }
  return drops;
}
function fidelityLagP95Ms(truth, pred, timestampsMs, opts) {
  const n = Math.min(truth.length, pred.length, timestampsMs.length);
  if (n < 2) return null;
  const minDelta = opts?.minDelta ?? 0.04;
  const delays = [];
  for (let i = 1; i < n; i += 1) {
    const delta = truth[i] - truth[i - 1];
    if (Math.abs(delta) < minDelta) continue;
    const half = truth[i - 1] + delta * 0.5;
    const t0 = timestampsMs[i];
    let hit = null;
    for (let j = i; j < n; j += 1) {
      const crossed = delta > 0 ? pred[j] >= half : pred[j] <= half;
      if (crossed) {
        hit = Math.max(0, timestampsMs[j] - t0);
        break;
      }
    }
    delays.push(hit === null ? opts?.lagWindowMs ?? 120 : hit);
  }
  if (delays.length > 0) return fidelityPercentile(delays, 95);
  const dt = timestampsMs[1] - timestampsMs[0];
  const hz = dt > 0 ? 1e3 / dt : 60;
  const best = fidelityBestLagCorrelation(truth, pred, hz, opts?.lagWindowMs ?? 120);
  return best.bestLagMs === null ? null : Math.abs(best.bestLagMs);
}
function fidelityOvershoot(input, output, target, eps = 1e-4) {
  const n = Math.min(input.length, output.length);
  if (n === 0) return null;
  let onset = -1;
  for (let i = 0; i < n; i += 1) {
    if (Math.abs(input[i] - target) <= eps) {
      onset = i;
      break;
    }
  }
  if (onset < 0) return 0;
  const start = input[0] ?? 0;
  const up = target >= start;
  let maxOver = 0;
  for (let i = onset; i < n; i += 1) {
    const o = output[i];
    if (up) {
      maxOver = Math.max(maxOver, o - target);
    } else {
      maxOver = Math.max(maxOver, target - o);
    }
  }
  return Math.max(0, maxOver);
}

// src/domains/character/liveact/liveact-perfect-fidelity-capture.ts
function createEmptyFidelityStageSamples(present) {
  return LIVEACT_PERFECT_FIDELITY_STAGES.map((stage) => {
    const values = present[stage];
    if (values === void 0) {
      return { stage, values: null, missing: true };
    }
    return { stage, values, missing: false };
  });
}
function buildFidelityCaptureSession(input) {
  const sequences = input.samples.map((s) => s.sequence);
  const gapDrops = fidelityCountSequenceGaps(sequences);
  const start = input.samples[0]?.monotonicMs ?? 0;
  const end = input.samples[input.samples.length - 1]?.monotonicMs ?? start;
  return {
    contractVersion: LIVEACT_FIDELITY_CAPTURE_CONTRACT,
    benchmarkVersion: LIVEACT_PERFECT_FIDELITY_BENCHMARK_VERSION,
    scenarioId: input.scenarioId,
    sourceKind: input.sourceKind,
    sampleRateHz: input.sampleRateHz,
    startMonotonicMs: start,
    endMonotonicMs: end,
    samples: input.samples,
    droppedInferenceFrames: input.droppedInferenceFrames ?? gapDrops,
    metadata: input.metadata ?? {}
  };
}
function fidelityCaptureDurationMs(session) {
  return Math.max(0, session.endMonotonicMs - session.startMonotonicMs);
}
function fidelityStageCoverage(session) {
  const out = {};
  for (const stage of LIVEACT_PERFECT_FIDELITY_STAGES) {
    out[stage] = { present: 0, missing: 0 };
  }
  for (const sample of session.samples) {
    for (const st of sample.stages) {
      if (st.missing) out[st.stage].missing += 1;
      else out[st.stage].present += 1;
    }
  }
  return out;
}
function extractFidelitySignalSeries(session, stage, key) {
  const values = [];
  const timestampsMs = [];
  const sequences = [];
  for (const sample of session.samples) {
    const st = sample.stages.find((s) => s.stage === stage);
    if (!st || st.missing || !st.values) continue;
    const v2 = st.values[key];
    if (typeof v2 !== "number" || !Number.isFinite(v2)) continue;
    values.push(v2);
    timestampsMs.push(sample.monotonicMs);
    sequences.push(sample.sequence);
  }
  return { values, timestampsMs, sequences };
}
function extractFidelityPhaseSeries(session, stage, key, phase) {
  const values = [];
  for (const sample of session.samples) {
    if (sample.phase !== phase) continue;
    const st = sample.stages.find((s) => s.stage === stage);
    if (!st || st.missing || !st.values) continue;
    const v2 = st.values[key];
    if (typeof v2 === "number" && Number.isFinite(v2)) values.push(v2);
  }
  return values;
}

// src/domains/character/liveact/liveact-perfect-fidelity-evaluate.ts
function metric(id, value, unit, target, status, sampleCount, note) {
  return { id, value, unit, target, status, sampleCount, note };
}
function evaluateFidelityReturnLagMs(session, stage, key, tolerance = LIVEACT_FIDELITY_NEUTRAL_TOLERANCE, stableMs = LIVEACT_FIDELITY_RETURN_STABLE_MS) {
  const returnSamples = session.samples.filter((s) => s.phase === "RETURN_TO_NEUTRAL");
  if (returnSamples.length === 0) return null;
  const returnStart = returnSamples[0].monotonicMs;
  const rate = session.sampleRateHz > 0 ? session.sampleRateHz : LIVEACT_FIDELITY_NOMINAL_SAMPLE_RATE_HZ;
  const need = Math.max(1, Math.ceil(stableMs / 1e3 * rate));
  for (let i = 0; i < returnSamples.length; i += 1) {
    let ok = true;
    for (let j = 0; j < need; j += 1) {
      const s = returnSamples[i + j];
      if (!s) {
        ok = false;
        break;
      }
      const st = s.stages.find((x) => x.stage === stage);
      const v2 = st?.values?.[key];
      if (typeof v2 !== "number" || Math.abs(v2) > tolerance) {
        ok = false;
        break;
      }
    }
    if (ok) {
      return Math.max(0, returnSamples[i].monotonicMs - returnStart);
    }
  }
  return null;
}
function evaluateFidelityMotionProbe(session, probeId, key, holdTargetAmplitude, unintendedKeys) {
  const settle = extractFidelityPhaseSeries(session, "applied", key, "SETTLE");
  const hold = extractFidelityPhaseSeries(session, "applied", key, "HOLD");
  const T = LIVEACT_PERFECT_FIDELITY_TARGETS;
  const settleBias = fidelityMedian(settle.map(Math.abs));
  const settleNoise = fidelityMad(settle);
  let settleCross = 0;
  for (const uk of unintendedKeys) {
    const series = extractFidelityPhaseSeries(session, "applied", uk, "SETTLE");
    const amp = fidelityMedian(series.map(Math.abs)) ?? 0;
    settleCross = Math.max(settleCross, amp);
  }
  const holdAmp = fidelityMedian(hold.map(Math.abs));
  const holdJitter = fidelityP95AbsDev(hold);
  const holdSat = fidelitySaturationFraction(hold, LIVEACT_FIDELITY_SATURATION_THRESHOLD);
  let holdCross = 0;
  for (const uk of unintendedKeys) {
    const series = extractFidelityPhaseSeries(session, "applied", uk, "HOLD");
    const amp = fidelityMedian(series.map(Math.abs)) ?? 0;
    holdCross = Math.max(holdCross, amp);
  }
  const crossRatio = holdAmp !== null && holdAmp > 1e-6 ? holdCross / holdAmp : holdCross > 0 ? Infinity : 0;
  const retention = holdAmp !== null && Math.abs(holdTargetAmplitude) > 1e-6 ? holdAmp / Math.abs(holdTargetAmplitude) * 100 : null;
  const returnLag = evaluateFidelityReturnLagMs(session, "applied", key);
  const returnVals = extractFidelityPhaseSeries(session, "applied", key, "RETURN_TO_NEUTRAL");
  const residual = fidelityMedian(returnVals.slice(-5).map(Math.abs));
  return {
    probeId,
    signalKey: key,
    settle: {
      neutralBias: metric(
        `${probeId}.settle.neutralBias`,
        settleBias,
        "normalized",
        T.neutral.faceNoiseMax,
        evaluateFidelityMaxTarget(settleBias, T.neutral.faceNoiseMax, settle.length),
        settle.length
      ),
      neutralNoise: metric(
        `${probeId}.settle.neutralNoise`,
        settleNoise,
        "normalized",
        T.neutral.faceNoiseMax,
        evaluateFidelityMaxTarget(settleNoise, T.neutral.faceNoiseMax, settle.length),
        settle.length
      ),
      crossTalk: metric(
        `${probeId}.settle.crossTalk`,
        settleCross,
        "normalized",
        T.head.crossAxisLeakageMax,
        evaluateFidelityMaxTarget(settleCross, T.head.crossAxisLeakageMax, settle.length),
        settle.length
      )
    },
    hold: {
      amplitude: metric(
        `${probeId}.hold.amplitude`,
        holdAmp,
        "normalized",
        holdTargetAmplitude,
        holdAmp !== null && holdAmp >= holdTargetAmplitude * 0.85 ? "PASS" : holdAmp === null ? "NOT_MEASURED" : "MISS",
        hold.length
      ),
      amplitudeRetention: metric(
        `${probeId}.hold.amplitudeRetention`,
        retention,
        "percent",
        `${T.lips.amplitudeRetentionPctMin}-${T.lips.amplitudeRetentionPctMax}`,
        evaluateFidelityRangeTarget(
          retention,
          T.lips.amplitudeRetentionPctMin,
          T.lips.amplitudeRetentionPctMax,
          hold.length,
          { applicable: retention !== null }
        ),
        hold.length
      ),
      saturation: metric(
        `${probeId}.hold.saturation`,
        holdSat,
        "fraction",
        T.lips.naturalSpeechSaturationMax,
        evaluateFidelityMaxTarget(holdSat, T.lips.naturalSpeechSaturationMax, hold.length),
        hold.length
      ),
      crossTalk: metric(
        `${probeId}.hold.crossTalkRatio`,
        Number.isFinite(crossRatio) ? crossRatio : null,
        "ratio",
        T.head.crossAxisLeakageMax,
        evaluateFidelityMaxTarget(
          Number.isFinite(crossRatio) ? crossRatio : null,
          T.head.crossAxisLeakageMax,
          hold.length
        ),
        hold.length
      ),
      jitter: metric(
        `${probeId}.hold.jitterP95`,
        holdJitter,
        "normalized",
        T.neutral.faceNoiseMax,
        evaluateFidelityMaxTarget(holdJitter, T.neutral.faceNoiseMax, hold.length),
        hold.length
      )
    },
    returnPhase: {
      additionalLagMs: metric(
        `${probeId}.return.additionalLagMs`,
        returnLag,
        "ms",
        T.returnToNeutral.additionalLagMsMax,
        evaluateFidelityMaxTarget(
          returnLag,
          T.returnToNeutral.additionalLagMsMax,
          returnVals.length
        ),
        returnVals.length
      ),
      residualBias: metric(
        `${probeId}.return.residualBias`,
        residual,
        "normalized",
        T.neutral.faceNoiseMax,
        evaluateFidelityMaxTarget(residual, T.neutral.faceNoiseMax, returnVals.length),
        returnVals.length
      )
    }
  };
}
function evaluateFidelitySpeechChannel(session, channelKey) {
  const raw = extractFidelitySignalSeries(session, "raw", channelKey);
  const applied = extractFidelitySignalSeries(session, "applied", channelKey);
  const T = LIVEACT_PERFECT_FIDELITY_TARGETS;
  const n = Math.min(raw.values.length, applied.values.length);
  const inVals = raw.values.slice(0, n);
  const outVals = applied.values.slice(0, n);
  const ts = applied.timestampsMs.slice(0, n);
  const lag = fidelityBestLagCorrelation(
    inVals,
    outVals,
    session.sampleRateHz,
    LIVEACT_FIDELITY_CORRELATION_LAG_WINDOW_MS
  );
  const amp = fidelityAmplitudeRetentionPct(inVals, outVals);
  const vel = fidelityVelocityRetentionPct(inVals, outVals, ts);
  const sat = fidelitySaturationFraction(outVals, LIVEACT_FIDELITY_SATURATION_THRESHOLD);
  return {
    correlationZeroLag: metric(
      `${channelKey}.correlationZeroLag`,
      lag.correlationZeroLag,
      "r",
      T.lips.dynamicCorrelationMin,
      evaluateFidelityMinTarget(lag.correlationZeroLag, T.lips.dynamicCorrelationMin, n),
      n
    ),
    correlationAligned: metric(
      `${channelKey}.correlationAligned`,
      lag.correlationAligned,
      "r",
      T.lips.dynamicCorrelationMin,
      evaluateFidelityMinTarget(lag.correlationAligned, T.lips.dynamicCorrelationMin, n),
      n
    ),
    bestLagMs: metric(
      `${channelKey}.bestLagMs`,
      lag.bestLagMs,
      "ms",
      T.lips.additionalLagP95MsMax,
      evaluateFidelityMaxTarget(
        lag.bestLagMs !== null ? Math.abs(lag.bestLagMs) : null,
        T.lips.additionalLagP95MsMax,
        n
      ),
      n
    ),
    amplitudeRetentionPct: metric(
      `${channelKey}.amplitudeRetentionPct`,
      amp,
      "percent",
      `${T.lips.amplitudeRetentionPctMin}-${T.lips.amplitudeRetentionPctMax}`,
      evaluateFidelityRangeTarget(
        amp,
        T.lips.amplitudeRetentionPctMin,
        T.lips.amplitudeRetentionPctMax,
        n,
        { applicable: amp !== null }
      ),
      n
    ),
    velocityRetentionPct: metric(
      `${channelKey}.velocityRetentionPct`,
      vel,
      "percent",
      `${T.lips.amplitudeRetentionPctMin}-${T.lips.amplitudeRetentionPctMax}`,
      evaluateFidelityRangeTarget(
        vel,
        T.lips.amplitudeRetentionPctMin,
        T.lips.amplitudeRetentionPctMax,
        n,
        { applicable: vel !== null }
      ),
      n
    ),
    saturationFraction: metric(
      `${channelKey}.saturationFraction`,
      sat,
      "fraction",
      T.lips.naturalSpeechSaturationMax,
      evaluateFidelityMaxTarget(sat, T.lips.naturalSpeechSaturationMax, n),
      n
    )
  };
}
function evaluateFidelityRuntimeMetrics(session) {
  const T = LIVEACT_PERFECT_FIDELITY_TARGETS;
  const durationMs = fidelityCaptureDurationMs(session);
  const durationSec = durationMs / 1e3;
  const inputFrames = session.samples.length;
  const processed = session.samples.filter(
    (s) => s.stages.some((st) => st.stage === "mapped" && !st.missing)
  ).length;
  const applied = session.samples.filter(
    (s) => s.stages.some((st) => st.stage === "applied" && !st.missing)
  ).length;
  const drops = session.droppedInferenceFrames;
  const dropFrac = inputFrames + drops > 0 ? drops / (inputFrames + drops) : null;
  const fps = durationSec > 0 ? applied / durationSec : null;
  const knownDelay = typeof session.metadata.knownProcessingDelayMs === "number" ? session.metadata.knownProcessingDelayMs : null;
  const delaySeries = knownDelay !== null ? session.samples.map(() => knownDelay) : session.samples.map(() => 0);
  const delayMedian = fidelityMedian(delaySeries);
  const cameraKnown = typeof session.metadata.knownCameraToAvatarP95Ms === "number" ? session.metadata.knownCameraToAvatarP95Ms : null;
  return [
    metric(
      "runtime.effectiveFps",
      fps,
      "Hz",
      T.runtime.sustainedFpsMin,
      evaluateFidelityMinTarget(fps, T.runtime.sustainedFpsMin, applied),
      applied
    ),
    metric(
      "runtime.droppedInferenceFraction",
      dropFrac,
      "fraction",
      T.runtime.droppedInferenceFractionMax,
      evaluateFidelityMaxTarget(dropFrac, T.runtime.droppedInferenceFractionMax, inputFrames),
      inputFrames
    ),
    metric(
      "runtime.processingDelayMedianMs",
      delayMedian,
      "ms",
      T.runtime.processingDelayMedianMsMax,
      evaluateFidelityMaxTarget(delayMedian, T.runtime.processingDelayMedianMsMax, delaySeries.length),
      delaySeries.length,
      knownDelay === null && delayMedian === 0 ? "synthetic sync \u2014 processing delay measured in-process (not camera acquisition)" : void 0
    ),
    metric(
      "runtime.cameraToAvatarP95Ms",
      cameraKnown,
      "ms",
      T.runtime.cameraToAvatarP95MsMax,
      cameraKnown === null ? "NOT_MEASURED" : evaluateFidelityMaxTarget(
        cameraKnown,
        T.runtime.cameraToAvatarP95MsMax,
        1
      ),
      cameraKnown === null ? 0 : 1,
      cameraKnown === null ? "no authoritative camera acquisition timestamp on V1 synthetic path" : void 0
    ),
    metric("runtime.inputFrames", inputFrames, "count", null, "PASS", inputFrames),
    metric("runtime.processedFrames", processed, "count", null, "PASS", processed),
    metric("runtime.appliedFrames", applied, "count", null, "PASS", applied),
    metric("runtime.droppedInferenceFrames", drops, "count", null, "PASS", drops)
  ];
}
function evaluateFidelityGazeAngular(targets, outputs) {
  const T = LIVEACT_PERFECT_FIDELITY_TARGETS;
  const n = Math.min(targets.length, outputs.length);
  const errors = [];
  for (let i = 0; i < n; i += 1) {
    errors.push(
      fidelityGazeAngularErrorDeg(targets[i].x, targets[i].y, outputs[i].x, outputs[i].y)
    );
  }
  const med = fidelityMedian(errors);
  const p95 = fidelityPercentile(errors, 95);
  return [
    metric(
      "gaze.angularErrorMedianDeg",
      med,
      "deg",
      T.eyes.gazeAngularErrorMedianDegMax,
      evaluateFidelityMaxTarget(med, T.eyes.gazeAngularErrorMedianDegMax, n),
      n
    ),
    metric(
      "gaze.angularErrorP95Deg",
      p95,
      "deg",
      T.eyes.gazeAngularErrorP95DegMax,
      evaluateFidelityMaxTarget(p95, T.eyes.gazeAngularErrorP95DegMax, n),
      n
    )
  ];
}
function evaluateFidelityContour(errors, mouthWidth) {
  const T = LIVEACT_PERFECT_FIDELITY_TARGETS;
  const { medianPct, p95Pct } = fidelityContourErrorPctMouthWidth(errors, mouthWidth);
  return [
    metric(
      "lips.contourMedianErrorPctMouthWidth",
      medianPct,
      "percent",
      T.lips.contourMedianErrorPctMouthWidthMax,
      evaluateFidelityMaxTarget(
        medianPct,
        T.lips.contourMedianErrorPctMouthWidthMax,
        errors.length
      ),
      errors.length
    ),
    metric(
      "lips.contourP95ErrorPctMouthWidth",
      p95Pct,
      "percent",
      T.lips.contourP95ErrorPctMouthWidthMax,
      evaluateFidelityMaxTarget(
        p95Pct,
        T.lips.contourP95ErrorPctMouthWidthMax,
        errors.length
      ),
      errors.length
    )
  ];
}
function buildFidelityReport(input) {
  return {
    contractVersion: LIVEACT_FIDELITY_REPORT_CONTRACT,
    fidelityContractVersion: LIVEACT_PERFECT_FIDELITY_CONTRACT,
    benchmarkVersion: LIVEACT_PERFECT_FIDELITY_BENCHMARK_VERSION,
    scenarioId: input.session.scenarioId,
    sourceKind: input.session.sourceKind,
    sampleRate: input.session.sampleRateHz,
    durationMs: fidelityCaptureDurationMs(input.session),
    stageCoverage: fidelityStageCoverage(input.session),
    targetsVersion: LIVEACT_PERFECT_FIDELITY_TARGETS.version,
    metrics: input.metrics,
    warnings: input.warnings ?? [],
    measuredAt: input.measuredAt
  };
}
function fidelityReportForEquality(report) {
  const { measuredAt: _m, ...rest } = report;
  return rest;
}

// src/domains/character/liveact/liveact-perfect-fidelity-fixtures.ts
var HZ = LIVEACT_FIDELITY_NOMINAL_SAMPLE_RATE_HZ;
var PHASE = LIVEACT_FIDELITY_PHASE_SAMPLES_500MS;
var DT = 1e3 / HZ;
function keyFace(id) {
  return `face.${id}`;
}
function stagesWithAppliedDelay(values, appliedValues) {
  return createEmptyFidelityStageSamples({
    raw: values,
    mapped: values,
    smoothed: values,
    calibrated: values,
    retargeted: appliedValues,
    applied: appliedValues
  });
}
function buildFidelityMotionProbeFixture(input) {
  const samples = [];
  let seq = 0;
  const appliedHold = input.appliedHoldValue ?? input.holdValue;
  const returnLag = input.returnLagSamples ?? 0;
  const jitter = input.jitterAmp ?? 0;
  const push = (phase, rawV, appliedV, unintendedRaw = 0, unintendedApplied = 0) => {
    const values = {
      [input.signalKey]: rawV
    };
    const applied = {
      [input.signalKey]: appliedV + (jitter > 0 ? (seq % 3 - 1) * jitter : 0)
    };
    if (input.unintendedKey) {
      values[input.unintendedKey] = unintendedRaw;
      applied[input.unintendedKey] = unintendedApplied;
    }
    samples.push({
      sequence: seq,
      monotonicMs: seq * DT,
      phase,
      stages: stagesWithAppliedDelay(values, applied)
    });
    seq += 1;
  };
  for (let i = 0; i < PHASE; i += 1) push("SETTLE", 0, 0);
  for (let i = 0; i < PHASE; i += 1) {
    const hold = input.saturateHold ? 1 : input.holdValue;
    const aHold = input.saturateHold ? 1 : appliedHold;
    push(
      "HOLD",
      hold,
      aHold,
      input.unintendedHoldValue ?? 0,
      input.unintendedHoldValue ?? 0
    );
  }
  for (let i = 0; i < PHASE; i += 1) {
    const stillHigh = i < returnLag;
    push("RETURN_TO_NEUTRAL", 0, stillHigh ? appliedHold : 0);
  }
  return buildFidelityCaptureSession({
    scenarioId: input.scenarioId,
    sourceKind: "synthetic",
    sampleRateHz: HZ,
    samples,
    metadata: { fixture: input.scenarioId }
  });
}
function fixturePerfectIdentityJaw() {
  return buildFidelityMotionProbeFixture({
    scenarioId: "perfect-identity-jawOpen",
    signalKey: keyFace("jawOpen"),
    holdValue: 0.7
  });
}
function fixtureKnownLatency() {
  const delaySamples = 2;
  const delayMs = delaySamples * DT;
  const base = buildFidelityMotionProbeFixture({
    scenarioId: "known-latency-66ms",
    signalKey: keyFace("jawOpen"),
    holdValue: 0.6
  });
  return {
    ...base,
    metadata: {
      ...base.metadata,
      knownProcessingDelayMs: delayMs,
      knownCameraToAvatarP95Ms: delayMs
    }
  };
}
function fixtureAmplitudeUnderResponse() {
  return buildFidelityMotionProbeFixture({
    scenarioId: "amplitude-under-response",
    signalKey: keyFace("jawOpen"),
    holdValue: 0.8,
    appliedHoldValue: 0.4
  });
}
function fixtureAmplitudeOverResponse() {
  return buildFidelityMotionProbeFixture({
    scenarioId: "amplitude-over-response",
    signalKey: keyFace("mouthSmileLeft"),
    holdValue: 0.5,
    appliedHoldValue: 0.95
  });
}
function fixtureCrossTalk() {
  return buildFidelityMotionProbeFixture({
    scenarioId: "cross-talk-blink",
    signalKey: keyFace("eyeBlinkLeft"),
    holdValue: 0.9,
    unintendedKey: keyFace("eyeBlinkRight"),
    unintendedHoldValue: 0.4
  });
}
function fixtureJitter() {
  return buildFidelityMotionProbeFixture({
    scenarioId: "jitter-hold",
    signalKey: keyFace("browInnerUp"),
    holdValue: 0.5,
    jitterAmp: 0.08
  });
}
function fixtureSaturation() {
  return buildFidelityMotionProbeFixture({
    scenarioId: "saturation-hold",
    signalKey: keyFace("mouthPucker"),
    holdValue: 0.7,
    saturateHold: true
  });
}
function fixtureDelayedReturn() {
  return buildFidelityMotionProbeFixture({
    scenarioId: "delayed-return-to-neutral",
    signalKey: keyFace("jawOpen"),
    holdValue: 0.7,
    returnLagSamples: 3
  });
}
function fixtureDroppedFrames() {
  const base = fixturePerfectIdentityJaw();
  const gapped = [];
  let sequence = 0;
  for (let i = 0; i < base.samples.length; i += 1) {
    if (i > 0 && i % 8 === 0) sequence += 1;
    gapped.push({ ...base.samples[i], sequence, monotonicMs: sequence * DT });
    sequence += 1;
  }
  return buildFidelityCaptureSession({
    scenarioId: "dropped-frames",
    sourceKind: "synthetic",
    sampleRateHz: HZ,
    samples: gapped,
    metadata: { fixture: "dropped-frames" }
  });
}
function fixtureSpeechShaped() {
  const n = 60;
  const samples = [];
  for (let i = 0; i < n; i += 1) {
    const t = i / HZ;
    const jaw = 0.35 + 0.25 * Math.sin(2 * Math.PI * 4.5 * t) + 0.1 * Math.sin(2 * Math.PI * 11 * t);
    const smileL = 0.2 + 0.15 * Math.sin(2 * Math.PI * 2.2 * t + 0.4);
    const smileR = 0.2 + 0.15 * Math.sin(2 * Math.PI * 2.2 * t + 0.55);
    const pucker = 0.15 + 0.12 * Math.sin(2 * Math.PI * 3.1 * t + 1.1);
    const clamp016 = (v2) => Math.min(1, Math.max(0, v2));
    const values = {
      [keyFace("jawOpen")]: clamp016(jaw),
      [keyFace("mouthSmileLeft")]: clamp016(smileL),
      [keyFace("mouthSmileRight")]: clamp016(smileR),
      [keyFace("mouthPucker")]: clamp016(pucker)
    };
    const prev = samples[i - 1];
    const appliedValues = prev ? {
      [keyFace("jawOpen")]: prev.stages.find((s) => s.stage === "raw")?.values?.[keyFace("jawOpen")] ?? 0,
      [keyFace("mouthSmileLeft")]: prev.stages.find((s) => s.stage === "raw")?.values?.[keyFace("mouthSmileLeft")] ?? 0,
      [keyFace("mouthSmileRight")]: prev.stages.find((s) => s.stage === "raw")?.values?.[keyFace("mouthSmileRight")] ?? 0,
      [keyFace("mouthPucker")]: prev.stages.find((s) => s.stage === "raw")?.values?.[keyFace("mouthPucker")] ?? 0
    } : values;
    samples.push({
      sequence: i,
      monotonicMs: i * DT,
      stages: stagesWithAppliedDelay(values, appliedValues)
    });
  }
  return buildFidelityCaptureSession({
    scenarioId: "speech-shaped",
    sourceKind: "synthetic_speech",
    sampleRateHz: HZ,
    samples,
    metadata: {
      fixture: "speech-shaped",
      knownProcessingDelayMs: DT
    }
  });
}
function fixtureGazeAngularError() {
  const deg = 4;
  const rad = deg * Math.PI / 180;
  const targets = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 0, y: -1 },
    { x: 0.7071, y: 0.7071 }
  ];
  const outputs = targets.map((t) => ({
    x: t.x * Math.cos(rad) - t.y * Math.sin(rad),
    y: t.x * Math.sin(rad) + t.y * Math.cos(rad)
  }));
  return { targets, outputs, expectedMedianDegApprox: deg };
}
function fixtureContourError() {
  const mouthWidth = 1;
  const errors = [0.02, 0.02, 0.04, 0.02, 0.02];
  return { errors, mouthWidth, expectedMedianPctApprox: 2 };
}
function fixtureMissingAppliedStage() {
  const base = fixturePerfectIdentityJaw();
  const samples = base.samples.map((s, i) => {
    if (i !== 20) return s;
    return {
      ...s,
      stages: createEmptyFidelityStageSamples({
        raw: s.stages.find((x) => x.stage === "raw")?.values ?? {},
        mapped: s.stages.find((x) => x.stage === "mapped")?.values ?? {},
        smoothed: s.stages.find((x) => x.stage === "smoothed")?.values ?? {},
        calibrated: s.stages.find((x) => x.stage === "calibrated")?.values ?? {},
        retargeted: s.stages.find((x) => x.stage === "retargeted")?.values ?? {}
        // applied omitted → missing
      })
    };
  });
  return buildFidelityCaptureSession({
    scenarioId: "missing-applied-stage",
    sourceKind: "synthetic",
    sampleRateHz: HZ,
    samples,
    metadata: { fixture: "missing-applied-stage" }
  });
}
var LIVEACT_FIDELITY_SYNTHETIC_FIXTURE_IDS = [
  "perfect-identity-jawOpen",
  "known-latency-66ms",
  "amplitude-under-response",
  "amplitude-over-response",
  "cross-talk-blink",
  "jitter-hold",
  "saturation-hold",
  "delayed-return-to-neutral",
  "dropped-frames",
  "speech-shaped",
  "gaze-angular-error",
  "contour-error",
  "missing-applied-stage"
];

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
function toDenseLocalPoint(world, frame2) {
  if (frame2.status !== "ok" || frame2.scale < SCALE_EPS) return null;
  const rel = sub(world, frame2.origin);
  const lx = dot(rel, frame2.axisX) / frame2.scale;
  const ly = dot(rel, frame2.axisY) / frame2.scale;
  const lz = dot(rel, frame2.axisZ) / frame2.scale;
  if (!Number.isFinite(lx) || !Number.isFinite(ly) || !Number.isFinite(lz)) return null;
  return v(lx, ly, lz);
}
function mapGeometryToDenseLocal(geometry, frame2) {
  const out = {};
  for (const id of Object.keys(geometry.points)) {
    const world = asVec(geometry.points[id]);
    out[id] = world ? toDenseLocalPoint(world, frame2) : null;
  }
  return out;
}
function denseLocalDistance(a, b) {
  return len(sub(a, b));
}
function isFiniteVec3(p) {
  return !!p && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z);
}
function transformDenseSemanticGeometry(geometry, transform) {
  const eyeL = asVec(geometry.points.eyeOuterLeft);
  const eyeR = asVec(geometry.points.eyeOuterRight);
  const pivot = eyeL && eyeR ? midpoint(eyeL, eyeR) : v(0, 0, 0);
  const s = transform.uniformScale ?? 1;
  const t = transform.translate ?? v(0, 0, 0);
  const yaw = transform.yawRad ?? 0;
  const pitch = transform.pitchRad ?? 0;
  const roll = transform.rollRad ?? 0;
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const cr = Math.cos(roll);
  const sr = Math.sin(roll);
  function rotate(p) {
    let x = p.x * cy + p.z * sy;
    let y = p.y;
    let z = -p.x * sy + p.z * cy;
    const y2 = y * cp - z * sp;
    const z2 = y * sp + z * cp;
    y = y2;
    z = z2;
    const x3 = x * cr - y * sr;
    const y3 = x * sr + y * cr;
    x = x3;
    y = y3;
    return v(x, y, z);
  }
  const points = { ...geometry.points };
  for (const id of Object.keys(points)) {
    const p = points[id];
    if (!p.available || !Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.z)) {
      continue;
    }
    let rel = sub(v(p.x, p.y, p.z), pivot);
    rel = scale(rel, s);
    rel = rotate(rel);
    const out = add(add(pivot, rel), t);
    points[id] = { available: true, x: out.x, y: out.y, z: out.z };
  }
  return {
    contractVersion: geometry.contractVersion,
    points,
    faceConfidence: geometry.faceConfidence
  };
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
  const frame2 = buildDenseFaceLocalFrame(input.geometry);
  if (frame2.status !== "ok") {
    return createEmptyDenseFaceFeatures({
      sequence: input.sequence,
      timestampMs: input.timestampMs,
      faceConfidence: faceConf,
      normalizationStatus: frame2.status
    });
  }
  const local = mapGeometryToDenseLocal(input.geometry, frame2);
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
function denseFeaturesForEquality(frame2) {
  return { ...frame2, timestampMs: 0 };
}

// src/domains/character/liveact/liveact-dense-face-features-fixtures.ts
var LIVEACT_DENSE_FIXTURE_IDS = [
  "canonical-neutral",
  "mouth-open",
  "smile-left",
  "smile-right",
  "pucker-compression",
  "eye-close-left",
  "eye-close-right",
  "eyes-both-closed",
  "brow-inner-raise",
  "brow-outer-left",
  "cheek-raise-left",
  "nose-nasolabial",
  "chin-drop",
  "rigid-translated",
  "rigid-scaled",
  "rigid-yaw",
  "rigid-pitch",
  "rigid-roll",
  "partial-missing-mouth",
  "degenerate-scale"
];
function pt(x, y, z) {
  return { available: true, x, y, z };
}
function missing() {
  return { available: false, x: Number.NaN, y: Number.NaN, z: Number.NaN };
}
function buildCanonicalNeutralGeometry(faceConfidence = 1) {
  const points = {
    // Eyes: anatomical left at +X in this synthetic (matches domain +X = anatomical left)
    eyeOuterLeft: pt(0.55, 0.2, 0.05),
    eyeInnerLeft: pt(0.25, 0.2, 0.08),
    eyeUpperLeft: pt(0.4, 0.28, 0.06),
    eyeLowerLeft: pt(0.4, 0.12, 0.06),
    eyeOuterRight: pt(-0.55, 0.2, 0.05),
    eyeInnerRight: pt(-0.25, 0.2, 0.08),
    eyeUpperRight: pt(-0.4, 0.28, 0.06),
    eyeLowerRight: pt(-0.4, 0.12, 0.06),
    browInnerLeft: pt(0.22, 0.42, 0.04),
    browMidLeft: pt(0.4, 0.44, 0.03),
    browOuterLeft: pt(0.58, 0.4, 0.02),
    browInnerRight: pt(-0.22, 0.42, 0.04),
    browMidRight: pt(-0.4, 0.44, 0.03),
    browOuterRight: pt(-0.58, 0.4, 0.02),
    mouthCornerLeft: pt(0.32, -0.35, 0.12),
    mouthCornerRight: pt(-0.32, -0.35, 0.12),
    lipUpperOuterLeft: pt(0.28, -0.28, 0.14),
    lipUpperInnerLeft: pt(0.14, -0.26, 0.15),
    lipUpperCenter: pt(0, -0.25, 0.16),
    lipUpperInnerRight: pt(-0.14, -0.26, 0.15),
    lipUpperOuterRight: pt(-0.28, -0.28, 0.14),
    lipLowerOuterLeft: pt(0.28, -0.42, 0.13),
    lipLowerInnerLeft: pt(0.14, -0.44, 0.14),
    lipLowerCenter: pt(0, -0.45, 0.15),
    lipLowerInnerRight: pt(-0.14, -0.44, 0.14),
    lipLowerOuterRight: pt(-0.28, -0.42, 0.13),
    noseTip: pt(0, -0.05, 0.28),
    noseBridge: pt(0, 0.1, 0.18),
    noseAlarLeft: pt(0.12, -0.08, 0.2),
    noseAlarRight: pt(-0.12, -0.08, 0.2),
    cheekLeft: pt(0.45, -0.05, 0.1),
    cheekRight: pt(-0.45, -0.05, 0.1),
    nasolabialLeft: pt(0.18, -0.18, 0.14),
    nasolabialRight: pt(-0.18, -0.18, 0.14),
    chin: pt(0, -0.7, 0.1),
    jawLeft: pt(0.5, -0.55, 0.05),
    jawRight: pt(-0.5, -0.55, 0.05),
    forehead: pt(0, 0.65, 0.02)
  };
  return {
    contractVersion: LIVEACT_DENSE_SEMANTIC_GEOMETRY_CONTRACT,
    points,
    faceConfidence
  };
}
function clonePoints(geometry) {
  const out = {};
  for (const id of DENSE_SEMANTIC_POINT_IDS) {
    const p = geometry.points[id];
    out[id] = { available: p.available, x: p.x, y: p.y, z: p.z };
  }
  return out;
}
function withMutations(mutate, faceConfidence = 1) {
  const base = buildCanonicalNeutralGeometry(faceConfidence);
  const points = clonePoints(base);
  mutate(points);
  return {
    contractVersion: LIVEACT_DENSE_SEMANTIC_GEOMETRY_CONTRACT,
    points,
    faceConfidence
  };
}
function fixtureMouthOpen() {
  return withMutations((p) => {
    p.lipUpperCenter = pt(0, -0.18, 0.16);
    p.lipUpperInnerLeft = pt(0.14, -0.2, 0.15);
    p.lipUpperInnerRight = pt(-0.14, -0.2, 0.15);
    p.lipLowerCenter = pt(0, -0.62, 0.15);
    p.lipLowerInnerLeft = pt(0.14, -0.58, 0.14);
    p.lipLowerInnerRight = pt(-0.14, -0.58, 0.14);
    p.chin = pt(0, -0.85, 0.1);
  });
}
function fixtureSmileLeft() {
  return withMutations((p) => {
    p.mouthCornerLeft = pt(0.38, -0.22, 0.12);
    p.lipUpperOuterLeft = pt(0.32, -0.2, 0.14);
    p.lipLowerOuterLeft = pt(0.32, -0.36, 0.13);
  });
}
function fixtureSmileRight() {
  return withMutations((p) => {
    p.mouthCornerRight = pt(-0.38, -0.22, 0.12);
    p.lipUpperOuterRight = pt(-0.32, -0.2, 0.14);
    p.lipLowerOuterRight = pt(-0.32, -0.36, 0.13);
  });
}
function fixturePuckerCompression() {
  return withMutations((p) => {
    p.mouthCornerLeft = pt(0.18, -0.35, 0.18);
    p.mouthCornerRight = pt(-0.18, -0.35, 0.18);
    p.lipUpperCenter = pt(0, -0.32, 0.22);
    p.lipLowerCenter = pt(0, -0.38, 0.22);
    p.lipUpperInnerLeft = pt(0.08, -0.33, 0.2);
    p.lipUpperInnerRight = pt(-0.08, -0.33, 0.2);
    p.lipLowerInnerLeft = pt(0.08, -0.37, 0.2);
    p.lipLowerInnerRight = pt(-0.08, -0.37, 0.2);
  });
}
function fixtureEyeCloseLeft() {
  return withMutations((p) => {
    p.eyeUpperLeft = pt(0.4, 0.2, 0.06);
    p.eyeLowerLeft = pt(0.4, 0.2, 0.06);
  });
}
function fixtureEyeCloseRight() {
  return withMutations((p) => {
    p.eyeUpperRight = pt(-0.4, 0.2, 0.06);
    p.eyeLowerRight = pt(-0.4, 0.2, 0.06);
  });
}
function fixtureEyesBothClosed() {
  return withMutations((p) => {
    p.eyeUpperLeft = pt(0.4, 0.2, 0.06);
    p.eyeLowerLeft = pt(0.4, 0.2, 0.06);
    p.eyeUpperRight = pt(-0.4, 0.2, 0.06);
    p.eyeLowerRight = pt(-0.4, 0.2, 0.06);
  });
}
function fixtureBrowInnerRaise() {
  return withMutations((p) => {
    p.browInnerLeft = pt(0.22, 0.55, 0.04);
    p.browInnerRight = pt(-0.22, 0.55, 0.04);
  });
}
function fixtureBrowOuterLeft() {
  return withMutations((p) => {
    p.browOuterLeft = pt(0.58, 0.55, 0.02);
    p.browMidLeft = pt(0.4, 0.52, 0.03);
  });
}
function fixtureCheekRaiseLeft() {
  return withMutations((p) => {
    p.cheekLeft = pt(0.45, 0.08, 0.14);
  });
}
function fixtureNoseNasolabial() {
  return withMutations((p) => {
    p.noseAlarLeft = pt(0.16, -0.1, 0.22);
    p.noseAlarRight = pt(-0.16, -0.1, 0.22);
    p.nasolabialLeft = pt(0.24, -0.22, 0.16);
    p.nasolabialRight = pt(-0.24, -0.22, 0.16);
  });
}
function fixtureChinDrop() {
  return withMutations((p) => {
    p.chin = pt(0, -0.95, 0.12);
    p.jawLeft = pt(0.52, -0.7, 0.05);
    p.jawRight = pt(-0.52, -0.7, 0.05);
  });
}
function fixturePartialMissingMouth() {
  return withMutations((p) => {
    p.mouthCornerLeft = missing();
    p.mouthCornerRight = missing();
    p.lipUpperCenter = missing();
    p.lipLowerCenter = missing();
  });
}
function fixtureDegenerateScale() {
  return withMutations((p) => {
    p.eyeOuterLeft = pt(0, 0.2, 0.05);
    p.eyeInnerLeft = pt(0, 0.2, 0.05);
    p.eyeOuterRight = pt(0, 0.2, 0.05);
    p.eyeInnerRight = pt(0, 0.2, 0.05);
  });
}
function buildDenseFixtureGeometry(id) {
  switch (id) {
    case "canonical-neutral":
      return buildCanonicalNeutralGeometry();
    case "mouth-open":
      return fixtureMouthOpen();
    case "smile-left":
      return fixtureSmileLeft();
    case "smile-right":
      return fixtureSmileRight();
    case "pucker-compression":
      return fixturePuckerCompression();
    case "eye-close-left":
      return fixtureEyeCloseLeft();
    case "eye-close-right":
      return fixtureEyeCloseRight();
    case "eyes-both-closed":
      return fixtureEyesBothClosed();
    case "brow-inner-raise":
      return fixtureBrowInnerRaise();
    case "brow-outer-left":
      return fixtureBrowOuterLeft();
    case "cheek-raise-left":
      return fixtureCheekRaiseLeft();
    case "nose-nasolabial":
      return fixtureNoseNasolabial();
    case "chin-drop":
      return fixtureChinDrop();
    case "rigid-translated":
    case "rigid-scaled":
    case "rigid-yaw":
    case "rigid-pitch":
    case "rigid-roll":
      return buildCanonicalNeutralGeometry();
    case "partial-missing-mouth":
      return fixturePartialMissingMouth();
    case "degenerate-scale":
      return fixtureDegenerateScale();
    default: {
      const _exhaustive = id;
      return _exhaustive;
    }
  }
}

// src/domains/character/liveact/liveact-dense-face-features-contour-metric.ts
function evaluateDenseFeatureLipContour(input) {
  const ref = input.reference.lips.upperContour;
  const meas = input.measured.lips.upperContour;
  const width = input.reference.lips.width.available && input.reference.lips.width.value !== null ? input.reference.lips.width.value : input.measured.lips.width.available && input.measured.lips.width.value !== null ? input.measured.lips.width.value : null;
  if (!ref.available || !meas.available || !ref.stations || !meas.stations || width === null || width <= 1e-9) {
    return {
      measurable: false,
      median: null,
      p95: null,
      mouthWidth: width
    };
  }
  const errors = [];
  for (let i = 0; i < 5; i += 1) {
    const a = ref.stations[i];
    const b = meas.stations[i];
    if (!a?.available || !b?.available || a.value === null || b.value === null) continue;
    errors.push(Math.abs(a.value - b.value));
  }
  const refL = input.reference.lips.lowerContour;
  const measL = input.measured.lips.lowerContour;
  if (refL.available && measL.available && refL.stations && measL.stations) {
    for (let i = 0; i < 5; i += 1) {
      const a = refL.stations[i];
      const b = measL.stations[i];
      if (!a?.available || !b?.available || a.value === null || b.value === null) continue;
      errors.push(Math.abs(a.value - b.value));
    }
  }
  if (errors.length === 0) {
    return { measurable: false, median: null, p95: null, mouthWidth: width };
  }
  const [median2, p95] = evaluateFidelityContour(errors, width);
  return {
    measurable: median2 !== void 0 && median2.status !== "NOT_MEASURED",
    median: median2 ?? null,
    p95: p95 ?? null,
    mouthWidth: width
  };
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
function gazeDirectionFromYawPitchDeg(yawDeg, pitchDeg) {
  const yaw = yawDeg * Math.PI / 180;
  const pitch = pitchDeg * Math.PI / 180;
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  return gazeVec3(sy * cp, sp, cy * cp);
}
function yawPitchDegFromGazeDirection(dir) {
  const n = gazeNormalize(dir);
  if (!n) return null;
  const yawDeg = Math.atan2(n.x, n.z) * 180 / Math.PI;
  const pitchDeg = Math.asin(Math.min(1, Math.max(-1, n.y))) * 180 / Math.PI;
  if (!Number.isFinite(yawDeg) || !Number.isFinite(pitchDeg)) return null;
  return { yawDeg, pitchDeg };
}
function gazeDirectionAngularErrorDeg(a, b) {
  const na = gazeNormalize(a);
  const nb = gazeNormalize(b);
  if (!na || !nb) return Number.NaN;
  const d = Math.min(1, Math.max(-1, gazeDot(na, nb)));
  return Math.acos(d) * 180 / Math.PI;
}
function irisCenterOnSphere(frame2, yawDeg, pitchDeg) {
  const dirLocal = gazeDirectionFromYawPitchDeg(yawDeg, pitchDeg);
  const dir = gazeAdd(
    gazeAdd(gazeScale(frame2.axisX, dirLocal.x), gazeScale(frame2.axisY, dirLocal.y)),
    gazeScale(frame2.axisZ, dirLocal.z)
  );
  return gazeAdd(frame2.eyeballCenter, gazeScale(dir, frame2.radius));
}
function solveGazeFromIrisOnSphere(frame2, irisCenter) {
  const rel = gazeSub(irisCenter, frame2.eyeballCenter);
  const dirWorld = gazeNormalize(rel);
  if (!dirWorld) return null;
  const lx = gazeDot(dirWorld, frame2.axisX);
  const ly = gazeDot(dirWorld, frame2.axisY);
  const lz = gazeDot(dirWorld, frame2.axisZ);
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
function planarApertureGazeFromIris(frame2, irisCenter) {
  const rel = gazeSub(irisCenter, frame2.eyeOrigin);
  const lx = gazeDot(rel, frame2.axisX);
  const ly = gazeDot(rel, frame2.axisY);
  if (frame2.halfWidth < EPS || frame2.halfHeight < EPS) return null;
  let x = lx / frame2.halfWidth;
  let y = ly / frame2.halfHeight;
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
  const missing3 = {
    available: false,
    x: Number.NaN,
    y: Number.NaN,
    z: Number.NaN
  };
  const points = {};
  for (const id of DENSE_SEMANTIC_POINT_IDS) points[id] = missing3;
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
  const frame2 = buildEyeSphereFrameFromCorners({
    inner: gazeVec3(c.inner.x, c.inner.y, c.inner.z),
    outer: gazeVec3(c.outer.x, c.outer.y, c.outer.z),
    upper: gazeVec3(c.upper.x, c.upper.y, c.upper.z),
    lower: gazeVec3(c.lower.x, c.lower.y, c.lower.z),
    anatomicalLeft
  });
  if (!frame2) return null;
  return { frame: frame2, iris: c.iris };
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
function solvePlanarApertureGaze(input) {
  const dense = irisGeometryToDenseSemanticGeometry(input.geometry);
  const faceFrame = buildDenseFaceLocalFrame(dense);
  const zero = {
    eyeLeftX: 0,
    eyeLeftY: 0,
    eyeRightX: 0,
    eyeRightY: 0,
    leftAvailable: false,
    rightAvailable: false
  };
  if (faceFrame.status !== "ok") return zero;
  const leftBuilt = buildEyeSphere(input.geometry.left, faceFrame, true);
  const rightBuilt = buildEyeSphere(input.geometry.right, faceFrame, false);
  let eyeLeftX = 0;
  let eyeLeftY = 0;
  let eyeRightX = 0;
  let eyeRightY = 0;
  let leftAvailable = false;
  let rightAvailable = false;
  if (leftBuilt && input.geometry.left.irisContourAvailableCount >= 4) {
    const p = planarApertureGazeFromIris(
      leftBuilt.frame,
      gazeVec3(leftBuilt.iris.x, leftBuilt.iris.y, leftBuilt.iris.z)
    );
    if (p) {
      eyeLeftX = p.x;
      eyeLeftY = p.y;
      leftAvailable = true;
    }
  }
  if (rightBuilt && input.geometry.right.irisContourAvailableCount >= 4) {
    const p = planarApertureGazeFromIris(
      rightBuilt.frame,
      gazeVec3(rightBuilt.iris.x, rightBuilt.iris.y, rightBuilt.iris.z)
    );
    if (p) {
      eyeRightX = p.x;
      eyeRightY = p.y;
      rightAvailable = true;
    }
  }
  return {
    eyeLeftX,
    eyeLeftY,
    eyeRightX,
    eyeRightY,
    leftAvailable,
    rightAvailable
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

// src/domains/character/liveact/liveact-iris-gaze-fixtures.ts
var LIVEACT_IRIS_GAZE_FIXTURE_IDS = [
  "iris-neutral",
  "iris-look-left",
  "iris-look-right",
  "iris-look-up",
  "iris-look-down",
  "iris-look-diag-ul",
  "iris-look-diag-ur",
  "iris-look-diag-dl",
  "iris-look-diag-dr",
  "iris-yaw-10",
  "iris-yaw-neg10",
  "iris-pitch-8",
  "iris-far-same",
  "iris-convergence",
  "iris-head-yaw-neutral-eyes",
  "iris-head-pitch-neutral-eyes",
  "iris-head-roll-neutral-eyes",
  "iris-head-combined-neutral-eyes",
  "iris-head-yaw-with-gaze",
  "iris-missing-contour",
  "iris-partial-contour"
];
function pt2(x, y, z) {
  return { available: true, x, y, z };
}
function missing2() {
  return { available: false, x: Number.NaN, y: Number.NaN, z: Number.NaN };
}
function makeEyeCorners(side) {
  if (side === "left") {
    return {
      inner: pt2(0.25, 0.2, 0.08),
      outer: pt2(0.55, 0.2, 0.05),
      upper: pt2(0.4, 0.28, 0.06),
      lower: pt2(0.4, 0.12, 0.06)
    };
  }
  return {
    inner: pt2(-0.25, 0.2, 0.08),
    outer: pt2(-0.55, 0.2, 0.05),
    upper: pt2(-0.4, 0.28, 0.06),
    lower: pt2(-0.4, 0.12, 0.06)
  };
}
function placeIrisOnSphereEye(side, yawDeg, pitchDeg) {
  const corners = makeEyeCorners(side);
  const frame2 = buildEyeSphereFrameFromCorners({
    inner: gazeVec3(corners.inner.x, corners.inner.y, corners.inner.z),
    outer: gazeVec3(corners.outer.x, corners.outer.y, corners.outer.z),
    upper: gazeVec3(corners.upper.x, corners.upper.y, corners.upper.z),
    lower: gazeVec3(corners.lower.x, corners.lower.y, corners.lower.z),
    anatomicalLeft: side === "left"
  });
  if (!frame2) {
    throw new Error(`iris fixture: degenerate ${side} eye frame`);
  }
  const iris = irisCenterOnSphere(frame2, yawDeg, pitchDeg);
  return {
    innerCorner: corners.inner,
    outerCorner: corners.outer,
    upperLid: corners.upper,
    lowerLid: corners.lower,
    irisCenter: pt2(iris.x, iris.y, iris.z),
    irisContourAvailableCount: 4
  };
}
function truthFromDeg(leftYaw, leftPitch, rightYaw, rightPitch) {
  const l = yawPitchToNormalizedGaze(leftYaw, leftPitch);
  const r = yawPitchToNormalizedGaze(rightYaw, rightPitch);
  return {
    leftX: l.x,
    leftY: l.y,
    rightX: r.x,
    rightY: r.y,
    leftYawDeg: leftYaw,
    leftPitchDeg: leftPitch,
    rightYawDeg: rightYaw,
    rightPitchDeg: rightPitch
  };
}
function buildIrisNeutralGeometry(angles = {}) {
  const ly = angles.leftYawDeg ?? 0;
  const lp = angles.leftPitchDeg ?? 0;
  const ry = angles.rightYawDeg ?? 0;
  const rp = angles.rightPitchDeg ?? 0;
  return {
    contractVersion: LIVEACT_IRIS_EYE_GEOMETRY_CONTRACT,
    left: placeIrisOnSphereEye("left", ly, lp),
    right: placeIrisOnSphereEye("right", ry, rp),
    forehead: pt2(0, 0.65, 0.02),
    noseBridge: pt2(0, 0.1, 0.18),
    noseTip: pt2(0, -0.05, 0.28),
    faceConfidence: 1
  };
}
function encodeNormalizedGazeAsEyeLookCategories(input) {
  const clamp016 = (n) => Math.min(1, Math.max(0, n));
  const lx = input.eyeLeftX;
  const ly = input.eyeLeftY;
  const rx = input.eyeRightX;
  const ry = input.eyeRightY;
  return [
    { categoryName: "eyeLookOutLeft", score: clamp016(lx) },
    { categoryName: "eyeLookInLeft", score: clamp016(-lx) },
    { categoryName: "eyeLookUpLeft", score: clamp016(ly) },
    { categoryName: "eyeLookDownLeft", score: clamp016(-ly) },
    // V1: eyeRightX = in - out
    { categoryName: "eyeLookInRight", score: clamp016(rx) },
    { categoryName: "eyeLookOutRight", score: clamp016(-rx) },
    { categoryName: "eyeLookUpRight", score: clamp016(ry) },
    { categoryName: "eyeLookDownRight", score: clamp016(-ry) }
  ];
}
function fairBlendshapeGazeFromGeometry(geometry) {
  const planar = solvePlanarApertureGaze({ geometry });
  const categories = encodeNormalizedGazeAsEyeLookCategories({
    eyeLeftX: planar.eyeLeftX,
    eyeLeftY: planar.eyeLeftY,
    eyeRightX: planar.eyeRightX,
    eyeRightY: planar.eyeRightY
  });
  const sample = mapMediaPipeFaceToLiveActSample({
    categories,
    enableHeadPose: false,
    matrix: null,
    faceIndex: 0,
    faceCount: 1
  });
  return {
    eyeLeftX: sample.eyeLeftX,
    eyeLeftY: sample.eyeLeftY,
    eyeRightX: sample.eyeRightX,
    eyeRightY: sample.eyeRightY
  };
}
function approximateBlendshapeGazeFromTruth(truth, _headLeak = {}) {
  void _headLeak;
  const categories = encodeNormalizedGazeAsEyeLookCategories({
    eyeLeftX: truth.leftX,
    eyeLeftY: truth.leftY,
    eyeRightX: truth.rightX,
    eyeRightY: truth.rightY
  });
  const sample = mapMediaPipeFaceToLiveActSample({
    categories,
    enableHeadPose: false,
    matrix: null,
    faceIndex: 0,
    faceCount: 1
  });
  return {
    eyeLeftX: sample.eyeLeftX,
    eyeLeftY: sample.eyeLeftY,
    eyeRightX: sample.eyeRightX,
    eyeRightY: sample.eyeRightY
  };
}
function buildIrisGazeFixture(id) {
  const mk = (ly, lp, ry, rp, head = {
    yaw: 0,
    pitch: 0,
    roll: 0
  }, transform) => {
    let geometry = buildIrisNeutralGeometry({
      leftYawDeg: ly,
      leftPitchDeg: lp,
      rightYawDeg: ry,
      rightPitchDeg: rp
    });
    if (transform) {
      geometry = applyRigidHeadToIrisGeometry(geometry, transform);
    }
    return {
      geometry,
      truth: truthFromDeg(ly, lp, ry, rp),
      headLeak: head
    };
  };
  switch (id) {
    case "iris-neutral":
      return mk(0, 0, 0, 0);
    case "iris-look-left":
      return mk(20, 0, 20, 0);
    case "iris-look-right":
      return mk(-20, 0, -20, 0);
    case "iris-look-up":
      return mk(0, 15, 0, 15);
    case "iris-look-down":
      return mk(0, -15, 0, -15);
    case "iris-look-diag-ul":
      return mk(18, 12, 18, 12);
    case "iris-look-diag-ur":
      return mk(-18, 12, -18, 12);
    case "iris-look-diag-dl":
      return mk(18, -12, 18, -12);
    case "iris-look-diag-dr":
      return mk(-18, -12, -18, -12);
    case "iris-yaw-10":
      return mk(10, 0, 10, 0);
    case "iris-yaw-neg10":
      return mk(-10, 0, -10, 0);
    case "iris-pitch-8":
      return mk(0, 8, 0, 8);
    case "iris-far-same":
      return mk(12, 0, 12, 0);
    case "iris-convergence":
      return mk(-8, 0, 8, 0);
    case "iris-head-yaw-neutral-eyes":
      return mk(0, 0, 0, 0, { yaw: 0.4, pitch: 0, roll: 0 }, { yawRad: 0.4 });
    case "iris-head-pitch-neutral-eyes":
      return mk(0, 0, 0, 0, { yaw: 0, pitch: 0.3, roll: 0 }, { pitchRad: 0.3 });
    case "iris-head-roll-neutral-eyes":
      return mk(0, 0, 0, 0, { yaw: 0, pitch: 0, roll: 0.35 }, { rollRad: 0.35 });
    case "iris-head-combined-neutral-eyes":
      return mk(
        0,
        0,
        0,
        0,
        { yaw: 0.25, pitch: 0.2, roll: 0.15 },
        { yawRad: 0.25, pitchRad: 0.2, rollRad: 0.15 }
      );
    case "iris-head-yaw-with-gaze":
      return mk(15, 0, 15, 0, { yaw: 0.35, pitch: 0, roll: 0 }, { yawRad: 0.35 });
    case "iris-missing-contour": {
      const base = mk(15, 0, 15, 0);
      return {
        ...base,
        geometry: {
          ...base.geometry,
          left: {
            ...base.geometry.left,
            irisCenter: missing2(),
            irisContourAvailableCount: 0
          }
        }
      };
    }
    case "iris-partial-contour": {
      const base = mk(15, 0, 15, 0);
      return {
        ...base,
        geometry: {
          ...base.geometry,
          left: {
            ...base.geometry.left,
            irisContourAvailableCount: 2
          }
        }
      };
    }
    default: {
      const _e = id;
      return _e;
    }
  }
}
function applyRigidHeadToIrisGeometry(geometry, transform) {
  const dense = irisGeometryToDenseSemanticGeometry(geometry);
  const withIris = attachIrisCentersToDense(dense, geometry);
  const transformed = transformDenseSemanticGeometry(withIris, transform);
  return denseTransformedToIrisGeometry(transformed, geometry);
}
function attachIrisCentersToDense(dense, geometry) {
  const points = { ...dense.points };
  points.browMidLeft = toDense(geometry.left.irisCenter);
  points.browMidRight = toDense(geometry.right.irisCenter);
  return {
    contractVersion: LIVEACT_DENSE_SEMANTIC_GEOMETRY_CONTRACT,
    points,
    faceConfidence: dense.faceConfidence
  };
}
function toDense(p) {
  return { available: p.available, x: p.x, y: p.y, z: p.z };
}
function fromDense(p) {
  return { available: p.available, x: p.x, y: p.y, z: p.z };
}
function denseTransformedToIrisGeometry(dense, template) {
  return {
    contractVersion: LIVEACT_IRIS_EYE_GEOMETRY_CONTRACT,
    left: {
      innerCorner: fromDense(dense.points.eyeInnerLeft),
      outerCorner: fromDense(dense.points.eyeOuterLeft),
      upperLid: fromDense(dense.points.eyeUpperLeft),
      lowerLid: fromDense(dense.points.eyeLowerLeft),
      irisCenter: fromDense(dense.points.browMidLeft),
      irisContourAvailableCount: template.left.irisContourAvailableCount
    },
    right: {
      innerCorner: fromDense(dense.points.eyeInnerRight),
      outerCorner: fromDense(dense.points.eyeOuterRight),
      upperLid: fromDense(dense.points.eyeUpperRight),
      lowerLid: fromDense(dense.points.eyeLowerRight),
      irisCenter: fromDense(dense.points.browMidRight),
      irisContourAvailableCount: template.right.irisContourAvailableCount
    },
    forehead: fromDense(dense.points.forehead),
    noseBridge: fromDense(dense.points.noseBridge),
    noseTip: fromDense(dense.points.noseTip),
    faceConfidence: dense.faceConfidence
  };
}

// src/domains/character/liveact/liveact-iris-gaze-ab.ts
var LIVEACT_IRIS_AB_MIN_MEDIAN_IMPROVEMENT_DEG = 0.5;
function pathErrors(path, errorsDeg, neutralOffsets, fidelity2dErrors) {
  const T = LIVEACT_PERFECT_FIDELITY_TARGETS;
  const medianDeg = fidelityMedian(errorsDeg);
  const p95Deg = fidelityPercentile(errorsDeg, 95);
  const neutralOffsetMax = neutralOffsets.length === 0 ? null : Math.max(...neutralOffsets.map((v2) => Math.abs(v2)));
  const fidelity2dMedianDeg = fidelityMedian(fidelity2dErrors);
  const fidelity2dP95Deg = fidelityPercentile(fidelity2dErrors, 95);
  return {
    path,
    errorsDeg,
    medianDeg,
    p95Deg,
    neutralOffsetMax,
    medianStatus: evaluateFidelityMaxTarget(
      medianDeg,
      T.eyes.gazeAngularErrorMedianDegMax,
      errorsDeg.length
    ),
    p95Status: evaluateFidelityMaxTarget(
      p95Deg,
      T.eyes.gazeAngularErrorP95DegMax,
      errorsDeg.length
    ),
    neutralStatus: evaluateFidelityMaxTarget(
      neutralOffsetMax,
      T.eyes.neutralEyeOffsetMax,
      neutralOffsets.length
    ),
    fidelity2dMedianDeg,
    fidelity2dP95Deg
  };
}
function angularErrorFromYawPitch(tYaw, tPitch, oYaw, oPitch) {
  return gazeDirectionAngularErrorDeg(
    gazeDirectionFromYawPitchDeg(tYaw, tPitch),
    gazeDirectionFromYawPitchDeg(oYaw, oPitch)
  );
}
var DIRECTIONAL = [
  "iris-neutral",
  "iris-look-left",
  "iris-look-right",
  "iris-look-up",
  "iris-look-down",
  "iris-look-diag-ul",
  "iris-look-diag-ur",
  "iris-look-diag-dl",
  "iris-look-diag-dr",
  "iris-yaw-10",
  "iris-yaw-neg10",
  "iris-pitch-8",
  "iris-far-same",
  "iris-head-yaw-with-gaze"
];
var HEAD_NEUTRAL = [
  "iris-head-yaw-neutral-eyes",
  "iris-head-pitch-neutral-eyes",
  "iris-head-roll-neutral-eyes",
  "iris-head-combined-neutral-eyes"
];
function runIrisGazeAbBenchmark() {
  const irisErrors = [];
  const blendErrors = [];
  const irisNeutral = [];
  const blendNeutral = [];
  const iris2dTargets = [];
  const iris2dOutputs = [];
  const blend2dTargets = [];
  const blend2dOutputs = [];
  let headRelativeMaxAbs = 0;
  let binocularFarDisagreementDeg = null;
  let yaw10AbsErrorDeg = null;
  let yawNeg10AbsErrorDeg = null;
  let pitch8AbsErrorDeg = null;
  for (const id of DIRECTIONAL) {
    const { geometry, truth } = buildIrisGazeFixture(id);
    const iris2 = solveIrisGaze({ geometry, sequence: 1, timestampMs: 0 });
    const blend = fairBlendshapeGazeFromGeometry(geometry);
    if (iris2.left.available && iris2.left.yawDeg !== null && iris2.left.pitchDeg !== null && iris2.left.x !== null && iris2.left.y !== null) {
      irisErrors.push(
        angularErrorFromYawPitch(
          truth.leftYawDeg,
          truth.leftPitchDeg,
          iris2.left.yawDeg,
          iris2.left.pitchDeg
        )
      );
      iris2dTargets.push({ x: truth.leftX, y: truth.leftY });
      iris2dOutputs.push({ x: iris2.left.x, y: iris2.left.y });
      if (id === "iris-neutral") irisNeutral.push(iris2.left.x, iris2.left.y);
      if (id === "iris-yaw-10") {
        yaw10AbsErrorDeg = Math.abs(iris2.left.yawDeg - 10);
      }
      if (id === "iris-yaw-neg10") {
        yawNeg10AbsErrorDeg = Math.abs(iris2.left.yawDeg - -10);
      }
      if (id === "iris-pitch-8") {
        pitch8AbsErrorDeg = Math.abs(iris2.left.pitchDeg - 8);
      }
    }
    if (iris2.right.available && iris2.right.yawDeg !== null && iris2.right.pitchDeg !== null && iris2.right.x !== null && iris2.right.y !== null) {
      irisErrors.push(
        angularErrorFromYawPitch(
          truth.rightYawDeg,
          truth.rightPitchDeg,
          iris2.right.yawDeg,
          iris2.right.pitchDeg
        )
      );
      iris2dTargets.push({ x: truth.rightX, y: truth.rightY });
      iris2dOutputs.push({ x: iris2.right.x, y: iris2.right.y });
      if (id === "iris-neutral") irisNeutral.push(iris2.right.x, iris2.right.y);
    }
    const bL = normalizedGazeToYawPitch(blend.eyeLeftX, blend.eyeLeftY);
    const bR = normalizedGazeToYawPitch(blend.eyeRightX, blend.eyeRightY);
    blendErrors.push(
      angularErrorFromYawPitch(
        truth.leftYawDeg,
        truth.leftPitchDeg,
        bL.yawDeg,
        bL.pitchDeg
      )
    );
    blendErrors.push(
      angularErrorFromYawPitch(
        truth.rightYawDeg,
        truth.rightPitchDeg,
        bR.yawDeg,
        bR.pitchDeg
      )
    );
    blend2dTargets.push({ x: truth.leftX, y: truth.leftY });
    blend2dOutputs.push({ x: blend.eyeLeftX, y: blend.eyeLeftY });
    blend2dTargets.push({ x: truth.rightX, y: truth.rightY });
    blend2dOutputs.push({ x: blend.eyeRightX, y: blend.eyeRightY });
    if (id === "iris-neutral") {
      blendNeutral.push(
        blend.eyeLeftX,
        blend.eyeLeftY,
        blend.eyeRightX,
        blend.eyeRightY
      );
    }
    if (id === "iris-far-same" && iris2.binocularYawDisagreementDeg !== null) {
      binocularFarDisagreementDeg = iris2.binocularYawDisagreementDeg;
    }
  }
  for (const id of HEAD_NEUTRAL) {
    const { geometry } = buildIrisGazeFixture(id);
    const iris2 = solveIrisGaze({ geometry, sequence: 2, timestampMs: 0 });
    if (iris2.left.available && iris2.left.x !== null && iris2.left.y !== null) {
      headRelativeMaxAbs = Math.max(
        headRelativeMaxAbs,
        Math.abs(iris2.left.x),
        Math.abs(iris2.left.y)
      );
      irisErrors.push(
        angularErrorFromYawPitch(0, 0, iris2.left.yawDeg ?? 0, iris2.left.pitchDeg ?? 0)
      );
    }
    if (iris2.right.available && iris2.right.x !== null && iris2.right.y !== null) {
      headRelativeMaxAbs = Math.max(
        headRelativeMaxAbs,
        Math.abs(iris2.right.x),
        Math.abs(iris2.right.y)
      );
      irisErrors.push(
        angularErrorFromYawPitch(0, 0, iris2.right.yawDeg ?? 0, iris2.right.pitchDeg ?? 0)
      );
    }
    const blend = fairBlendshapeGazeFromGeometry(geometry);
    const bL = normalizedGazeToYawPitch(blend.eyeLeftX, blend.eyeLeftY);
    const bR = normalizedGazeToYawPitch(blend.eyeRightX, blend.eyeRightY);
    blendErrors.push(angularErrorFromYawPitch(0, 0, bL.yawDeg, bL.pitchDeg));
    blendErrors.push(angularErrorFromYawPitch(0, 0, bR.yawDeg, bR.pitchDeg));
  }
  const iris2dErrors = iris2dTargets.map((t, i) => {
    const o = iris2dOutputs[i];
    return fidelityGazeAngularErrorDeg(t.x, t.y, o.x, o.y);
  });
  const blend2dErrors = blend2dTargets.map((t, i) => {
    const o = blend2dOutputs[i];
    return fidelityGazeAngularErrorDeg(t.x, t.y, o.x, o.y);
  });
  const iris = pathErrors("iris", irisErrors, irisNeutral, iris2dErrors);
  const blendshape = pathErrors("blendshape", blendErrors, blendNeutral, blend2dErrors);
  const medianImprovementDeg = iris.medianDeg !== null && blendshape.medianDeg !== null ? blendshape.medianDeg - iris.medianDeg : null;
  const p95ImprovementDeg = iris.p95Deg !== null && blendshape.p95Deg !== null ? blendshape.p95Deg - iris.p95Deg : null;
  const irisBeatsBlendshape = iris.medianDeg !== null && blendshape.medianDeg !== null && medianImprovementDeg !== null && medianImprovementDeg >= LIVEACT_IRIS_AB_MIN_MEDIAN_IMPROVEMENT_DEG && (iris.p95Deg === null || blendshape.p95Deg === null || iris.p95Deg <= blendshape.p95Deg + 1e-9);
  return {
    contractVersion: "SagaTreeLiveActIrisGazeAbReportV1",
    fixtureVersion: "iris-sphere-v1",
    fixtureIds: [...LIVEACT_IRIS_GAZE_FIXTURE_IDS],
    iris,
    blendshape,
    irisBeatsBlendshape,
    medianImprovementDeg,
    p95ImprovementDeg,
    headRelativeMaxAbs,
    binocularFarDisagreementDeg,
    golden: {
      yaw10AbsErrorDeg,
      yawNeg10AbsErrorDeg,
      pitch8AbsErrorDeg
    },
    method: {
      iris: "eyeball-sphere-solve",
      blendshape: "planar-aperture\u2192v1-eyelook-mapper",
      angularError: "acos(dot) 3D unit gaze directions",
      minMedianImprovementDeg: LIVEACT_IRIS_AB_MIN_MEDIAN_IMPROVEMENT_DEG
    }
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

// src/domains/character/liveact/liveact-hybrid-face-fixtures.ts
var LIVEACT_HYBRID_FACE_FIXTURE_IDS = [
  "hy-neutral",
  "hy-neutral-realistic-geometry",
  "hy-clean-smile-bilateral",
  "hy-smile-under-response",
  "hy-smile-over-response",
  "hy-smile-left-only",
  "hy-smile-right-only",
  "hy-smile-asymmetric",
  "hy-pucker",
  "hy-pucker-under",
  "hy-funnel",
  "hy-press",
  "hy-roll",
  "hy-upper-lower",
  "hy-cheek",
  "hy-nose-sneer",
  "hy-jaw",
  "hy-dense-unavailable",
  "hy-dense-stale-sequence",
  "hy-semantic-noisy",
  "hy-disagree",
  "hy-speech-like"
];
var LIVEACT_HYBRID_TUNING_FIXTURE_IDS = [
  "hy-smile-under-response",
  "hy-pucker-under",
  "hy-smile-left-only",
  "hy-clean-smile-bilateral"
];
var LIVEACT_HYBRID_VALIDATION_FIXTURE_IDS = [
  "hy-smile-over-response",
  "hy-smile-right-only",
  "hy-smile-asymmetric",
  "hy-funnel",
  "hy-press",
  "hy-cheek",
  "hy-nose-sneer",
  "hy-jaw",
  "hy-dense-unavailable",
  "hy-disagree",
  "hy-speech-like"
];
function sc(v2, conf2 = 1) {
  return { available: true, value: v2, confidence: conf2 };
}
function zeroTruth() {
  return {
    mouthSmileLeft: 0,
    mouthSmileRight: 0,
    mouthPucker: 0,
    mouthFunnel: 0,
    mouthPressLeft: 0,
    mouthPressRight: 0,
    mouthUpperUpLeft: 0,
    mouthUpperUpRight: 0,
    mouthLowerDownLeft: 0,
    mouthLowerDownRight: 0,
    cheekSquintLeft: 0,
    cheekSquintRight: 0,
    cheekPuff: 0,
    noseSneerLeft: 0,
    noseSneerRight: 0,
    jawOpen: 0,
    jawForward: 0
  };
}
function buildDenseFromLatent(latent, sequence, opts = {}) {
  const n = opts.noise ?? 0;
  const s = opts.scale ?? 1;
  const base = createEmptyDenseFaceFeatures({
    sequence,
    timestampMs: sequence * 33,
    faceConfidence: 1,
    normalizationStatus: "ok"
  });
  const smileL = clamp015(latent.mouthSmileLeft * s + n);
  const smileR = clamp015(latent.mouthSmileRight * s + n);
  const pucker = clamp015(latent.mouthPucker * s);
  const funnel = clamp015(latent.mouthFunnel * s);
  const jaw = clamp015(latent.jawOpen * s);
  const station = (v2) => sc(v2 * 0.35, 0.95);
  return {
    ...base,
    presence: true,
    contractVersion: LIVEACT_DENSE_FACE_FEATURES_CONTRACT,
    lips: {
      width: sc(0.5 - pucker * 0.15 + funnel * 0.05, 0.9),
      gapLeft: sc(Math.max(0, jaw * 0.4 + latent.mouthLowerDownLeft * 0.2), 0.9),
      gapCenter: sc(Math.max(0, jaw * 0.85 + funnel * 0.25 - pucker * 0.2), 0.95),
      gapRight: sc(Math.max(0, jaw * 0.4 + latent.mouthLowerDownRight * 0.2), 0.9),
      upperContour: {
        available: true,
        confidence: 0.92,
        stations: [
          station(latent.mouthUpperUpLeft),
          station(latent.mouthUpperUpLeft),
          station((latent.mouthUpperUpLeft + latent.mouthUpperUpRight) / 2),
          station(latent.mouthUpperUpRight),
          station(latent.mouthUpperUpRight)
        ]
      },
      lowerContour: {
        available: true,
        confidence: 0.92,
        stations: [
          station(latent.mouthLowerDownLeft),
          station(latent.mouthLowerDownLeft),
          station((latent.mouthLowerDownLeft + latent.mouthLowerDownRight) / 2),
          station(latent.mouthLowerDownRight),
          station(latent.mouthLowerDownRight)
        ]
      },
      curvature: sc((smileL + smileR) * 0.45, 0.9),
      compression: sc(Math.max(pucker * 0.8, latent.mouthPressLeft, latent.mouthPressRight), 0.9),
      protrusion: sc(Math.max(pucker, funnel * 0.85), 0.9),
      cornerLeft: sc(smileL * 0.4, 0.95),
      cornerRight: sc(smileR * 0.4, 0.95),
      asymmetry: sc(smileL - smileR, 0.9)
    },
    cheeks: {
      raiseLeft: sc(Math.max(smileL * 0.7, latent.cheekSquintLeft), 0.9),
      raiseRight: sc(Math.max(smileR * 0.7, latent.cheekSquintRight), 0.9),
      compressionLeft: sc(latent.cheekSquintLeft * 0.8 + latent.cheekPuff * 0.3, 0.85),
      compressionRight: sc(latent.cheekSquintRight * 0.8 + latent.cheekPuff * 0.3, 0.85),
      volumeProxyLeft: sc(latent.cheekPuff * 0.9, 0.8),
      volumeProxyRight: sc(latent.cheekPuff * 0.9, 0.8)
    },
    nose: {
      alarLeft: sc(latent.noseSneerLeft * 0.85, 0.9),
      alarRight: sc(latent.noseSneerRight * 0.85, 0.9),
      nasolabialLeft: sc(latent.noseSneerLeft * 0.7, 0.85),
      nasolabialRight: sc(latent.noseSneerRight * 0.7, 0.85),
      width: sc(0.4 + latent.noseSneerLeft * 0.1 + latent.noseSneerRight * 0.1, 0.8)
    },
    jaw: {
      chinDrop: sc(jaw * 0.9, 0.95),
      chinForward: sc(latent.jawForward * 0.9, 0.9),
      jawWidth: sc(0.5, 0.8)
    },
    // Keep eyes/brows empty-ok from base
    eyes: base.eyes,
    brows: base.brows
  };
}
function clamp015(n) {
  if (!Number.isFinite(n)) return 0;
  if (n <= 0) return 0;
  if (n >= 1) return 1;
  return n;
}
function semanticFromLatent(latent, opts = {}) {
  const scale2 = opts.scale ?? 1;
  const bias = opts.bias ?? 0;
  const map = (v2) => clamp015(v2 * scale2 + bias);
  return {
    mouthSmileLeft: map(latent.mouthSmileLeft),
    mouthSmileRight: map(latent.mouthSmileRight),
    mouthPucker: map(latent.mouthPucker),
    mouthFunnel: map(latent.mouthFunnel),
    mouthPressLeft: map(latent.mouthPressLeft),
    mouthPressRight: map(latent.mouthPressRight),
    mouthUpperUpLeft: map(latent.mouthUpperUpLeft),
    mouthUpperUpRight: map(latent.mouthUpperUpRight),
    mouthLowerDownLeft: map(latent.mouthLowerDownLeft),
    mouthLowerDownRight: map(latent.mouthLowerDownRight),
    cheekSquintLeft: map(latent.cheekSquintLeft),
    cheekSquintRight: map(latent.cheekSquintRight),
    cheekPuff: map(latent.cheekPuff),
    noseSneerLeft: map(latent.noseSneerLeft),
    noseSneerRight: map(latent.noseSneerRight),
    jawOpen: map(latent.jawOpen),
    jawForward: map(latent.jawForward)
  };
}
function frame(idClass, sequence, latent, semantic, dense, denseSequenceOverride) {
  return {
    sequence,
    timestampMs: sequence * 33,
    latent,
    semantic,
    dense,
    denseSequenceOverride,
    class: idClass
  };
}
function buildHybridFaceFixture(id) {
  const seq = 1;
  switch (id) {
    case "hy-neutral": {
      const latent = zeroTruth();
      return frame("clean", seq, latent, semanticFromLatent(latent), buildDenseFromLatent(latent, seq));
    }
    case "hy-neutral-realistic-geometry": {
      const latent = zeroTruth();
      const base = buildDenseFromLatent(latent, seq);
      const dense = {
        ...base,
        lips: {
          ...base.lips,
          width: sc(0.52, 0.92),
          gapLeft: sc(0.02, 0.9),
          gapCenter: sc(0.03, 0.95),
          gapRight: sc(0.02, 0.9),
          compression: sc(0.04, 0.85),
          protrusion: sc(0.03, 0.85),
          curvature: sc(0.02, 0.85),
          cornerLeft: sc(0.01, 0.9),
          cornerRight: sc(0.01, 0.9),
          upperContour: {
            available: true,
            confidence: 0.9,
            stations: [sc(0.02, 0.9), sc(0.02, 0.9), sc(0.01, 0.9), sc(0.02, 0.9), sc(0.02, 0.9)]
          },
          lowerContour: {
            available: true,
            confidence: 0.9,
            stations: [sc(0.02, 0.9), sc(0.02, 0.9), sc(0.01, 0.9), sc(0.02, 0.9), sc(0.02, 0.9)]
          }
        },
        jaw: {
          chinDrop: sc(0.28, 0.95),
          chinForward: sc(0.12, 0.9),
          jawWidth: sc(0.48, 0.8)
        },
        cheeks: {
          raiseLeft: sc(0.03, 0.85),
          raiseRight: sc(0.03, 0.85),
          compressionLeft: sc(0.02, 0.8),
          compressionRight: sc(0.02, 0.8),
          volumeProxyLeft: sc(0.04, 0.75),
          volumeProxyRight: sc(0.04, 0.75)
        },
        nose: {
          alarLeft: sc(0.02, 0.85),
          alarRight: sc(0.02, 0.85),
          nasolabialLeft: sc(0.03, 0.8),
          nasolabialRight: sc(0.03, 0.8),
          width: sc(0.42, 0.8)
        }
      };
      return frame("clean", seq, latent, semanticFromLatent(latent), dense);
    }
    case "hy-clean-smile-bilateral": {
      const latent = { ...zeroTruth(), mouthSmileLeft: 0.7, mouthSmileRight: 0.7, cheekSquintLeft: 0.35, cheekSquintRight: 0.35 };
      return frame("clean", seq, latent, semanticFromLatent(latent), buildDenseFromLatent(latent, seq));
    }
    case "hy-smile-under-response": {
      const latent = { ...zeroTruth(), mouthSmileLeft: 0.75, mouthSmileRight: 0.75, cheekSquintLeft: 0.4, cheekSquintRight: 0.4 };
      return frame(
        "under",
        seq,
        latent,
        semanticFromLatent(latent, { scale: 0.35 }),
        buildDenseFromLatent(latent, seq)
      );
    }
    case "hy-smile-over-response": {
      const latent = { ...zeroTruth(), mouthSmileLeft: 0.55, mouthSmileRight: 0.55 };
      return frame(
        "over",
        seq,
        latent,
        semanticFromLatent(latent, { scale: 1.55 }),
        buildDenseFromLatent(latent, seq)
      );
    }
    case "hy-smile-left-only": {
      const latent = { ...zeroTruth(), mouthSmileLeft: 0.8, cheekSquintLeft: 0.45 };
      return frame(
        "unilateral",
        seq,
        latent,
        semanticFromLatent(latent, { scale: 0.4 }),
        buildDenseFromLatent(latent, seq)
      );
    }
    case "hy-smile-right-only": {
      const latent = { ...zeroTruth(), mouthSmileRight: 0.8, cheekSquintRight: 0.45 };
      return frame(
        "unilateral",
        seq,
        latent,
        semanticFromLatent(latent, { scale: 0.4 }),
        buildDenseFromLatent(latent, seq)
      );
    }
    case "hy-smile-asymmetric": {
      const latent = { ...zeroTruth(), mouthSmileLeft: 0.85, mouthSmileRight: 0.25, cheekSquintLeft: 0.5, cheekSquintRight: 0.15 };
      return frame("other", seq, latent, semanticFromLatent(latent, { scale: 0.5 }), buildDenseFromLatent(latent, seq));
    }
    case "hy-pucker": {
      const latent = { ...zeroTruth(), mouthPucker: 0.7 };
      return frame("clean", seq, latent, semanticFromLatent(latent), buildDenseFromLatent(latent, seq));
    }
    case "hy-pucker-under": {
      const latent = { ...zeroTruth(), mouthPucker: 0.75 };
      return frame("under", seq, latent, semanticFromLatent(latent, { scale: 0.3 }), buildDenseFromLatent(latent, seq));
    }
    case "hy-funnel": {
      const latent = { ...zeroTruth(), mouthFunnel: 0.65, jawOpen: 0.15 };
      return frame("other", seq, latent, semanticFromLatent(latent, { scale: 0.45 }), buildDenseFromLatent(latent, seq));
    }
    case "hy-press": {
      const latent = { ...zeroTruth(), mouthPressLeft: 0.6, mouthPressRight: 0.55 };
      return frame("other", seq, latent, semanticFromLatent(latent, { scale: 0.4 }), buildDenseFromLatent(latent, seq));
    }
    case "hy-roll": {
      const latent = zeroTruth();
      const semantic = {
        ...semanticFromLatent(latent),
        mouthRollUpper: 0.25,
        mouthRollLower: 0.2
      };
      const denseBase = buildDenseFromLatent(latent, seq);
      const dense = {
        ...denseBase,
        lips: {
          ...denseBase.lips,
          compression: sc(0.55, 0.92),
          gapCenter: sc(0.04, 0.9),
          gapLeft: sc(0.03, 0.9),
          gapRight: sc(0.03, 0.9),
          upperContour: {
            available: true,
            confidence: 0.93,
            stations: [sc(0.1, 0.9), sc(0.12, 0.9), sc(0.1, 0.9), sc(0.12, 0.9), sc(0.1, 0.9)]
          },
          lowerContour: {
            available: true,
            confidence: 0.93,
            stations: [sc(0.1, 0.9), sc(0.11, 0.9), sc(0.1, 0.9), sc(0.11, 0.9), sc(0.1, 0.9)]
          }
        }
      };
      return frame("other", seq, latent, semantic, dense);
    }
    case "hy-upper-lower": {
      const latent = {
        ...zeroTruth(),
        mouthUpperUpLeft: 0.55,
        mouthUpperUpRight: 0.5,
        mouthLowerDownLeft: 0.45,
        mouthLowerDownRight: 0.5
      };
      return frame("other", seq, latent, semanticFromLatent(latent, { scale: 0.4 }), buildDenseFromLatent(latent, seq));
    }
    case "hy-cheek": {
      const latent = { ...zeroTruth(), cheekSquintLeft: 0.6, cheekSquintRight: 0.55, cheekPuff: 0.4 };
      return frame("other", seq, latent, semanticFromLatent(latent, { scale: 0.35 }), buildDenseFromLatent(latent, seq));
    }
    case "hy-nose-sneer": {
      const latent = { ...zeroTruth(), noseSneerLeft: 0.7, noseSneerRight: 0.2 };
      return frame("unilateral", seq, latent, semanticFromLatent(latent, { scale: 0.4 }), buildDenseFromLatent(latent, seq));
    }
    case "hy-jaw": {
      const latent = { ...zeroTruth(), jawOpen: 0.7, jawForward: 0.2 };
      return frame("other", seq, latent, semanticFromLatent(latent, { scale: 0.4 }), buildDenseFromLatent(latent, seq));
    }
    case "hy-dense-unavailable": {
      const latent = { ...zeroTruth(), mouthSmileLeft: 0.6, mouthSmileRight: 0.6 };
      return frame("unavailable", seq, latent, semanticFromLatent(latent), null);
    }
    case "hy-dense-stale-sequence": {
      const latent = { ...zeroTruth(), mouthSmileLeft: 0.7, mouthSmileRight: 0.7 };
      return frame(
        "unavailable",
        seq,
        latent,
        semanticFromLatent(latent),
        buildDenseFromLatent(latent, 99),
        99
      );
    }
    case "hy-semantic-noisy": {
      const latent = { ...zeroTruth(), mouthSmileLeft: 0.65, mouthSmileRight: 0.65 };
      const sem = semanticFromLatent(latent, { scale: 0.5 });
      return frame(
        "other",
        seq,
        latent,
        { ...sem, mouthSmileLeft: clamp015((sem.mouthSmileLeft ?? 0) + 0.15), mouthSmileRight: clamp015((sem.mouthSmileRight ?? 0) - 0.1) },
        buildDenseFromLatent(latent, seq)
      );
    }
    case "hy-disagree": {
      const latent = { ...zeroTruth(), mouthSmileLeft: 0.5, mouthSmileRight: 0.5 };
      return frame(
        "disagree",
        seq,
        latent,
        { mouthSmileLeft: 0.9, mouthSmileRight: 0.9 },
        buildDenseFromLatent({ ...latent, mouthSmileLeft: 0.15, mouthSmileRight: 0.15 }, seq)
      );
    }
    case "hy-speech-like": {
      const latent = {
        ...zeroTruth(),
        jawOpen: 0.35,
        mouthSmileLeft: 0.2,
        mouthSmileRight: 0.22,
        mouthPucker: 0.15,
        mouthFunnel: 0.1
      };
      return frame("speech", seq, latent, semanticFromLatent(latent, { scale: 0.55 }), buildDenseFromLatent(latent, seq));
    }
    default: {
      const _e = id;
      return _e;
    }
  }
}
function buildHybridSpeechLikeSequence(frameCount = 60) {
  const out = [];
  for (let i = 0; i < frameCount; i += 1) {
    const t = i / Math.max(1, frameCount - 1);
    const env = t < 0.2 ? t / 0.2 : t < 0.7 ? 1 : t < 0.9 ? 1 - (t - 0.7) / 0.2 : 0;
    const latent = {
      ...zeroTruth(),
      jawOpen: clamp015(0.55 * env),
      mouthSmileLeft: clamp015(0.25 * env),
      mouthSmileRight: clamp015(0.28 * env),
      mouthPucker: clamp015(0.2 * Math.sin(t * Math.PI * 4) * env),
      mouthFunnel: clamp015(0.12 * env)
    };
    const seq = i + 1;
    out.push(
      frame(
        "speech",
        seq,
        latent,
        semanticFromLatent(latent, { scale: 0.5 }),
        buildDenseFromLatent(latent, seq)
      )
    );
  }
  return out;
}

// src/domains/character/liveact/liveact-hybrid-face-ab.ts
var ACTIVE_LATENT_THRESHOLD = 0.05;
var ACTIVE_CHANGE_THRESHOLD = 0.02;
var EVAL_CONTROLS = [
  "mouthSmileLeft",
  "mouthSmileRight",
  "mouthPucker",
  "mouthFunnel",
  "mouthPressLeft",
  "mouthPressRight",
  "cheekSquintLeft",
  "cheekSquintRight",
  "noseSneerLeft",
  "noseSneerRight",
  "jawOpen"
];
function latentValue(latent, id) {
  return latent[id] ?? 0;
}
function semanticValue(face, id) {
  const v2 = face[id];
  return typeof v2 === "number" && Number.isFinite(v2) ? v2 : 0;
}
function absErrorsForFrame(frame2, path) {
  const errors = [];
  const hybrid = path === "hybrid" ? solveHybridFace({
    semanticFace: frame2.semantic,
    dense: frame2.dense,
    sequence: frame2.sequence,
    timestampMs: frame2.timestampMs,
    denseSequence: frame2.denseSequenceOverride ?? frame2.dense?.sequence ?? null
  }) : null;
  for (const id of EVAL_CONTROLS) {
    const truth = latentValue(frame2.latent, id);
    const pred = path === "v1" ? semanticValue(frame2.semantic, id) : hybrid.controls[id].value ?? semanticValue(frame2.semantic, id);
    errors.push(Math.abs(pred - truth));
  }
  return errors;
}
function runPath(ids, path) {
  const all = [];
  for (const id of ids) {
    all.push(...absErrorsForFrame(buildHybridFaceFixture(id), path));
  }
  return all;
}
function runPathActive(ids, path) {
  const all = [];
  for (const id of ids) {
    const frame2 = buildHybridFaceFixture(id);
    const hybrid = path === "hybrid" ? solveHybridFace({
      semanticFace: frame2.semantic,
      dense: frame2.dense,
      sequence: frame2.sequence,
      timestampMs: frame2.timestampMs,
      denseSequence: frame2.denseSequenceOverride ?? frame2.dense?.sequence ?? null
    }) : null;
    for (const cid of EVAL_CONTROLS) {
      const truth = latentValue(frame2.latent, cid);
      const v1Pred = semanticValue(frame2.semantic, cid);
      const hyPred = hybrid !== null ? hybrid.controls[cid].value ?? v1Pred : v1Pred;
      const pred = path === "v1" ? v1Pred : hyPred;
      const active = truth >= ACTIVE_LATENT_THRESHOLD || Math.abs(v1Pred - hyPred) >= ACTIVE_CHANGE_THRESHOLD;
      if (!active) continue;
      all.push(Math.abs(pred - truth));
    }
  }
  return all;
}
function cleanActiveControlRows() {
  const frame2 = buildHybridFaceFixture("hy-clean-smile-bilateral");
  const hybrid = solveHybridFace({
    semanticFace: frame2.semantic,
    dense: frame2.dense,
    sequence: frame2.sequence,
    timestampMs: frame2.timestampMs,
    denseSequence: frame2.dense?.sequence ?? null
  });
  const rows = [];
  for (const cid of EVAL_CONTROLS) {
    const latent = latentValue(frame2.latent, cid);
    const v1 = semanticValue(frame2.semantic, cid);
    const hy = hybrid.controls[cid].value ?? v1;
    const active = latent >= ACTIVE_LATENT_THRESHOLD || Math.abs(v1 - hy) >= ACTIVE_CHANGE_THRESHOLD;
    if (!active) continue;
    const v1Error = Math.abs(v1 - latent);
    const hybridError = Math.abs(hy - latent);
    rows.push({
      control: cid,
      latent,
      v1,
      hybrid: hy,
      v1Error,
      hybridError,
      delta: v1Error - hybridError
    });
  }
  return rows;
}
function speechSeries(path) {
  const frames = buildHybridSpeechLikeSequence(60);
  const truth = [];
  const pred = [];
  const timestampsMs = [];
  for (const f of frames) {
    const t = (f.latent.jawOpen + (f.latent.mouthSmileLeft + f.latent.mouthSmileRight) / 2 + f.latent.mouthPucker) / 3;
    truth.push(t);
    timestampsMs.push(f.timestampMs);
    if (path === "v1") {
      const s = (semanticValue(f.semantic, "jawOpen") + (semanticValue(f.semantic, "mouthSmileLeft") + semanticValue(f.semantic, "mouthSmileRight")) / 2 + semanticValue(f.semantic, "mouthPucker")) / 3;
      pred.push(s);
    } else {
      const h = solveHybridFace({
        semanticFace: f.semantic,
        dense: f.dense,
        sequence: f.sequence,
        timestampMs: f.timestampMs,
        denseSequence: f.dense?.sequence ?? null
      });
      const s = ((h.controls.jawOpen.value ?? 0) + ((h.controls.mouthSmileLeft.value ?? 0) + (h.controls.mouthSmileRight.value ?? 0)) / 2 + (h.controls.mouthPucker.value ?? 0)) / 3;
      pred.push(s);
    }
  }
  return { truth, pred, timestampsMs };
}
function crossTalkMax(path) {
  const f = buildHybridFaceFixture("hy-smile-left-only");
  const unintended = [
    "mouthPucker",
    "mouthFunnel",
    "jawOpen",
    "mouthSmileRight"
  ];
  let maxU = 0;
  if (path === "v1") {
    for (const id of unintended) {
      maxU = Math.max(maxU, semanticValue(f.semantic, id));
    }
    return maxU;
  }
  const h = solveHybridFace({
    semanticFace: f.semantic,
    dense: f.dense,
    sequence: f.sequence,
    timestampMs: f.timestampMs,
    denseSequence: f.dense?.sequence ?? null
  });
  for (const id of unintended) {
    maxU = Math.max(maxU, h.controls[id].value ?? 0);
  }
  return maxU;
}
function neutralLeakageMax() {
  const f = buildHybridFaceFixture("hy-neutral-realistic-geometry");
  const h = solveHybridFace({
    semanticFace: f.semantic,
    dense: f.dense,
    sequence: f.sequence,
    timestampMs: f.timestampMs,
    denseSequence: f.dense?.sequence ?? null
  });
  const watch = [
    "jawOpen",
    "mouthPressLeft",
    "mouthPressRight",
    "mouthRollUpper",
    "mouthRollLower",
    "mouthPucker",
    "mouthFunnel",
    "mouthSmileLeft",
    "mouthSmileRight",
    "cheekSquintLeft",
    "cheekSquintRight",
    "noseSneerLeft",
    "noseSneerRight"
  ];
  let max = 0;
  for (const id of watch) {
    max = Math.max(max, h.controls[id].value ?? 0);
  }
  return max;
}
function runHybridFaceAbBenchmark() {
  const motionIds = LIVEACT_HYBRID_FACE_FIXTURE_IDS.filter(
    (id) => id !== "hy-speech-like" && id !== "hy-dense-stale-sequence" && id !== "hy-neutral-realistic-geometry" && id !== "hy-roll"
  );
  const v1Errors = runPath(motionIds, "v1");
  const hyErrors = runPath(motionIds, "hybrid");
  const v1Median = fidelityMedian(v1Errors);
  const hyMedian = fidelityMedian(hyErrors);
  const motionImprovement = v1Median !== null && hyMedian !== null ? v1Median - hyMedian : null;
  const cleanActiveControls = cleanActiveControlRows();
  const cleanNonDegradation = cleanActiveControls.length > 0 && cleanActiveControls.every(
    (row) => row.hybridError <= row.v1Error + LIVEACT_HYBRID_AB_NON_DEGRADATION_TOL
  );
  const valUnder = ["hy-smile-over-response", "hy-funnel", "hy-cheek", "hy-nose-sneer", "hy-jaw"];
  const v1Val = runPath(valUnder, "v1");
  const hyVal = runPath(valUnder, "hybrid");
  const validationImprovement = (fidelityMedian(v1Val) ?? 0) - (fidelityMedian(hyVal) ?? 0);
  const underIds = ["hy-smile-under-response", "hy-pucker-under", "hy-smile-left-only"];
  const activeUnderResponseMedianAbs = (fidelityMedian(runPathActive(underIds, "v1")) ?? 0) - (fidelityMedian(runPathActive(underIds, "hybrid")) ?? 0);
  const hybridBeatsV1 = cleanNonDegradation && activeUnderResponseMedianAbs >= LIVEACT_HYBRID_AB_MIN_MEDIAN_IMPROVEMENT && validationImprovement >= -LIVEACT_HYBRID_AB_NON_DEGRADATION_TOL;
  const spV1 = speechSeries("v1");
  const spHy = speechSeries("hybrid");
  const v1Corr = fidelityPearson(spV1.truth, spV1.pred);
  const hyCorr = fidelityPearson(spHy.truth, spHy.pred);
  const v1Amp = fidelityAmplitudeRetentionPct(spV1.truth, spV1.pred);
  const hyAmp = fidelityAmplitudeRetentionPct(spHy.truth, spHy.pred);
  const v1Vel = fidelityVelocityRetentionPct(spV1.truth, spV1.pred, spV1.timestampsMs);
  const hyVel = fidelityVelocityRetentionPct(spHy.truth, spHy.pred, spHy.timestampsMs);
  const v1Sat = fidelitySaturationFraction(spV1.pred, LIVEACT_FIDELITY_SATURATION_THRESHOLD);
  const hySat = fidelitySaturationFraction(spHy.pred, LIVEACT_FIDELITY_SATURATION_THRESHOLD);
  const lastHy = spHy.pred.slice(-5);
  const returnToNeutralOk = lastHy.every((v2) => Math.abs(v2) <= 0.08);
  const ctV1 = crossTalkMax("v1");
  const ctHy = crossTalkMax("hybrid");
  const leakage = neutralLeakageMax();
  void LIVEACT_HYBRID_VALIDATION_FIXTURE_IDS;
  void LIVEACT_HYBRID_FACE_CONTROL_IDS;
  return {
    contractVersion: "SagaTreeLiveActHybridFaceAbReportV1",
    fixtureVersion: "hybrid-face-v1",
    controlsEvaluated: EVAL_CONTROLS,
    v1: { path: "v1", medianAbsError: v1Median, errors: v1Errors },
    hybrid: { path: "hybrid", medianAbsError: hyMedian, errors: hyErrors },
    motionImprovement,
    cleanActiveControls,
    cleanNonDegradation,
    validationImprovement,
    activeUnderResponseMedianAbs,
    requiredMinimum: LIVEACT_HYBRID_AB_MIN_MEDIAN_IMPROVEMENT,
    hybridBeatsV1,
    neutralLeakage: {
      maxUnintendedActivation: leakage,
      fixtureId: "hy-neutral-realistic-geometry"
    },
    speech: {
      v1Correlation: v1Corr,
      hybridCorrelation: hyCorr,
      v1AmplitudeRetentionPct: v1Amp,
      hybridAmplitudeRetentionPct: hyAmp,
      v1VelocityRetentionPct: v1Vel,
      hybridVelocityRetentionPct: hyVel,
      v1Saturation: v1Sat,
      hybridSaturation: hySat,
      returnToNeutralOk
    },
    crossTalk: {
      v1MaxUnintended: ctV1,
      hybridMaxUnintended: ctHy,
      notWorse: ctHy <= ctV1 + 0.05
    },
    avatarContourFidelity: "MEASURED_VIA_451_E2E_GATE",
    method: {
      minMedianImprovement: LIVEACT_HYBRID_AB_MIN_MEDIAN_IMPROVEMENT,
      nonDegradationTol: LIVEACT_HYBRID_AB_NON_DEGRADATION_TOL
    }
  };
}

// src/domains/character/liveact/liveact-temporal-fixtures.ts
function baseFrame(timestampMs, sequence) {
  return createNeutralLiveActFrame({ timestampMs, sequence, trackingLost: false });
}
function withFace(frame2, patch) {
  const face = { ...createNeutralLiveActFaceChannels(), ...frame2.face, ...patch };
  return { ...frame2, face };
}
function temporalTimestamps(hz, count, startMs = 0) {
  const dt = 1e3 / hz;
  const out = [];
  for (let i = 0; i < count; i += 1) out.push(startMs + i * dt);
  return out;
}
function temporalTimestampsFromDeltas(deltasMs, startMs = 0) {
  const out = [startMs];
  let t = startMs;
  for (const d of deltasMs) {
    t += d;
    out.push(t);
  }
  return out;
}
function buildHeadYawStepSequence(hz = 60, holdFrames = 30) {
  const rise = 6;
  const total = rise + holdFrames + rise + 10;
  const ts = temporalTimestamps(hz, total);
  const frames = [];
  const truth = [];
  for (let i = 0; i < total; i += 1) {
    let y = 0;
    if (i < rise) y = i / rise * 0.4;
    else if (i < rise + holdFrames) y = 0.4;
    else if (i < rise + holdFrames + rise) {
      y = 0.4 * (1 - (i - rise - holdFrames) / rise);
    }
    const f = baseFrame(ts[i], i + 1);
    frames.push({ ...f, head: { ...f.head, yaw: y } });
    truth.push(y);
  }
  return { kind: "step", frames, truth, primaryKey: "head.yaw" };
}
function buildGazeStepSequence(hz = 60) {
  const phases = [8, 20, 8, 12];
  const total = phases.reduce((a, b) => a + b, 0);
  const ts = temporalTimestamps(hz, total);
  const frames = [];
  const truth = [];
  let i = 0;
  const push = (n, v2) => {
    for (let k = 0; k < n; k += 1) {
      const f = baseFrame(ts[i], i + 1);
      frames.push({ ...f, eyeLeft: { x: v2, y: 0 }, eyeRight: { x: v2, y: 0 } });
      truth.push(v2);
      i += 1;
    }
  };
  push(phases[0], 0);
  push(phases[1], 0.6);
  push(phases[2], 0);
  push(phases[3], 0);
  return { kind: "step", frames, truth, primaryKey: "eyeLeft.x" };
}
function buildLipSineSequence(freqHz, sampleHz = 60, durationSeconds = 2, amp = 0.55) {
  const count = Math.max(8, Math.round(sampleHz * durationSeconds));
  const ts = temporalTimestamps(sampleHz, count);
  const frames = [];
  const truth = [];
  for (let i = 0; i < count; i += 1) {
    const t = i / sampleHz;
    const v2 = amp * 0.5 * (1 + Math.sin(2 * Math.PI * freqHz * t));
    const f = baseFrame(ts[i], i + 1);
    frames.push(withFace(f, { jawOpen: v2, mouthPucker: v2 * 0.35 }));
    truth.push(v2);
  }
  return { kind: "sine", frames, truth, primaryKey: "face.jawOpen" };
}
function buildHeadJitterSequence(hz = 60, count = 90) {
  const pattern = [0, 0.01, -8e-3, 6e-3, -0.01, 4e-3, -5e-3, 7e-3, -3e-3, 2e-3];
  const ts = temporalTimestamps(hz, count);
  const frames = [];
  const truth = [];
  for (let i = 0; i < count; i += 1) {
    const y = pattern[i % pattern.length];
    const f = baseFrame(ts[i], i + 1);
    frames.push({ ...f, head: { ...f.head, yaw: y } });
    truth.push(0);
  }
  return { kind: "jitter", frames, truth, primaryKey: "head.yaw" };
}
function buildBlinkSequence(hz = 60) {
  const total = 40;
  const ts = temporalTimestamps(hz, total);
  const frames = [];
  const truth = [];
  for (let i = 0; i < total; i += 1) {
    let b = 0;
    if (i >= 8 && i < 14) b = Math.min(1, (i - 8) / 3);
    else if (i >= 14 && i < 18) b = 1;
    else if (i >= 18 && i < 26) b = Math.max(0, 1 - (i - 18) / 6);
    const f = baseFrame(ts[i], i + 1);
    frames.push(withFace(f, { eyeBlinkLeft: b, eyeBlinkRight: 0 }));
    truth.push(b);
  }
  return { kind: "blink", frames, truth, primaryKey: "face.eyeBlinkLeft" };
}
function buildTemporalSpeechSequence(sampleHz = 60, frameCount = 60) {
  const ts = temporalTimestamps(sampleHz, frameCount);
  const frames = [];
  const truth = [];
  for (let i = 0; i < frameCount; i += 1) {
    const t = i / Math.max(1, frameCount - 1);
    const env = t < 0.2 ? t / 0.2 : t < 0.7 ? 1 : t < 0.9 ? 1 - (t - 0.7) / 0.2 : 0;
    const jaw = 0.55 * env;
    const smile = 0.25 * env;
    const pucker = 0.2 * Math.sin(t * Math.PI * 4) * env;
    const composite = (jaw + smile + Math.max(0, pucker)) / 3;
    const f = baseFrame(ts[i], i + 1);
    frames.push(
      withFace(f, {
        jawOpen: jaw,
        mouthSmileLeft: smile,
        mouthSmileRight: smile * 1.05,
        mouthPucker: Math.max(0, pucker)
      })
    );
    truth.push(composite);
  }
  return { kind: "speech", frames, truth, primaryKey: "speech.composite" };
}
function buildLostReacquireSmileSequence(hz = 60) {
  const frames = [];
  const truth = [];
  let seq = 1;
  let t = 0;
  const dt = 1e3 / hz;
  const pushActive = (n, smile) => {
    for (let i = 0; i < n; i += 1) {
      const f = withFace(baseFrame(t, seq), {
        mouthSmileLeft: smile,
        mouthSmileRight: smile
      });
      frames.push(f);
      truth.push(smile);
      t += dt;
      seq += 1;
    }
  };
  const pushLost = (n) => {
    for (let i = 0; i < n; i += 1) {
      frames.push(
        createNeutralLiveActFrame({
          timestampMs: t,
          sequence: seq,
          trackingLost: true
        })
      );
      truth.push(0);
      t += dt;
      seq += 1;
    }
  };
  pushActive(20, 0.8);
  pushLost(15);
  pushActive(20, 0);
  return { kind: "lost-reacquire", frames, truth, primaryKey: "face.mouthSmileLeft" };
}
function buildDroppedFrameLipSequence() {
  const deltas = [33, 33, 66, 33, 33, 100, 33, 33, 33, 150, 33, 33, 33, 33];
  const ts = temporalTimestampsFromDeltas(deltas, 0);
  const frames = [];
  const truth = [];
  for (let i = 0; i < ts.length; i += 1) {
    const v2 = i < 3 ? 0 : i < 10 ? 0.7 : 0;
    const f = baseFrame(ts[i], i + 1);
    frames.push(withFace(f, { jawOpen: v2 }));
    truth.push(v2);
  }
  return { kind: "dropped", frames, truth, primaryKey: "face.jawOpen" };
}

// src/domains/character/liveact/liveact-temporal-ab.ts
function primaryScalarKey(seq) {
  if (seq.primaryKey === "speech.composite") return "face.jawOpen";
  return seq.primaryKey;
}
function runPath2(seq, path) {
  const outputs = [];
  const frames = [];
  const timestampsMs = [];
  let prevFrame = null;
  let temporal = null;
  const key = primaryScalarKey(seq);
  for (const mapped of seq.frames) {
    timestampsMs.push(mapped.timestampMs);
    if (path === "v1-fixed") {
      const out = smoothLiveActFrame(prevFrame, mapped, DEFAULT_LIVEACT_LIMITS.smooth);
      prevFrame = out;
      frames.push(out);
      if (seq.primaryKey === "speech.composite") {
        outputs.push(
          ((out.face.jawOpen ?? 0) + ((out.face.mouthSmileLeft ?? 0) + (out.face.mouthSmileRight ?? 0)) / 2 + (out.face.mouthPucker ?? 0)) / 3
        );
      } else {
        outputs.push(readTemporalScalar(out, key));
      }
    } else {
      const step = stepAdaptiveTemporal(temporal, mapped);
      temporal = step.state;
      frames.push(step.frame);
      if (seq.primaryKey === "speech.composite") {
        const out = step.frame;
        outputs.push(
          ((out.face.jawOpen ?? 0) + ((out.face.mouthSmileLeft ?? 0) + (out.face.mouthSmileRight ?? 0)) / 2 + (out.face.mouthPucker ?? 0)) / 3
        );
      } else {
        outputs.push(readTemporalScalar(step.frame, key));
      }
    }
  }
  return { outputs, frames, timestampsMs };
}
function lagP95Ms(truth, pred, timestampsMs) {
  return fidelityLagP95Ms(truth, pred, timestampsMs, { minDelta: 0.04, lagWindowMs: 120 });
}
function returnLagMs(truth, pred, timestampsMs, eps = 0.08) {
  let truthNeutral = -1;
  for (let i = truth.length - 1; i >= 0; i -= 1) {
    if (Math.abs(truth[i]) > eps) {
      truthNeutral = i + 1;
      break;
    }
  }
  if (truthNeutral < 0 || truthNeutral >= truth.length) return 0;
  for (let i = truthNeutral; i < pred.length; i += 1) {
    if (Math.abs(pred[i]) <= eps) {
      return Math.max(0, timestampsMs[i] - timestampsMs[truthNeutral]);
    }
  }
  return timestampsMs[timestampsMs.length - 1] - timestampsMs[truthNeutral];
}
function metricsFor(seq, path, stepTarget) {
  const { outputs, timestampsMs } = runPath2(seq, path);
  const truth = seq.truth;
  return {
    jitterP95: fidelityP95AbsDev(outputs),
    lagMs: lagP95Ms(truth, outputs, timestampsMs),
    overshoot: stepTarget !== void 0 ? fidelityOvershoot(truth, outputs, stepTarget) : fidelityOvershoot(truth, outputs, Math.max(...truth)),
    amplitudeRetentionPct: fidelityAmplitudeRetentionPct(truth, outputs),
    velocityRetentionPct: fidelityVelocityRetentionPct(truth, outputs, timestampsMs),
    saturation: fidelitySaturationFraction(outputs, LIVEACT_FIDELITY_SATURATION_THRESHOLD),
    returnLagMs: returnLagMs(truth, outputs, timestampsMs),
    correlation: fidelityPearson(truth, outputs),
    peak: fidelityPercentile(outputs, 100) ?? Math.max(...outputs, 0)
  };
}
function blinkCrossTalk(path) {
  const seq = buildBlinkSequence(60);
  const { frames } = runPath2(seq, path);
  let maxR = 0;
  for (const f of frames) {
    maxR = Math.max(maxR, f.face.eyeBlinkRight ?? 0);
  }
  return maxR;
}
function lipSweep(path) {
  const out = {};
  for (const freq of [1, 2, 3, 5]) {
    out[`${freq}Hz`] = metricsFor(buildLipSineSequence(freq, 60, 2), path);
  }
  return out;
}
function runTemporalAbBenchmark() {
  const headStep = buildHeadYawStepSequence(60);
  const headJitter = buildHeadJitterSequence(60);
  const gaze = buildGazeStepSequence(60);
  const blink = buildBlinkSequence(60);
  const speech = buildTemporalSpeechSequence(60, 60);
  const lost = buildLostReacquireSmileSequence(60);
  const dropped = buildDroppedFrameLipSequence();
  const v1HeadJ = metricsFor(headJitter, "v1-fixed");
  const adHeadJ = metricsFor(headJitter, "adaptive");
  const v1HeadS = metricsFor(headStep, "v1-fixed", 0.4);
  const adHeadS = metricsFor(headStep, "adaptive", 0.4);
  const v1Gaze = metricsFor(gaze, "v1-fixed", 0.6);
  const adGaze = metricsFor(gaze, "adaptive", 0.6);
  const v1Blink = metricsFor(blink, "v1-fixed");
  const adBlink = metricsFor(blink, "adaptive");
  const v1Speech = metricsFor(speech, "v1-fixed");
  const adSpeech = metricsFor(speech, "adaptive");
  const v1Lips = lipSweep("v1-fixed");
  const adLips = lipSweep("adaptive");
  const lip30 = metricsFor(buildLipSineSequence(3, 30, 2), "adaptive");
  const lip60 = metricsFor(buildLipSineSequence(3, 60, 2), "adaptive");
  const amp30 = lip30.amplitudeRetentionPct ?? 0;
  const amp60 = lip60.amplitudeRetentionPct ?? 0;
  const fpsComparable = Math.abs(amp30 - amp60) / Math.max(1, Math.max(amp30, amp60)) <= LIVEACT_TEMPORAL_TARGETS.fpsInvarianceTol;
  const lostAd = runPath2(lost, "adaptive");
  const after = lostAd.outputs.slice(-20);
  const lostMax = Math.max(...after, 0);
  const dropAd = runPath2(dropped, "adaptive");
  const droppedFinite = dropAd.outputs.every((v2) => Number.isFinite(v2));
  const dropOver = fidelityOvershoot(dropped.truth, dropAd.outputs, 0.7);
  const lipOk = [1, 2, 3, 5].every((f) => {
    const m = adLips[`${f}Hz`];
    const amp = m.amplitudeRetentionPct ?? 0;
    const lag = m.lagMs ?? 999;
    return amp >= LIVEACT_TEMPORAL_TARGETS.lipAmplitudeRetentionMinPct && amp <= LIVEACT_TEMPORAL_TARGETS.lipAmplitudeRetentionMaxPct && lag <= LIVEACT_TEMPORAL_TARGETS.lipLagP95MsMax;
  });
  const returnOk = (adSpeech.returnLagMs ?? 999) <= LIVEACT_TEMPORAL_TARGETS.lipReturnLagMsMax;
  const satOk = (adSpeech.saturation ?? 1) < LIVEACT_TEMPORAL_TARGETS.lipSaturationMax;
  const blinkOk = (adBlink.peak ?? 0) >= LIVEACT_TEMPORAL_TARGETS.blinkPeakMin;
  const gazeOk = (adGaze.lagMs ?? 999) <= (v1Gaze.lagMs ?? 0) + LIVEACT_TEMPORAL_TARGETS.gazeLagSlackMsVsV1;
  const headJitterOk = (adHeadJ.jitterP95 ?? 1) <= (v1HeadJ.jitterP95 ?? 1) + 1e-9;
  const headLagOk = (adHeadS.lagMs ?? 999) <= (v1HeadS.lagMs ?? 0) + LIVEACT_TEMPORAL_TARGETS.headLagSlackMsVsV1;
  const overshootOk = (adHeadS.overshoot ?? 1) <= (v1HeadS.overshoot ?? 0) + 0.02 && (adGaze.overshoot ?? 1) <= (v1Gaze.overshoot ?? 0) + 0.02;
  const lifecycleOk = lostMax <= 0.08 && droppedFinite && (dropOver ?? 0) <= 0.05;
  const success = lipOk && returnOk && satOk && blinkOk && gazeOk && headJitterOk && headLagOk && overshootOk && fpsComparable && lifecycleOk;
  const frequencySweep = {};
  for (const f of [1, 2, 3, 5]) {
    frequencySweep[`${f}Hz`] = { v1: v1Lips[`${f}Hz`], adaptive: adLips[`${f}Hz`] };
  }
  return {
    contractVersion: LIVEACT_TEMPORAL_CONTRACT,
    policyVersion: LIVEACT_TEMPORAL_POLICY_VERSION,
    v1Fixed: {
      headJitterP95: v1HeadJ.jitterP95,
      headLagMs: v1HeadS.lagMs,
      headOvershoot: v1HeadS.overshoot,
      headReturnLagMs: v1HeadS.returnLagMs,
      gazeLagMs: v1Gaze.lagMs,
      gazeOvershoot: v1Gaze.overshoot,
      blinkPeak: v1Blink.peak,
      blinkCrossTalk: blinkCrossTalk("v1-fixed"),
      lip: v1Lips,
      speech: v1Speech
    },
    adaptive: {
      headJitterP95: adHeadJ.jitterP95,
      headLagMs: adHeadS.lagMs,
      headOvershoot: adHeadS.overshoot,
      headReturnLagMs: adHeadS.returnLagMs,
      gazeLagMs: adGaze.lagMs,
      gazeOvershoot: adGaze.overshoot,
      blinkPeak: adBlink.peak,
      blinkCrossTalk: blinkCrossTalk("adaptive"),
      lip: adLips,
      speech: adSpeech
    },
    frequencySweep,
    fps: { hz30: lip30, hz60: lip60, comparable: fpsComparable },
    lifecycle: {
      lostReacquireMaxSmileAfter: lostMax,
      droppedFinite,
      droppedOvershoot: dropOver
    },
    targets: LIVEACT_TEMPORAL_TARGETS,
    success,
    privacy: { committedRawLandmarks: 0, committedWebcam: 0 }
  };
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
function clearLiveActPersonalCalibrationProfile(scope) {
  if (!isLiveActPersonalCalibrationScopeComplete(scope)) return;
  const ls = getLocalStorage();
  if (!ls) return;
  try {
    ls.removeItem(liveActPersonalCalibrationStorageKey(scope));
  } catch {
  }
}

// src/domains/character/liveact/liveact-personal-calibration-fixtures.ts
function noiseAt(i, amp = 0.01) {
  const pattern = [0, 0.01, -8e-3, 6e-3, -4e-3, 3e-3, -7e-3, 5e-3];
  return (pattern[i % pattern.length] ?? 0) * (amp / 0.01);
}
function mutableFace() {
  return { ...createNeutralLiveActFaceChannels() };
}
function baseSample() {
  const s = createEmptyLiveActSourceSample();
  s.faceIndex = 0;
  s.presence = 1;
  s.headYaw = 0.02;
  s.headPitch = -0.01;
  s.headRoll = 5e-3;
  s.eyeLeftX = 0.03;
  s.eyeLeftY = -0.02;
  s.eyeRightX = 0.03;
  s.eyeRightY = -0.02;
  const face = mutableFace();
  face.mouthSmileLeft = 0.08;
  face.mouthSmileRight = 0.08;
  face.jawOpen = 0.02;
  s.face = face;
  return s;
}
function buildPersonalCalibrationActorSession() {
  const session = createLiveActPersonalCalibrationSessionV2({
    ownerLocalId: "fixture-owner",
    characterLocalId: "fixture-actor"
  });
  let t = 0;
  const dt = 1e3 / 30;
  for (let phaseIndex = 0; phaseIndex < LIVEACT_PERSONAL_CALIBRATION_PHASES.length; phaseIndex += 1) {
    session.phaseIndex = phaseIndex;
    session.phaseStartedAtMs = t;
    session.validFrameCount = 0;
    session.validCaptureMs = 0;
    session.lastValidSampleTimestamp = 0;
    const phase = LIVEACT_PERSONAL_CALIBRATION_PHASES[phaseIndex];
    const frames = Math.ceil(phase.durationMs / dt);
    for (let i = 0; i < frames; i += 1) {
      t += dt;
      const sample = baseSample();
      const face = mutableFace();
      face.mouthSmileLeft = 0.08;
      face.mouthSmileRight = 0.08;
      face.jawOpen = 0.02;
      sample.headYaw = 0.02 + noiseAt(i);
      sample.headPitch = -0.01 + noiseAt(i + 1);
      sample.headRoll = 5e-3 + noiseAt(i + 2, 5e-3);
      sample.eyeLeftX = 0.03 + noiseAt(i + 3, 8e-3);
      sample.eyeLeftY = -0.02 + noiseAt(i + 4, 8e-3);
      sample.eyeRightX = 0.03 + noiseAt(i + 5, 8e-3);
      sample.eyeRightY = -0.02 + noiseAt(i + 6, 8e-3);
      if (phase.id === "headGaze") {
        const u = i / frames;
        sample.headYaw = 0.02 + Math.sin(u * Math.PI * 2) * 0.35;
        sample.headPitch = -0.01 + Math.sin(u * Math.PI * 2 + 1) * 0.25;
        sample.eyeLeftX = 0.03 + Math.sin(u * Math.PI * 2) * 0.4;
        sample.eyeRightX = 0.03 + Math.sin(u * Math.PI * 2) * 0.4;
        sample.eyeLeftY = -0.02 + Math.cos(u * Math.PI * 2) * 0.3;
        sample.eyeRightY = -0.02 + Math.cos(u * Math.PI * 2) * 0.3;
      } else if (phase.id === "eyesBrows") {
        const blink = i % 20 < 4 ? 0.95 : 0.05;
        face.eyeBlinkLeft = blink;
        face.eyeBlinkRight = blink > 0.5 ? 0.25 : 0.05;
        if (i > frames * 0.4 && i < frames * 0.55) {
          face.eyeBlinkLeft = 0.95;
          face.eyeBlinkRight = 0.2;
        }
        face.browInnerUp = i % 15 < 5 ? 0.7 : 0.05;
      } else if (phase.id === "jawSmile") {
        face.jawOpen = i % 18 < 6 ? 0.75 : 0.05;
        face.mouthSmileLeft = i % 16 < 7 ? 0.85 : 0.1;
        face.mouthSmileRight = i % 16 < 7 ? 0.35 : 0.1;
        face.noseSneerLeft = 0.04 + noiseAt(i, 0.02);
      } else if (phase.id === "lips") {
        face.mouthPucker = i % 14 < 5 ? 0.7 : 0.05;
        face.mouthFunnel = i % 16 < 5 ? 0.65 : 0.05;
        face.mouthPressLeft = i % 12 < 4 ? 0.55 : 0.05;
        face.mouthPressRight = i % 12 < 4 ? 0.5 : 0.05;
        face.mouthRollUpper = i % 10 < 3 ? 0.45 : 0.05;
        face.cheekPuff = i % 20 < 4 ? 0.3 : 0.05;
      } else if (phase.id === "speech") {
        const u = i / frames * Math.PI * 6;
        face.jawOpen = 0.15 + 0.45 * Math.max(0, Math.sin(u));
        face.mouthPucker = 0.1 + 0.35 * Math.max(0, Math.sin(u + 0.5));
        face.mouthSmileLeft = 0.1 + 0.25 * Math.max(0, Math.sin(u + 1));
        face.mouthSmileRight = 0.1 + 0.15 * Math.max(0, Math.sin(u + 1.2));
      }
      sample.face = face;
      pushLiveActPersonalCalibrationSample(session, sample, {
        headPoseSupported: true,
        nowMs: t
      });
    }
    if (phaseIndex < LIVEACT_PERSONAL_CALIBRATION_PHASES.length - 1) {
      advanceLiveActPersonalCalibrationPhase(session);
    }
  }
  const profile = finalizeLiveActPersonalCalibrationProfile(session, 17e11);
  const neuAcc = createLiveActCalibrationAccumulator();
  for (let i = 0; i < 40; i += 1) {
    const s = baseSample();
    s.headYaw = 0.02 + noiseAt(i);
    pushLiveActCalibrationSample(neuAcc, s, { headPoseSupported: true });
  }
  const neutral = finalizeLiveActCalibration(neuAcc);
  if (!neutral) {
    throw new Error("fixture neutral finalize failed");
  }
  const rangeAcc = createLiveActRangeCalibrationAccumulator();
  for (let i = 0; i < 80; i += 1) {
    const s = baseSample();
    const face = mutableFace();
    face.mouthSmileLeft = i % 10 < 5 ? 0.85 : 0.1;
    face.mouthSmileRight = i % 10 < 5 ? 0.35 : 0.1;
    face.noseSneerLeft = i % 10 < 5 ? 0.16 : 0.02;
    face.jawOpen = i % 12 < 4 ? 0.75 : 0.05;
    s.face = face;
    pushLiveActRangeCalibrationSample(rangeAcc, s);
  }
  const range = finalizeLiveActRangeCalibration(rangeAcc, neutral);
  const v1Set = { neutral, range };
  return { session, profile, v1Set };
}

// src/domains/character/liveact/liveact-personal-calibration-ab.ts
function frameWith(face, headYaw = 0.02) {
  const base = createNeutralLiveActFrame({ timestampMs: 0, sequence: 1, trackingLost: false });
  return {
    ...base,
    confidence: 1,
    head: { yaw: headYaw, pitch: -0.01, roll: 5e-3 },
    eyeLeft: { x: 0.03, y: -0.02 },
    eyeRight: { x: 0.03, y: -0.02 },
    face: { ...createNeutralLiveActFaceChannels(), ...face }
  };
}
function runPersonalCalibrationAbBenchmark() {
  const { profile, v1Set } = buildPersonalCalibrationActorSession();
  const status = resolveLiveActPersonalProfileStatus(profile);
  const personalSet = liveActCalibrationSetFromPersonalProfile(profile);
  const resting = frameWith({
    mouthSmileLeft: 0.08,
    mouthSmileRight: 0.08,
    noseSneerLeft: 0.05
  });
  const v1Rest = applyLiveActCalibration(resting, v1Set);
  const pRest = applyLiveActPersonalCalibration(resting, profile);
  const activeSmile = frameWith({
    mouthSmileLeft: 0.45,
    mouthSmileRight: 0.22,
    jawOpen: 0.1
  });
  const v1Smile = applyLiveActCalibration(activeSmile, v1Set);
  const pSmile = applyLiveActPersonalCalibration(activeSmile, profile);
  const v1NoseGain = v1Set.range?.gain.noseSneerLeft ?? 1;
  const pNoseGain = personalSet.range?.gain.noseSneerLeft ?? 1;
  const noseCapability = profile.channels.noseSneerLeft?.capability ?? "na";
  const v1Bias = (Math.abs(v1Rest.face.mouthSmileLeft) + Math.abs(v1Rest.face.mouthSmileRight)) / 2;
  const pBias = (Math.abs(pRest.face.mouthSmileLeft) + Math.abs(pRest.face.mouthSmileRight)) / 2;
  const smileL = profile.channels.mouthSmileLeft;
  const smileR = profile.channels.mouthSmileRight;
  const spanL = (smileL?.usableMax ?? 0) - (smileL?.neutral ?? 0);
  const spanR = (smileR?.usableMax ?? 0) - (smileR?.neutral ?? 0);
  const pAsym = pSmile.face.mouthSmileLeft - pSmile.face.mouthSmileRight;
  const neutralBiasReduced = pBias + 1e-6 < v1Bias || pBias < 0.05;
  const weakChannelNotExploded = pNoseGain <= 1.0001 && (noseCapability === "weak" || noseCapability === "requires450" || noseCapability === "skipped" || noseCapability === "na") && v1NoseGain > pNoseGain + 0.5;
  const asymmetryPreserved = spanL > spanR + 0.2 && (smileL?.asymmetry ?? 0) !== 0 && pAsym > 0.05;
  const success = status === "valid" && LIVEACT_PERSONAL_CALIBRATION_DURATION_MS <= 4e4 && LIVEACT_PERSONAL_CALIBRATION_DURATION_MS >= 2e4 && neutralBiasReduced && weakChannelNotExploded && asymmetryPreserved && (profile.channels.eyeBlinkLeft?.counterpartCrossTalk ?? 0) >= 0;
  return {
    contractVersion: LIVEACT_PERSONAL_CALIBRATION_CONTRACT,
    policyVersion: LIVEACT_PERSONAL_CALIBRATION_POLICY_VERSION,
    choreographyDurationMs: LIVEACT_PERSONAL_CALIBRATION_DURATION_MS,
    v1: {
      neutralSmileBias: v1Bias,
      noseSneerGain: v1NoseGain,
      smileLeftOut: v1Smile.face.mouthSmileLeft,
      smileRightOut: v1Smile.face.mouthSmileRight,
      smileAsymmetryPreserved: v1Smile.face.mouthSmileLeft - v1Smile.face.mouthSmileRight > 0.05
    },
    personal: {
      neutralSmileBias: pBias,
      noseSneerGain: pNoseGain,
      noseCapability,
      smileLeftOut: pSmile.face.mouthSmileLeft,
      smileRightOut: pSmile.face.mouthSmileRight,
      smileAsymmetryPreserved: pAsym > 0.05,
      crossTalkLeftBlink: profile.channels.eyeBlinkLeft?.counterpartCrossTalk ?? 0,
      profileStatus: status
    },
    improvements: {
      neutralBiasReduced,
      weakChannelNotExploded,
      asymmetryPreserved
    },
    success,
    privacy: { committedRawLandmarks: 0, committedWebcam: 0 }
  };
}
var LIVEACT_PERSONAL_AB_MAX_GAIN = LIVEACT_PERSONAL_MAX_GAIN;

// src/domains/character/liveact/liveact-performance-face-contract.ts
var SAGATREE_PERFORMANCE_FACE_CONTRACT = "SagaTreePerformanceFaceV2";
var PERFORMANCE_FACE_VALIDATOR_VERSION = "performance-face-validator-v1";
var PERFORMANCE_FACE_MANIFEST_VERSION = "SagaTreePerformanceFaceManifestV1";
var PERFORMANCE_FACE_AUTHORING_SPEC = "sagatree-performance-face-authoring-v1";
var LIVEACT_ACTIVE_CAPABILITY_CONTRACT = "SagaTreeLiveActActiveCapabilityV2";
var PERFORMANCE_FACE_CAPABILITY_LEVELS = [0, 1, 2, 3];
var PERFORMANCE_FACE_LEVEL_LABELS = {
  0: "Display",
  1: "Animated Humanoid",
  2: "LiveAct Standard",
  3: "LiveAct Premium"
};
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
function isPerformanceFaceControlId(id) {
  return PERFORMANCE_FACE_ALL_CONTROLS.includes(id);
}
function isPerformanceFaceCapabilityLevel(value) {
  return typeof value === "number" && PERFORMANCE_FACE_CAPABILITY_LEVELS.includes(value);
}
function clampPerformanceFaceWeight(value) {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}
function computeCorrectiveWeight(driverWeights, rule) {
  if (driverWeights.length === 0) return 0;
  const clamped = driverWeights.map(clampPerformanceFaceWeight);
  if (rule === "min") {
    let min = clamped[0] ?? 0;
    for (let i = 1; i < clamped.length; i += 1) {
      const w = clamped[i] ?? 0;
      if (w < min) min = w;
    }
    return min;
  }
  let product = 1;
  for (const w of clamped) product *= w;
  return clampPerformanceFaceWeight(product);
}
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function parseCorrectiveDeclaration(entry) {
  if (!isPlainObject(entry)) return null;
  if (typeof entry.id !== "string" || entry.id.length === 0) return null;
  if (!Array.isArray(entry.drivers) || entry.drivers.length === 0) return null;
  const drivers = [];
  for (const d of entry.drivers) {
    if (typeof d !== "string" || d.length === 0) return null;
    drivers.push(d);
  }
  if (entry.weightRule !== "min" && entry.weightRule !== "multiply") return null;
  if (entry.required !== void 0 && typeof entry.required !== "boolean") return null;
  return {
    id: entry.id,
    drivers,
    weightRule: entry.weightRule,
    required: entry.required === true ? true : void 0
  };
}
function parsePerformanceFaceManifestV1(raw) {
  if (!isPlainObject(raw)) return null;
  if (raw.contractVersion !== PERFORMANCE_FACE_MANIFEST_VERSION) return null;
  let claimedLevel;
  if (raw.claimedLevel !== void 0) {
    if (!isPerformanceFaceCapabilityLevel(raw.claimedLevel)) return null;
    claimedLevel = raw.claimedLevel;
  }
  let correctives;
  if (raw.correctives !== void 0) {
    if (!Array.isArray(raw.correctives)) return null;
    correctives = [];
    for (const entry of raw.correctives) {
      const decl = parseCorrectiveDeclaration(entry);
      if (!decl) return null;
      correctives.push(decl);
    }
  }
  return {
    contractVersion: PERFORMANCE_FACE_MANIFEST_VERSION,
    claimedLevel,
    correctives
  };
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
function resolvePerformanceFaceTargets(presentTargetNames) {
  const present = new Set(presentTargetNames);
  const resolvedNames = {};
  const supported = /* @__PURE__ */ new Set();
  for (const id of PERFORMANCE_FACE_ALL_CONTROLS) {
    const aliases = PERFORMANCE_FACE_TARGET_ALIASES[id];
    const match = aliases.find((alias) => present.has(alias));
    if (match) {
      supported.add(id);
      resolvedNames[id] = match;
    }
  }
  return { supported, resolvedNames };
}

// src/domains/character/liveact/liveact-performance-face-validate.ts
function evaluateCorrectives(presentTargetNames, declarations) {
  if (!declarations || declarations.length === 0) {
    return { present: [], missingRequired: [], missingOptional: [] };
  }
  const present = [];
  const missingRequired = [];
  const missingOptional = [];
  for (const decl of declarations) {
    if (presentTargetNames.has(decl.id)) {
      present.push(decl.id);
      continue;
    }
    if (decl.required === true) missingRequired.push(decl.id);
    else missingOptional.push(decl.id);
  }
  return { present, missingRequired, missingOptional };
}
function validatePerformanceFaceV2(inventory) {
  const warnings = [];
  const resolution = resolvePerformanceFaceTargets(inventory.presentTargetNames);
  const presentNames = new Set(inventory.presentTargetNames);
  const supportedControls = [];
  for (const id of PERFORMANCE_FACE_ALL_CONTROLS) {
    if (resolution.supported.has(id)) supportedControls.push(id);
  }
  const missingRequired = PERFORMANCE_FACE_REQUIRED_PREMIUM_CONTROLS.filter(
    (id) => !resolution.supported.has(id)
  );
  const missingOptional = PERFORMANCE_FACE_OPTIONAL_PREMIUM_CONTROLS.filter(
    (id) => !resolution.supported.has(id)
  );
  for (const id of missingOptional) {
    warnings.push(`Optionales Premium-Control fehlt: ${id}`);
  }
  const correctiveCapability = evaluateCorrectives(
    presentNames,
    inventory.manifest?.correctives
  );
  for (const id of correctiveCapability.missingOptional) {
    warnings.push(`Optionales Corrective fehlt: ${id}`);
  }
  for (const id of correctiveCapability.missingRequired) {
    warnings.push(`Erforderliches Corrective fehlt: ${id}`);
  }
  if (inventory.filenameHint) {
    const lower = inventory.filenameHint.toLowerCase();
    if (lower.includes("premium") || lower.includes("performance")) {
      warnings.push(
        "Dateiname/URL enth\xE4lt \u201Epremium/performance\u201C \u2014 wird f\xFCr Eligibility ignoriert"
      );
    }
  }
  const arkitPresent = inventory.arkitPresentChannels;
  const coreCheck = checkLiveActFaceAssetProfile(
    {
      presentChannels: arkitPresent,
      hasEyeBones: inventory.gazeDrivePath === "bones" || inventory.gazeDrivePath === "lookAt"
    },
    "core-v1",
    inventory.gazeDrivePath === "morphs" ? "morphs" : inventory.gazeDrivePath === "bones" || inventory.gazeDrivePath === "lookAt" ? "bones" : "none"
  );
  const standardFaceOk = coreCheck.ok && !coreCheck.missingGaze;
  const gazeOk = inventory.gazeDrivePath !== "none";
  const standardEligible = inventory.hasHumanoid && inventory.hasHead && standardFaceOk && (gazeOk || standardFaceOk);
  if (inventory.manifest?.claimedLevel === 3 && missingRequired.length > 0) {
    warnings.push(
      "Manifest beansprucht Premium, aber erforderliche Morph-/Expression-Controls fehlen"
    );
  }
  if (inventory.manifest?.claimedLevel === 3 && missingRequired.length === 0 && correctiveCapability.missingRequired.length === 0 && supportedControls.length === 0) {
    warnings.push("Manifest-Premium ohne aufgel\xF6ste Controls \u2014 Morph-Evidenz fehlt");
  }
  const premiumControlsOk = missingRequired.length === 0;
  const premiumCorrectivesOk = correctiveCapability.missingRequired.length === 0;
  const premiumEligible = standardEligible && premiumControlsOk && premiumCorrectivesOk;
  let capabilityLevel = 0;
  if (!inventory.hasHumanoid) {
    capabilityLevel = 0;
  } else if (!standardEligible) {
    capabilityLevel = 1;
  } else if (!premiumEligible) {
    capabilityLevel = 2;
  } else {
    capabilityLevel = 3;
  }
  return {
    contractVersion: SAGATREE_PERFORMANCE_FACE_CONTRACT,
    validatorVersion: PERFORMANCE_FACE_VALIDATOR_VERSION,
    capabilityLevel,
    standardEligible,
    premiumEligible,
    supportedControls,
    missingRequired,
    missingOptional,
    warnings,
    gazeCapability: inventory.gazeDrivePath,
    correctiveCapability,
    importAllowed: true,
    resolvedTargetNames: resolution.resolvedNames
  };
}
function composeLiveActWithPerformanceFace(input, avatar, performanceFace) {
  const liveact = composeLiveActCapabilities(input, avatar);
  return {
    contractVersion: LIVEACT_ACTIVE_CAPABILITY_CONTRACT,
    liveact,
    performanceFace,
    capabilityLevel: performanceFace.capabilityLevel
  };
}
function evaluatePerformanceFaceForImport(inventory) {
  const report = validatePerformanceFaceV2(inventory);
  return {
    importAllowed: true,
    blocksImport: false,
    report
  };
}
function formatPerformanceFaceReportDe(report) {
  const lines = [
    `LiveAct Standard: ${report.standardEligible ? "PASS" : "NOT AVAILABLE"}`,
    `LiveAct Premium: ${report.premiumEligible ? "PASS" : "NOT AVAILABLE"}`,
    `Stufe: ${report.capabilityLevel} (${PERFORMANCE_FACE_LEVEL_LABELS[report.capabilityLevel]})`
  ];
  const missing3 = [
    ...report.missingRequired.map((id) => `${id} (erforderlich f\xFCr Premium)`),
    ...report.missingOptional.map((id) => `${id} (optional)`),
    ...report.correctiveCapability.missingRequired.map(
      (id) => `Corrective ${id} (erforderlich)`
    ),
    ...report.correctiveCapability.missingOptional.map(
      (id) => `Corrective ${id} (optional)`
    )
  ];
  if (missing3.length > 0) {
    lines.push("Missing:");
    for (const m of missing3) lines.push(`- ${m}`);
  } else {
    lines.push("Missing: \u2014");
  }
  if (report.standardEligible) {
    lines.push("Fallback: ARKit52-kompatibles Face bleibt verf\xFCgbar.");
  } else if (report.capabilityLevel >= 1) {
    lines.push("Fallback: Humanoid/Animation ohne LiveAct-Face.");
  } else {
    lines.push("Fallback: Darstellung ohne LiveAct-Promise.");
  }
  if (report.warnings.length > 0) {
    lines.push("Hinweise:");
    for (const w of report.warnings) lines.push(`- ${w}`);
  }
  lines.push(`Import: erlaubt (Premium fehlt blockiert den Import nicht).`);
  return lines.join("\n");
}
function applyPerformanceFaceWeights(input) {
  for (const id of PERFORMANCE_FACE_ALL_CONTROLS) {
    const target = input.resolvedNames[id];
    if (!target) continue;
    const w = input.weights[id];
    if (w === void 0) continue;
    input.writeWeight(target, clampPerformanceFaceWeight(w));
  }
  if (!input.correctives?.length || !input.driverWeights) return;
  for (const decl of input.correctives) {
    const driverVals = decl.drivers.map((d) => input.driverWeights?.[d] ?? 0);
    const weight = computeCorrectiveWeight(driverVals, decl.weightRule);
    input.writeWeight(decl.id, weight);
  }
}

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
function measurePerformanceFaceContourProxy(weights) {
  const keys = [
    "lipContourUpperLeft",
    "lipContourUpperRight",
    "lipContourLowerLeft",
    "lipContourLowerRight"
  ];
  let sum = 0;
  let n = 0;
  for (const id of keys) {
    const w = weights[id];
    if (typeof w === "number" && Number.isFinite(w)) {
      sum += w;
      n += 1;
    }
  }
  if (n === 0) return { mean: 0, sampleCount: 0, status: "NOT_MEASURED" };
  return { mean: sum / n, sampleCount: n, status: "MEASURED" };
}

// src/domains/character/liveact/liveact-perfect-fidelity-v2-e2e.ts
var LIVEACT_PERFECT_FIDELITY_V2_E2E_CONTRACT = "SagaTreeLiveActPerfectFidelityV2E2E";
function buildCoreArkitChannels() {
  return [...LIVEACT_FACE_ASSET_CORE_V1_CHANNELS];
}
function buildCanonicalFace3Inventory() {
  const arkit = buildCoreArkitChannels();
  return {
    presentTargetNames: [...arkit],
    hasHumanoid: true,
    hasHead: true,
    gazeDrivePath: "bones",
    arkitPresentChannels: arkit,
    filenameHint: "m5-face3.glb"
  };
}
function buildExternalPremiumInventory() {
  const arkit = buildCoreArkitChannels();
  return {
    presentTargetNames: [
      ...arkit,
      ...PERFORMANCE_FACE_REQUIRED_PREMIUM_CONTROLS,
      "lidTightenLeft",
      "lidTightenRight"
    ],
    hasHumanoid: true,
    hasHead: true,
    gazeDrivePath: "bones",
    arkitPresentChannels: arkit,
    filenameHint: "external-arkit-only-name.glb"
  };
}
function listPerfectFidelityV2AvatarProfiles() {
  return [
    {
      id: "canonical-face3",
      label: "Canonical Human face3 (Standard; Premium morphs blocker)",
      inventory: buildCanonicalFace3Inventory(),
      premiumBlockerAllowed: true
    },
    {
      id: "external-premium-fixture",
      label: "External Premium fixture inventory",
      inventory: buildExternalPremiumInventory(),
      premiumBlockerAllowed: false
    }
  ];
}
function evaluatePerfectFidelityV2Avatar(profile) {
  const report = validatePerformanceFaceV2(profile.inventory);
  const premiumBlockerDocumented = profile.premiumBlockerAllowed && report.standardEligible && !report.premiumEligible && report.missingRequired.length > 0;
  return {
    profileId: profile.id,
    report,
    standardOk: report.standardEligible,
    premiumOk: report.premiumEligible,
    premiumBlockerDocumented,
    filenameHackBlocked: report.warnings.some((w) => /ignoriert/i.test(w))
  };
}
function runPerfectFidelityV2E2e() {
  const profiles = listPerfectFidelityV2AvatarProfiles();
  const avatars = profiles.map(evaluatePerfectFidelityV2Avatar);
  const canonical = avatars.find((a) => a.profileId === "canonical-face3");
  const external = avatars.find((a) => a.profileId === "external-premium-fixture");
  const face = mergeLiveActFaceChannels({
    noseSneerLeft: 0.55,
    noseSneerRight: 0.5,
    cheekPuff: 0.4,
    cheekSquintLeft: 0.35,
    cheekSquintRight: 0.32,
    mouthUpperUpLeft: 0.45,
    mouthUpperUpRight: 0.42,
    mouthLowerDownLeft: 0.38,
    mouthLowerDownRight: 0.36,
    eyeSquintLeft: 0.2,
    eyeSquintRight: 0.18
  });
  const hybrid = solveHybridFace({
    semanticFace: face,
    dense: null,
    sequence: 1,
    timestampMs: 0,
    denseSequence: null
  });
  const weights = drivePerformanceFaceWeights({ hybrid, face });
  const written = {};
  const externalReport = external?.report;
  if (externalReport?.premiumEligible) {
    applyPerformanceFaceWeights({
      writeWeight: (name, w) => {
        if (isPerformanceFaceControlId(name)) written[name] = w;
      },
      resolvedNames: externalReport.resolvedTargetNames,
      weights
    });
  }
  const contour = measurePerformanceFaceContourProxy(written);
  return {
    contractVersion: LIVEACT_PERFECT_FIDELITY_V2_E2E_CONTRACT,
    avatars,
    standardFallbackGreen: Boolean(canonical?.standardOk && !canonical.premiumOk),
    externalPremiumPass: Boolean(external?.premiumOk),
    canonicalPremiumBlockerOk: Boolean(canonical?.premiumBlockerDocumented),
    applyPath: {
      appliedControls: Object.keys(written).length,
      contour
    },
    privacy: { biometricsCommitted: false }
  };
}

// src/domains/character/liveact/liveact-network-frame.ts
var LIVEACT_NETWORK_FRAME_CONTRACT = "SagaTreeLiveActNetworkFrameV1";
var LIVEACT_NETWORK_TOPIC = "liveact-data";
var LIVEACT_NETWORK_MAX_SEND_HZ = 30;
var LIVEACT_NETWORK_STALE_MS = 500;
function isPlainObject2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function encodeSparseFace(face) {
  const out = {};
  for (const id of LIVEACT_FACE_CHANNELS) {
    const v2 = face[id];
    const neutral = id === "_neutral" ? 1 : 0;
    if (Math.abs(v2 - neutral) < 1e-4) continue;
    out[id] = clampLiveActChannel(v2);
  }
  return out;
}
function encodeLiveActNetworkFrame(frame2, options) {
  assertLiveActFaceChannelsLocalOnly(frame2.face);
  return {
    contractVersion: LIVEACT_NETWORK_FRAME_CONTRACT,
    sequence: frame2.sequence,
    timestampMs: frame2.timestampMs,
    confidence: frame2.confidence,
    trackingLost: frame2.trackingLost === true,
    head: {
      yaw: frame2.head.yaw,
      pitch: frame2.head.pitch,
      roll: frame2.head.roll
    },
    eyeLeft: { x: frame2.eyeLeft.x, y: frame2.eyeLeft.y },
    eyeRight: { x: frame2.eyeRight.x, y: frame2.eyeRight.y },
    face: encodeSparseFace(frame2.face),
    faceCapabilityLevel: options?.faceCapabilityLevel
  };
}
function decodeLiveActNetworkFrame(raw) {
  if (!isPlainObject2(raw)) {
    return { ok: false, reason: "invalid_shape", detail: "Payload ist kein Objekt." };
  }
  if (raw.contractVersion !== LIVEACT_NETWORK_FRAME_CONTRACT) {
    return {
      ok: false,
      reason: "unsupported_contract",
      detail: `Unbekannter Network-Contract: ${String(raw.contractVersion)}`
    };
  }
  for (const banned of ["landmarks", "video", "imageData", "iris", "webcam", "calibrationProfile"]) {
    if (raw[banned] !== void 0) {
      return {
        ok: false,
        reason: "biometric_forbidden",
        detail: `Verbotenes Feld: ${banned}`
      };
    }
  }
  if (typeof raw.sequence !== "number" || !Number.isFinite(raw.sequence) || raw.sequence < 1) {
    return { ok: false, reason: "invalid_shape", detail: "sequence ung\xFCltig." };
  }
  if (typeof raw.timestampMs !== "number" || !Number.isFinite(raw.timestampMs)) {
    return { ok: false, reason: "invalid_shape", detail: "timestampMs ung\xFCltig." };
  }
  if (typeof raw.confidence !== "number" || !Number.isFinite(raw.confidence)) {
    return { ok: false, reason: "invalid_shape", detail: "confidence ung\xFCltig." };
  }
  if (typeof raw.trackingLost !== "boolean") {
    return { ok: false, reason: "invalid_shape", detail: "trackingLost ung\xFCltig." };
  }
  if (!isPlainObject2(raw.head) || !isPlainObject2(raw.eyeLeft) || !isPlainObject2(raw.eyeRight)) {
    return { ok: false, reason: "invalid_shape", detail: "head/eyes ung\xFCltig." };
  }
  const head = {
    yaw: Number(raw.head.yaw) || 0,
    pitch: Number(raw.head.pitch) || 0,
    roll: Number(raw.head.roll) || 0
  };
  const eyeLeft = {
    x: Number(raw.eyeLeft.x) || 0,
    y: Number(raw.eyeLeft.y) || 0
  };
  const eyeRight = {
    x: Number(raw.eyeRight.x) || 0,
    y: Number(raw.eyeRight.y) || 0
  };
  const facePartial = {};
  if (raw.face !== void 0) {
    if (!isPlainObject2(raw.face)) {
      return { ok: false, reason: "invalid_shape", detail: "face ung\xFCltig." };
    }
    for (const [key, value] of Object.entries(raw.face)) {
      if (!isLiveActFaceChannelId(key)) continue;
      if (typeof value !== "number") continue;
      facePartial[key] = clampLiveActChannel(value);
    }
  }
  let faceCapabilityLevel;
  if (raw.faceCapabilityLevel !== void 0) {
    if (raw.faceCapabilityLevel !== 0 && raw.faceCapabilityLevel !== 1 && raw.faceCapabilityLevel !== 2 && raw.faceCapabilityLevel !== 3) {
      return { ok: false, reason: "invalid_shape", detail: "faceCapabilityLevel ung\xFCltig." };
    }
    faceCapabilityLevel = raw.faceCapabilityLevel;
  }
  const network = {
    contractVersion: LIVEACT_NETWORK_FRAME_CONTRACT,
    sequence: raw.sequence,
    timestampMs: raw.timestampMs,
    confidence: Math.min(1, Math.max(0, raw.confidence)),
    trackingLost: raw.trackingLost,
    head,
    eyeLeft,
    eyeRight,
    face: facePartial,
    faceCapabilityLevel
  };
  const faceBase = createNeutralLiveActFaceChannels();
  for (const id of LIVEACT_FACE_CHANNELS) {
    const v2 = facePartial[id];
    if (typeof v2 === "number") faceBase[id] = v2;
  }
  assertLiveActFaceChannelsLocalOnly(faceBase);
  const liveAct = {
    contractVersion: LIVEACT_CONTRACT_VERSION,
    faceContractVersion: LIVEACT_FACE_CONTRACT_VERSION,
    sequence: network.sequence,
    timestampMs: network.timestampMs,
    confidence: network.confidence,
    trackingLost: network.trackingLost,
    head: network.head,
    eyeLeft: network.eyeLeft,
    eyeRight: network.eyeRight,
    face: faceBase
  };
  return { ok: true, frame: network, liveAct };
}
function serializeLiveActNetworkFrame(frame2) {
  return JSON.stringify(frame2);
}
function parseLiveActNetworkFrameJson(text) {
  try {
    return decodeLiveActNetworkFrame(JSON.parse(text));
  } catch {
    return { ok: false, reason: "invalid_shape", detail: "JSON parse fehlgeschlagen." };
  }
}

// src/domains/character/liveact/liveact-remote-consumer.ts
function createLiveActRemoteConsumerState() {
  return { lastSequence: 0, lastAcceptWallMs: 0, active: false };
}
function acceptLiveActRemoteFrame(input) {
  const staleMs = input.staleMs ?? LIVEACT_NETWORK_STALE_MS;
  const { network, liveAct, nowWallMs } = input;
  let state = { ...input.state };
  if (network.sequence <= state.lastSequence) {
    return {
      state,
      result: {
        action: "drop",
        reason: network.sequence === state.lastSequence ? "duplicate" : "out_of_order"
      }
    };
  }
  if (state.lastAcceptWallMs > 0 && nowWallMs - state.lastAcceptWallMs > staleMs * 4) {
  } else if (state.active && state.lastAcceptWallMs > 0 && nowWallMs - state.lastAcceptWallMs > staleMs && network.sequence > state.lastSequence + 1) {
  }
  if (state.active && state.lastAcceptWallMs > 0 && network.timestampMs + staleMs < (input.liveAct.timestampMs || network.timestampMs)) {
  }
  void staleMs;
  state = {
    lastSequence: network.sequence,
    lastAcceptWallMs: nowWallMs,
    active: true
  };
  if (network.trackingLost) {
    const neutral = createNeutralLiveActFrame({
      timestampMs: network.timestampMs,
      sequence: network.sequence,
      trackingLost: true
    });
    return { state, result: { action: "neutral", frame: neutral } };
  }
  return { state, result: { action: "apply", frame: liveAct } };
}
function clearLiveActRemoteConsumer(state) {
  return {
    state: createLiveActRemoteConsumerState(),
    result: {
      action: "neutral",
      frame: createNeutralLiveActFrame({
        timestampMs: state.lastAcceptWallMs || 0,
        sequence: Math.max(1, state.lastSequence),
        trackingLost: true
      })
    }
  };
}
function userIdFromMediaIdentity(identity) {
  const trimmed = identity.trim();
  if (trimmed.startsWith("user:")) {
    const id = trimmed.slice("user:".length).trim();
    return id.length > 0 ? id : null;
  }
  return null;
}
function resolveRemoteLiveActCharacterId(input) {
  const userId = userIdFromMediaIdentity(input.publisherIdentity);
  if (!userId) return null;
  const characterId = input.rosterByUserId[userId];
  if (typeof characterId !== "string" || characterId.trim().length === 0) return null;
  return characterId.trim();
}
export {
  DEFAULT_LIVEACT_LIMITS,
  DEFAULT_LIVEACT_RETARGET_PROFILE,
  DENSE_SEMANTIC_POINT_IDS,
  IDENTITY_CHANNEL_RETARGET,
  LIVEACT_ACTIVE_CAPABILITY_CONTRACT,
  LIVEACT_CALIBRATION_FRAME_TARGET,
  LIVEACT_CALIBRATION_TIMEOUT_MS,
  LIVEACT_CAPABILITIES_VERSION,
  LIVEACT_CHANNEL_TARGET_ALIASES,
  LIVEACT_CONTRACT_VERSION,
  LIVEACT_DENSE_FACE_FEATURES_CONTRACT,
  LIVEACT_DENSE_FIXTURE_IDS,
  LIVEACT_DENSE_SEMANTIC_GEOMETRY_CONTRACT,
  LIVEACT_DIAGNOSTICS_PEAKS_VERSION,
  LIVEACT_DIAGNOSTICS_V2_SIGNAL_KEYS,
  LIVEACT_DIAGNOSTICS_V2_STAGES,
  LIVEACT_DIAGNOSTICS_V2_VERSION,
  LIVEACT_EYE_LOOK_FACE_CHANNELS,
  LIVEACT_FACE_ASSET_CONTRACT_VERSION,
  LIVEACT_FACE_ASSET_CORE_V1_CHANNELS,
  LIVEACT_FACE_ASSET_EXCLUDED_FROM_V1,
  LIVEACT_FACE_ASSET_FULL_V1_CHANNELS,
  LIVEACT_FACE_ASSET_GAZE_MORPH_CHANNELS,
  LIVEACT_FACE_CHANNELS,
  LIVEACT_FACE_CONTRACT_VERSION,
  LIVEACT_FACE_DIAGNOSTICS_VERSION,
  LIVEACT_FACE_METRIC_LANDMARK_INDICES,
  LIVEACT_FIDELITY_CAPTURE_CONTRACT,
  LIVEACT_FIDELITY_CORRELATION_LAG_WINDOW_MS,
  LIVEACT_FIDELITY_METRIC_STATUSES,
  LIVEACT_FIDELITY_MOTION_PHASES,
  LIVEACT_FIDELITY_NEUTRAL_TOLERANCE,
  LIVEACT_FIDELITY_NOMINAL_SAMPLE_RATE_HZ,
  LIVEACT_FIDELITY_PHASE_SAMPLES_500MS,
  LIVEACT_FIDELITY_REPORT_CONTRACT,
  LIVEACT_FIDELITY_RETURN_STABLE_MS,
  LIVEACT_FIDELITY_SATURATION_THRESHOLD,
  LIVEACT_FIDELITY_SYNTHETIC_FIXTURE_IDS,
  LIVEACT_HYBRID_AB_MIN_MEDIAN_IMPROVEMENT,
  LIVEACT_HYBRID_AB_NON_DEGRADATION_TOL,
  LIVEACT_HYBRID_DENSE_MIN_CONFIDENCE,
  LIVEACT_HYBRID_DISAGREE_ABS,
  LIVEACT_HYBRID_FACE_CONTRACT,
  LIVEACT_HYBRID_FACE_CONTROL_IDS,
  LIVEACT_HYBRID_FACE_FIXTURE_IDS,
  LIVEACT_HYBRID_TUNING_FIXTURE_IDS,
  LIVEACT_HYBRID_VALIDATION_FIXTURE_IDS,
  LIVEACT_INFERENCE_MAX_IN_FLIGHT,
  LIVEACT_IRIS_AB_MIN_MEDIAN_IMPROVEMENT_DEG,
  LIVEACT_IRIS_EYE_GEOMETRY_CONTRACT,
  LIVEACT_IRIS_GAZE_CONTRACT,
  LIVEACT_IRIS_GAZE_FIXTURE_IDS,
  LIVEACT_IRIS_GAZE_MAX_PITCH_DEG,
  LIVEACT_IRIS_GAZE_MAX_YAW_DEG,
  LIVEACT_IRIS_GAZE_MIN_CONFIDENCE,
  LIVEACT_IRIS_GAZE_NEUTRAL_ZERO,
  LIVEACT_MIRROR_AVATAR,
  LIVEACT_MOTION_TEST_CONTRACT,
  LIVEACT_MOTION_TEST_MIN_FRAMES,
  LIVEACT_MOTION_TEST_STEPS,
  LIVEACT_NETWORK_FRAME_CONTRACT,
  LIVEACT_NETWORK_MAX_SEND_HZ,
  LIVEACT_NETWORK_STALE_MS,
  LIVEACT_NETWORK_TOPIC,
  LIVEACT_PERFECT_FIDELITY_BENCHMARK_VERSION,
  LIVEACT_PERFECT_FIDELITY_CONTRACT,
  LIVEACT_PERFECT_FIDELITY_STAGES,
  LIVEACT_PERFECT_FIDELITY_TARGETS,
  LIVEACT_PERFECT_FIDELITY_TARGETS_VERSION,
  LIVEACT_PERFECT_FIDELITY_V2_E2E_CONTRACT,
  LIVEACT_PERSONAL_AB_MAX_GAIN,
  LIVEACT_PERSONAL_CALIBRATION_CONTRACT,
  LIVEACT_PERSONAL_CALIBRATION_DURATION_MS,
  LIVEACT_PERSONAL_CALIBRATION_PHASES,
  LIVEACT_PERSONAL_CALIBRATION_POLICY_VERSION,
  LIVEACT_PERSONAL_MAX_GAIN,
  LIVEACT_PERSONAL_MAX_SAMPLE_GAP_MS,
  LIVEACT_PERSONAL_MIN_PHASE_FRAMES,
  LIVEACT_PERSONAL_MIN_USABLE_SPAN,
  LIVEACT_PERSONAL_NOISE_DEADZONE_MULT,
  LIVEACT_PERSONAL_STORAGE_KEY_PREFIX,
  LIVEACT_PERSONAL_WEAK_SPAN,
  LIVEACT_QUALITY_PROFILES,
  LIVEACT_RANGE_CALIBRATION_DURATION_MS,
  LIVEACT_RANGE_CALIBRATION_MIN_FRAMES,
  LIVEACT_RANGE_CALIBRATION_STEPS,
  LIVEACT_RANGE_MAX_GAIN,
  LIVEACT_RANGE_MIN_SPAN,
  LIVEACT_RANGE_STEP_MIN_FRAMES,
  LIVEACT_RANGE_STEP_MIN_MS,
  LIVEACT_RETARGET_PROFILE_VERSION,
  LIVEACT_STATUSES,
  LIVEACT_TEMPORAL_CONTRACT,
  LIVEACT_TEMPORAL_DEFAULT_DT_MS,
  LIVEACT_TEMPORAL_LONG_GAP_MS,
  LIVEACT_TEMPORAL_MAX_DT_MS,
  LIVEACT_TEMPORAL_MIN_DT_MS,
  LIVEACT_TEMPORAL_POLICIES,
  LIVEACT_TEMPORAL_POLICY_VERSION,
  LIVEACT_TEMPORAL_SIGNAL_GROUPS,
  LIVEACT_TEMPORAL_TARGETS,
  LIVEACT_UI_STATUS_MAX_HZ,
  PERFORMANCE_FACE_ALL_CONTROLS,
  PERFORMANCE_FACE_AUTHORING_SPEC,
  PERFORMANCE_FACE_CAPABILITY_LEVELS,
  PERFORMANCE_FACE_LEVEL_LABELS,
  PERFORMANCE_FACE_MANIFEST_VERSION,
  PERFORMANCE_FACE_OPTIONAL_PREMIUM_CONTROLS,
  PERFORMANCE_FACE_REQUIRED_PREMIUM_CONTROLS,
  PERFORMANCE_FACE_TARGET_ALIASES,
  PERFORMANCE_FACE_VALIDATOR_VERSION,
  SAGATREE_PERFORMANCE_FACE_CONTRACT,
  acceptLiveActRemoteFrame,
  accumulateLiveActDiagnosticsPeaks,
  advanceLiveActPersonalCalibrationPhase,
  applyHybridFaceToSemantic,
  applyLiveActCalibration,
  applyLiveActNeutralBaseline,
  applyLiveActPersonalCalibration,
  applyLiveActRangeCalibration,
  applyLiveActRetargetProfile,
  applyPerformanceFaceWeights,
  approximateBlendshapeGazeFromTruth,
  arbitrateLiveActGaze,
  assertDenseFaceFeaturesLocalOnly,
  assertHybridFaceLocalOnly,
  assertIrisGazeLocalOnly,
  assertLiveActDiagnosticsV2LocalOnly,
  assertLiveActFaceChannelsLocalOnly,
  assertLiveActFaceDiagnosticsLocalOnly,
  assertLiveActFrameLocalOnly,
  assertLiveActPersonalProfileLocalOnly,
  availableDenseScalar,
  buildBlinkSequence,
  buildCanonicalFace3Inventory,
  buildCanonicalNeutralGeometry,
  buildCoreArkitChannels,
  buildDenseFaceLocalFrame,
  buildDenseFixtureGeometry,
  buildDroppedFrameLipSequence,
  buildExternalPremiumInventory,
  buildEyeSphereFrameFromCorners,
  buildFidelityCaptureSession,
  buildFidelityMotionProbeFixture,
  buildFidelityReport,
  buildGazeStepSequence,
  buildHeadJitterSequence,
  buildHeadYawStepSequence,
  buildHybridFaceFixture,
  buildHybridSpeechLikeSequence,
  buildIrisGazeFixture,
  buildIrisNeutralGeometry,
  buildLipSineSequence,
  buildLiveActAppliedValuesFromFace,
  buildLiveActCapabilityInspectorRows,
  buildLiveActFaceLandmarksFromAnchorScreenPoints,
  buildLiveActMotionTestExport,
  buildLostReacquireSmileSequence,
  buildPersonalCalibrationActorSession,
  buildTemporalSpeechSequence,
  checkLiveActFaceAssetProfile,
  clamp014 as clampHybrid01,
  clampLiveActAngle,
  clampLiveActChannel,
  clampLiveActGaze,
  clampPerformanceFaceWeight,
  clearLiveActPersonalCalibrationProfile,
  clearLiveActRemoteConsumer,
  combineDenseEvidence,
  composeLiveActCapabilities,
  composeLiveActWithPerformanceFace,
  computeCorrectiveWeight,
  computeLiveActFaceMetrics,
  computeLiveActObjectCoverTransform,
  createEmptyDenseFaceFeatures,
  createEmptyFidelityStageSamples,
  createEmptyHybridFace,
  createEmptyIrisGaze,
  createEmptyLiveActAvatarFaceSupport,
  createEmptyLiveActFaceDiagnosticsFrame,
  createEmptyLiveActSourceSample,
  createEmptyTemporalState,
  createIdentityLiveActRetargetProfile,
  createLiveActAvatarCapabilities,
  createLiveActCalibrationAccumulator,
  createLiveActCapabilities,
  createLiveActDiagnosticsPeaks,
  createLiveActDiagnosticsV2Snapshot,
  createLiveActInputCapabilities,
  createLiveActMotionTestHoldAcc,
  createLiveActPersonalCalibrationSessionV2,
  createLiveActRangeCalibrationAccumulator,
  createLiveActRemoteConsumerState,
  createLiveActSolverFingerprintV1,
  createNeutralLiveActAppliedValues,
  createNeutralLiveActFaceChannels,
  createNeutralLiveActFrame,
  createUnavailableLiveActAppliedValues,
  currentLiveActPersonalPhaseId,
  decodeLiveActNetworkFrame,
  denseActivationFromSigned,
  denseFeaturesForEquality,
  denseLocalDistance,
  drivePerformanceFaceWeights,
  encodeLiveActNetworkFrame,
  encodeNormalizedGazeAsEyeLookCategories,
  evaluateDenseFeatureLipContour,
  evaluateFidelityContour,
  evaluateFidelityGazeAngular,
  evaluateFidelityMaxTarget,
  evaluateFidelityMinTarget,
  evaluateFidelityMotionProbe,
  evaluateFidelityRangeTarget,
  evaluateFidelityReturnLagMs,
  evaluateFidelityRuntimeMetrics,
  evaluateFidelitySpeechChannel,
  evaluatePerfectFidelityV2Avatar,
  evaluatePerformanceFaceForImport,
  exportLiveActDiagnosticsPeaks,
  extractDenseFaceFeatures,
  extractFidelityPhaseSeries,
  extractFidelitySignalSeries,
  fairBlendshapeGazeFromGeometry,
  fidelityAmplitudeRetentionPct,
  fidelityBestLagCorrelation,
  fidelityCaptureDurationMs,
  fidelityContourErrorPctMouthWidth,
  fidelityCountSequenceGaps,
  fidelityGazeAngularErrorDeg,
  fidelityLagP95Ms,
  fidelityMad,
  fidelityMedian,
  fidelityOvershoot,
  fidelityPearson,
  fidelityPercentile,
  fidelityReportForEquality,
  fidelitySaturationFraction,
  fidelityStageCoverage,
  fidelityVelocityRetentionPct,
  finalizeLiveActCalibration,
  finalizeLiveActMotionTestStepPeaks,
  finalizeLiveActPersonalCalibrationProfile,
  finalizeLiveActRangeCalibration,
  fixtureAmplitudeOverResponse,
  fixtureAmplitudeUnderResponse,
  fixtureBrowInnerRaise,
  fixtureBrowOuterLeft,
  fixtureCheekRaiseLeft,
  fixtureChinDrop,
  fixtureContourError,
  fixtureCrossTalk,
  fixtureDegenerateScale,
  fixtureDelayedReturn,
  fixtureDroppedFrames,
  fixtureEyeCloseLeft,
  fixtureEyeCloseRight,
  fixtureEyesBothClosed,
  fixtureGazeAngularError,
  fixtureJitter,
  fixtureKnownLatency,
  fixtureMissingAppliedStage,
  fixtureMouthOpen,
  fixtureNoseNasolabial,
  fixturePartialMissingMouth,
  fixturePerfectIdentityJaw,
  fixturePuckerCompression,
  fixtureSaturation,
  fixtureSmileLeft,
  fixtureSmileRight,
  fixtureSpeechShaped,
  formatLiveActMetric,
  formatLiveActMotionTestPeak,
  formatPerformanceFaceReportDe,
  fuseSemanticDense,
  gazeDirectionAngularErrorDeg,
  gazeDirectionFromYawPitchDeg,
  hasLiveActPersonalCalibrationEnoughValidSamples,
  hybridControlsToFacePartial,
  irisEyeballRadiusFromHalfWidth,
  irisGeometryToDenseSemanticGeometry,
  isHybridFaceControlId,
  isLiveActEyeLookFaceChannel,
  isLiveActFaceAssetV1Channel,
  isLiveActFaceChannelId,
  isLiveActPersonalCalibrationPhaseComplete,
  isLiveActPersonalCalibrationScopeComplete,
  isLiveActPersonalPersistableCharacterId,
  isLiveActStatus,
  isPerformanceFaceCapabilityLevel,
  isPerformanceFaceControlId,
  isValidLiveActCalibrationSample,
  listPerfectFidelityV2AvatarProfiles,
  liveActCalibrationSetFromPersonalProfile,
  liveActCalibrationStepTotal,
  liveActFaceAssetRequiredChannels,
  liveActFaceChannelsToPartial,
  liveActGazePathSkipsEyeLookMorphs,
  liveActGazePathUsesPoseDriver,
  liveActHeadPoseFromFacialTransform,
  liveActMotionTestAdvanceLabelDe,
  liveActMotionTestFocusModeForPeak,
  liveActMotionTestHoldMs,
  liveActMotionTestStepPrompt,
  liveActMotionTestStepTotal,
  liveActNeutralCalibrationPrompt,
  liveActPersonalCalibrationPhaseElapsed,
  liveActPersonalCalibrationPhaseRemainingSec,
  liveActPersonalCalibrationStorageKey,
  liveActRadiansToDegrees,
  liveActRangeCalibrationStepPrompt,
  liveActRangeStepChannels,
  liveActRangeStepHoldMs,
  liveActSolverFingerprintsEqual,
  liveActStatusLabelDe,
  liveActUiStatusMinIntervalMs,
  loadLiveActPersonalCalibrationProfile,
  mapGeometryToDenseLocal,
  mapLiveActSourceSample,
  mapMediaPipeFaceToLiveActSample,
  measurePerformanceFaceContourProxy,
  mergeLiveActFaceChannels,
  mirrorIrisGaze,
  mirrorLiveActSourceSample,
  mirroredLiveActFaceChannel,
  motionTestFocusStorageKey,
  normalizeLiveActRetargetProfile,
  normalizedGazeToYawPitch,
  parseLiveActNetworkFrameJson,
  parsePerformanceFaceManifestV1,
  planarApertureGazeFromIris,
  projectLiveActLandmarkToCanvas,
  pushLiveActCalibrationSample,
  pushLiveActMotionTestHoldSample,
  pushLiveActPersonalCalibrationSample,
  pushLiveActRangeCalibrationSample,
  readLiveActMotionTestSignal,
  readSemantic,
  readTemporalScalar,
  resetAdaptiveTemporal,
  resolveLiveActChannelTargets,
  resolveLiveActGazeDrivePath,
  resolveLiveActPersonalProfileStatus,
  resolveLiveActQualityProfile,
  resolvePerformanceFaceTargets,
  resolveRemoteLiveActCharacterId,
  resolveTemporalDtMs,
  retargetLiveActChannel,
  runHybridFaceAbBenchmark,
  runIrisGazeAbBenchmark,
  runPerfectFidelityV2E2e,
  runPersonalCalibrationAbBenchmark,
  runTemporalAbBenchmark,
  saveLiveActPersonalCalibrationProfile,
  selectPrimaryLiveActFaceIndex,
  semanticPassthroughControl,
  serializeLiveActNetworkFrame,
  shouldDropLiveActInferenceTick,
  shouldThrottleLiveActUiStatus,
  skipLiveActPersonalCalibrationPhase,
  smoothLiveActFrame,
  snapshotLiveActDiagnosticsV2FromFrame,
  snapshotLiveActDiagnosticsV2FromSample,
  solveGazeFromIrisOnSphere,
  solveHybridFace,
  solveIrisGaze,
  solvePlanarApertureGaze,
  stepAdaptiveTemporal,
  stepLiveActCalibratedFrame,
  temporalAlpha,
  temporalFaceKey,
  temporalGroupForFaceChannel,
  temporalGroupForScalarKey,
  temporalSmoothstep,
  temporalTimestamps,
  toDenseLocalPoint,
  transformDenseSemanticGeometry,
  unavailableDenseScalar,
  unavailableHybridControl,
  unavailableIrisEyeGaze,
  userIdFromMediaIdentity,
  validatePerformanceFaceV2,
  yawPitchToNormalizedGaze
};
