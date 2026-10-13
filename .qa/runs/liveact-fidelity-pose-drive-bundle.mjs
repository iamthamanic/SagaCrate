// src/infrastructure/character/liveact/liveact-pose-drive.ts
import {
  VRMLookAtBoneApplier,
  VRMLookAtExpressionApplier
} from "@pixiv/three-vrm";
var LIVEACT_LOOKAT_FALLBACK_INPUT_MAX_DEG = 30;
function positiveOr(value, fallback) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
function liveActLookAtGazeScaleDeg(applier) {
  const fallback = LIVEACT_LOOKAT_FALLBACK_INPUT_MAX_DEG;
  const inputMax = (map) => positiveOr(map.inputMaxValue, fallback);
  if (applier instanceof VRMLookAtBoneApplier) {
    return {
      horizontal: inputMax(applier.rangeMapHorizontalOuter),
      up: inputMax(applier.rangeMapVerticalDown),
      down: inputMax(applier.rangeMapVerticalUp)
    };
  }
  if (applier instanceof VRMLookAtExpressionApplier) {
    const fullWeightInput = (map) => inputMax(map) * Math.min(1, 1 / positiveOr(map.outputScale, 1));
    return {
      horizontal: fullWeightInput(applier.rangeMapHorizontalOuter),
      up: fullWeightInput(applier.rangeMapVerticalUp),
      down: fullWeightInput(applier.rangeMapVerticalDown)
    };
  }
  return { horizontal: fallback, up: fallback, down: fallback };
}
function applyLiveActHeadRotation(headBone, restQuaternion, head, scratchEuler, scratchQuaternion) {
  if (!headBone) return;
  scratchEuler.set(head.pitch, head.yaw, head.roll, "YXZ");
  scratchQuaternion.setFromEuler(scratchEuler);
  headBone.quaternion.copy(restQuaternion).multiply(scratchQuaternion);
}
function applyLiveActVrmEyeLookAt(vrm, eyeLeft, eyeRight) {
  const lookAt = vrm?.lookAt;
  if (!lookAt) return;
  const x = (eyeLeft.x + eyeRight.x) * 0.5;
  const y = (eyeLeft.y + eyeRight.y) * 0.5;
  const scale = liveActLookAtGazeScaleDeg(lookAt.applier);
  lookAt.yaw = x * scale.horizontal;
  lookAt.pitch = -y * (y >= 0 ? scale.up : scale.down);
}
function applyLiveActEyeBoneGaze(leftEye, rightEye, leftRest, rightRest, eyeLeft, eyeRight, scratchEuler, scratchQuaternion) {
  if (leftEye) {
    scratchEuler.set(eyeLeft.y * 0.35, eyeLeft.x * 0.35, 0, "YXZ");
    scratchQuaternion.setFromEuler(scratchEuler);
    leftEye.quaternion.copy(leftRest).multiply(scratchQuaternion);
  }
  if (rightEye) {
    scratchEuler.set(eyeRight.y * 0.35, eyeRight.x * 0.35, 0, "YXZ");
    scratchQuaternion.setFromEuler(scratchEuler);
    rightEye.quaternion.copy(rightRest).multiply(scratchQuaternion);
  }
}
function resetLiveActHeadRotation(headBone, restQuaternion) {
  if (!headBone) return;
  headBone.quaternion.copy(restQuaternion);
}
function resetLiveActEyeBoneGaze(leftEye, rightEye, leftRest, rightRest) {
  if (leftEye) leftEye.quaternion.copy(leftRest);
  if (rightEye) rightEye.quaternion.copy(rightRest);
}
export {
  applyLiveActEyeBoneGaze,
  applyLiveActHeadRotation,
  applyLiveActVrmEyeLookAt,
  liveActLookAtGazeScaleDeg,
  resetLiveActEyeBoneGaze,
  resetLiveActHeadRotation
};
