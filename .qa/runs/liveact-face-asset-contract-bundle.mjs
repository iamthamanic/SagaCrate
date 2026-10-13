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
export {
  LIVEACT_FACE_ASSET_CONTRACT_VERSION,
  LIVEACT_FACE_ASSET_CORE_V1_CHANNELS,
  LIVEACT_FACE_ASSET_EXCLUDED_FROM_V1,
  LIVEACT_FACE_ASSET_FULL_V1_CHANNELS,
  LIVEACT_FACE_ASSET_GAZE_MORPH_CHANNELS,
  checkLiveActFaceAssetProfile,
  isLiveActFaceAssetV1Channel,
  liveActFaceAssetRequiredChannels
};
