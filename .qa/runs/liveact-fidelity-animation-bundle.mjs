// src/infrastructure/character/avatar/avatar-animation-runtime.ts
import * as THREE from "three";

// src/domains/character/avatar/rig-contract.ts
var RIG_CONTRACT_VERSION = "SagaTreeHumanoidRigV1";

// src/domains/character/avatar/animation-contract.ts
var ANIMATION_CONTRACT_VERSION = "SagaTreeAvatarAnimationV1";
var AVATAR_ANIMATION_ACTIONS = ["idle", "walk", "combat", "emote"];
var AVATAR_ANIMATION_CATALOG = [
  {
    actionId: "idle",
    clipId: "sagatree-preview-idle-v1",
    labelDe: "Idle",
    requiredBones: ["hips", "spine", "chest", "neck", "head"],
    attachmentAnchor: "hips",
    loop: true
  },
  {
    actionId: "walk",
    clipId: "sagatree-preview-walk-v1",
    labelDe: "Walk",
    requiredBones: [
      "hips",
      "leftUpperLeg",
      "leftLowerLeg",
      "leftFoot",
      "rightUpperLeg",
      "rightLowerLeg",
      "rightFoot"
    ],
    attachmentAnchor: "hips",
    loop: true
  },
  {
    actionId: "combat",
    clipId: "sagatree-preview-combat-v1",
    labelDe: "Combat",
    requiredBones: [
      "hips",
      "spine",
      "chest",
      "leftUpperArm",
      "leftLowerArm",
      "leftHand",
      "rightUpperArm",
      "rightLowerArm",
      "rightHand"
    ],
    attachmentAnchor: "rightHand",
    loop: true
  },
  {
    actionId: "emote",
    clipId: "sagatree-preview-emote-wave-v1",
    labelDe: "Emote",
    requiredBones: ["spine", "chest", "rightUpperArm", "rightLowerArm", "rightHand"],
    attachmentAnchor: "rightHand",
    loop: false
  }
];
function getAnimationCatalogEntry(actionId) {
  return AVATAR_ANIMATION_CATALOG.find((entry) => entry.actionId === actionId);
}
function isAllowlistedAnimationClipId(clipId) {
  return AVATAR_ANIMATION_CATALOG.some((entry) => entry.clipId === clipId);
}
function resolveAvatarAnimationSupport(input) {
  const unsupportedReasons = {};
  const supported = [];
  if (!input.capabilityFlags.includes("rigged")) {
    for (const actionId of AVATAR_ANIMATION_ACTIONS) {
      unsupportedReasons[actionId] = "Kein Skelett \u2014 Animationen nicht verf\xFCgbar.";
    }
    return {
      contractVersion: ANIMATION_CONTRACT_VERSION,
      rigContractVersion: RIG_CONTRACT_VERSION,
      supported,
      unsupportedReasons,
      defaultAction: null
    };
  }
  for (const entry of AVATAR_ANIMATION_CATALOG) {
    const missing = entry.requiredBones.filter((bone) => !input.mappedBones[bone]);
    if (missing.length > 0) {
      unsupportedReasons[entry.actionId] = `Teilrig: fehlende Knochen f\xFCr ${entry.labelDe} (${missing.length}).`;
      continue;
    }
    supported.push(entry.actionId);
  }
  const defaultAction = supported.includes("idle") ? "idle" : supported[0] ?? null;
  return {
    contractVersion: ANIMATION_CONTRACT_VERSION,
    rigContractVersion: RIG_CONTRACT_VERSION,
    supported,
    unsupportedReasons,
    defaultAction
  };
}
function resolveAnimationCrossfadeSeconds(prefersReducedMotion) {
  return prefersReducedMotion ? 0 : 0.25;
}

// src/infrastructure/character/avatar/avatar-animation-runtime.ts
function findBoneObject(root, sourceName) {
  if (!sourceName) return void 0;
  let found;
  root.traverse((object) => {
    if (found) return;
    if (object.name === sourceName) found = object;
  });
  return found;
}
function buildProceduralClip(actionId, mappedBones) {
  const entry = getAnimationCatalogEntry(actionId);
  if (!entry || !isAllowlistedAnimationClipId(entry.clipId)) return null;
  const tracks = [];
  const duration = actionId === "emote" ? 1.2 : 1;
  const pushQuatTrack = (boneId, times, values) => {
    const sourceName = mappedBones[boneId];
    if (!sourceName) return;
    tracks.push(new THREE.QuaternionKeyframeTrack(`${sourceName}.quaternion`, times, values));
  };
  const identity = [0, 0, 0, 1];
  const tilt = (axis, radians) => {
    const q = new THREE.Quaternion();
    const v = new THREE.Vector3(
      axis === "x" ? 1 : 0,
      axis === "y" ? 1 : 0,
      axis === "z" ? 1 : 0
    );
    q.setFromAxisAngle(v, radians);
    return [q.x, q.y, q.z, q.w];
  };
  switch (actionId) {
    case "idle": {
      const soft = tilt("x", 0.03);
      pushQuatTrack("spine", [0, 0.5, 1], [...identity, ...soft, ...identity]);
      pushQuatTrack("chest", [0, 0.5, 1], [...identity, ...tilt("x", -0.02), ...identity]);
      pushQuatTrack("head", [0, 0.5, 1], [...identity, ...tilt("y", 0.04), ...identity]);
      break;
    }
    case "walk": {
      const swing = 0.35;
      pushQuatTrack(
        "leftUpperLeg",
        [0, 0.5, 1],
        [...tilt("x", swing), ...tilt("x", -swing), ...tilt("x", swing)]
      );
      pushQuatTrack(
        "rightUpperLeg",
        [0, 0.5, 1],
        [...tilt("x", -swing), ...tilt("x", swing), ...tilt("x", -swing)]
      );
      pushQuatTrack("hips", [0, 0.5, 1], [...identity, ...tilt("y", 0.05), ...identity]);
      break;
    }
    case "combat": {
      pushQuatTrack("rightUpperArm", [0, 0.5, 1], [...tilt("x", -0.8), ...tilt("x", -1.1), ...tilt("x", -0.8)]);
      pushQuatTrack("leftUpperArm", [0, 0.5, 1], [...tilt("x", -0.5), ...tilt("x", -0.4), ...tilt("x", -0.5)]);
      pushQuatTrack("chest", [0, 0.5, 1], [...identity, ...tilt("y", 0.08), ...identity]);
      break;
    }
    case "emote": {
      pushQuatTrack(
        "rightUpperArm",
        [0, 0.4, 0.8, 1.2],
        [...identity, ...tilt("z", -1.2), ...tilt("z", -1.4), ...identity]
      );
      pushQuatTrack(
        "rightLowerArm",
        [0, 0.4, 0.8, 1.2],
        [...identity, ...tilt("x", -0.4), ...tilt("x", -0.2), ...identity]
      );
      break;
    }
    default:
      return null;
  }
  if (tracks.length === 0) return null;
  return new THREE.AnimationClip(entry.clipId, duration, tracks);
}
var AvatarAnimationRuntime = class {
  constructor(onStateChange) {
    this.onStateChange = onStateChange;
  }
  mixer;
  actions = /* @__PURE__ */ new Map();
  activeAction = null;
  attachment;
  attachmentParent;
  root;
  analysis;
  support = resolveAvatarAnimationSupport({
    capabilityFlags: [],
    mappedBones: {}
  });
  prefersReducedMotion = false;
  disposed = false;
  suspended = false;
  resumeAction = null;
  setPrefersReducedMotion(value) {
    this.prefersReducedMotion = value;
  }
  /**
   * While suspended the mixer writes no bones: stopped actions restore the rest pose, so an
   * external driver (LiveAct head) is not overwritten by procedural clips every frame.
   */
  setSuspended(suspended) {
    if (this.suspended === suspended) return;
    this.suspended = suspended;
    if (suspended) {
      this.resumeAction = this.activeAction;
      for (const action of this.actions.values()) {
        action.stop();
      }
      this.activeAction = null;
      this.emit("Animation pausiert \u2014 LiveAct steuert den Charakter.");
      return;
    }
    const remembered = this.resumeAction;
    this.resumeAction = null;
    if (remembered && getAnimationCatalogEntry(remembered)?.loop) {
      this.play(remembered);
    } else {
      this.emit("AnimationRuntime bereit.");
    }
  }
  isSuspended() {
    return this.suspended;
  }
  /**
   * Bind to a loaded avatar root + rig analysis. Disposes prior mixer/actions.
   */
  bind(root, analysis) {
    this.disposeMixer();
    this.root = root;
    this.analysis = analysis;
    this.resumeAction = null;
    this.support = resolveAvatarAnimationSupport({
      capabilityFlags: analysis.capabilities.flags,
      mappedBones: analysis.rig.bones
    });
    this.mixer = new THREE.AnimationMixer(root);
    this.actions.clear();
    this.activeAction = null;
    for (const entry of AVATAR_ANIMATION_CATALOG) {
      if (!this.support.supported.includes(entry.actionId)) continue;
      const clip = buildProceduralClip(entry.actionId, analysis.rig.bones);
      if (!clip) continue;
      const action = this.mixer.clipAction(clip);
      action.setLoop(entry.loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
      if (!entry.loop) action.clampWhenFinished = true;
      this.actions.set(entry.actionId, action);
    }
    this.ensureAttachmentFixture(analysis);
    this.emit("AnimationRuntime bereit.");
  }
  getSupport() {
    return this.support;
  }
  getActiveAction() {
    return this.activeAction;
  }
  play(actionId) {
    if (this.disposed || !this.mixer) return false;
    if (!this.support.supported.includes(actionId)) {
      this.emit(this.support.unsupportedReasons[actionId] ?? "Aktion nicht unterst\xFCtzt.");
      return false;
    }
    const next = this.actions.get(actionId);
    if (!next) {
      this.emit("Clip fehlt im Katalog.");
      return false;
    }
    if (this.suspended) {
      this.resumeAction = actionId;
      this.emit("Animation pausiert, solange LiveAct l\xE4uft.");
      return false;
    }
    const fade = resolveAnimationCrossfadeSeconds(this.prefersReducedMotion);
    const previous = this.activeAction ? this.actions.get(this.activeAction) : void 0;
    if (previous && previous !== next) {
      previous.fadeOut(fade);
    }
    next.reset().fadeIn(fade).play();
    this.activeAction = actionId;
    const entry = getAnimationCatalogEntry(actionId);
    if (entry && this.analysis) {
      this.rebindAttachment(entry.attachmentAnchor);
    }
    this.emit(`Spielt ${entry?.labelDe ?? actionId}.`);
    return true;
  }
  update(delta) {
    if (this.disposed || this.suspended) return;
    this.mixer?.update(delta);
  }
  stopAll() {
    for (const action of this.actions.values()) {
      action.stop();
    }
    this.activeAction = null;
    this.emit("Animation gestoppt.");
  }
  dispose() {
    this.disposed = true;
    this.disposeMixer();
    this.root = void 0;
    this.analysis = void 0;
  }
  disposeMixer() {
    this.stopAll();
    this.detachAttachment();
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer.uncacheRoot(this.mixer.getRoot());
      this.mixer = void 0;
    }
    this.actions.clear();
  }
  ensureAttachmentFixture(analysis) {
    this.detachAttachment();
    if (!this.root) return;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.08, 0.18),
      new THREE.MeshStandardMaterial({ color: "#F59E0B", roughness: 0.45, metalness: 0.2 })
    );
    mesh.name = "SagaTreeAnimationAttachmentFixture";
    this.attachment = mesh;
    const defaultAnchor = getAnimationCatalogEntry(this.support.defaultAction ?? "idle")?.attachmentAnchor ?? "hips";
    this.rebindAttachment(defaultAnchor, analysis);
  }
  rebindAttachment(anchorId, analysis = this.analysis) {
    if (!this.attachment || !this.root || !analysis) return;
    const sourceName = analysis.rig.anchors[anchorId] ?? analysis.rig.bones[anchorId];
    const parent = findBoneObject(this.root, sourceName);
    if (!parent) return;
    if (this.attachmentParent === parent) return;
    this.attachmentParent?.remove(this.attachment);
    parent.add(this.attachment);
    this.attachment.position.set(0.05, 0.02, 0);
    this.attachmentParent = parent;
  }
  detachAttachment() {
    if (this.attachment) {
      this.attachmentParent?.remove(this.attachment);
      this.attachment.geometry.dispose();
      if (Array.isArray(this.attachment.material)) {
        this.attachment.material.forEach((m) => m.dispose());
      } else {
        this.attachment.material.dispose();
      }
    }
    this.attachment = void 0;
    this.attachmentParent = void 0;
  }
  emit(message) {
    this.onStateChange?.({
      support: this.support,
      activeAction: this.activeAction,
      message
    });
  }
};
export {
  AvatarAnimationRuntime
};
