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
    const v = sample.face[id];
    out[faceKey(id)] = typeof v === "number" ? v : null;
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
export {
  LIVEACT_DIAGNOSTICS_V2_SIGNAL_KEYS,
  LIVEACT_DIAGNOSTICS_V2_STAGES,
  LIVEACT_DIAGNOSTICS_V2_VERSION,
  assertLiveActDiagnosticsV2LocalOnly,
  buildLiveActAppliedValuesFromFace,
  createLiveActDiagnosticsV2Snapshot,
  createNeutralLiveActAppliedValues,
  createUnavailableLiveActAppliedValues,
  liveActFaceChannelsToPartial,
  snapshotLiveActDiagnosticsV2FromFrame,
  snapshotLiveActDiagnosticsV2FromSample
};
