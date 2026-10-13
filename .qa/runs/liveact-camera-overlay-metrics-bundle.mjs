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
export {
  computeLiveActObjectCoverTransform,
  projectLiveActLandmarkToCanvas
};
