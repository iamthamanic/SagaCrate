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

// src/domains/character/liveact/liveact-capabilities.ts
function createEmptyLiveActAvatarFaceSupport() {
  const out = {};
  for (const id of LIVEACT_FACE_CHANNELS) {
    out[id] = false;
  }
  return out;
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
export {
  LIVEACT_CHANNEL_TARGET_ALIASES,
  resolveLiveActChannelTargets
};
