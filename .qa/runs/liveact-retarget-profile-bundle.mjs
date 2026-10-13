// src/domains/character/liveact/liveact-face-contract.ts
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
export {
  DEFAULT_LIVEACT_RETARGET_PROFILE,
  IDENTITY_CHANNEL_RETARGET,
  LIVEACT_RETARGET_PROFILE_VERSION,
  applyLiveActRetargetProfile,
  createIdentityLiveActRetargetProfile,
  normalizeLiveActRetargetProfile,
  retargetLiveActChannel
};
