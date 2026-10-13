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
export {
  LIVEACT_EYE_LOOK_FACE_CHANNELS,
  isLiveActEyeLookFaceChannel,
  liveActGazePathSkipsEyeLookMorphs,
  liveActGazePathUsesPoseDriver,
  resolveLiveActGazeDrivePath
};
