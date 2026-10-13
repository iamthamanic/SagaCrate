// src/infrastructure/character/avatar/face-mapping-base-face-capture-visibility.ts
function beginFaceMappingBaseFaceCaptureVisibility(params) {
  const saved = [];
  const seen = /* @__PURE__ */ new Set();
  const remember = (object) => {
    if (seen.has(object)) return;
    seen.add(object);
    saved.push({ object, visible: object.visible });
  };
  for (const object of params.hide) {
    remember(object);
    object.visible = false;
  }
  for (const object of params.reveal) {
    remember(object);
    object.visible = true;
  }
  return () => {
    for (let i = saved.length - 1; i >= 0; i -= 1) {
      const entry = saved[i];
      if (!entry) continue;
      entry.object.visible = entry.visible;
    }
  };
}
function withFaceMappingBaseFaceCaptureVisibility(params, fn) {
  const restore = beginFaceMappingBaseFaceCaptureVisibility(params);
  try {
    return fn();
  } finally {
    restore();
  }
}
export {
  beginFaceMappingBaseFaceCaptureVisibility,
  withFaceMappingBaseFaceCaptureVisibility
};
