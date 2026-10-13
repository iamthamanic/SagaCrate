// src/app/character/liveact/face-mapping-gt-mark-copy.ts
function faceMappingGtMarkCopyLabelDe(result) {
  switch (result) {
    case "mark_failed":
      return "Ground Truth konnte nicht markiert werden";
    case "copied":
      return "GT markiert & kopiert";
    case "copy_failed":
      return "GT markiert \xB7 Kopieren fehlgeschlagen";
    default:
      return "Als Ground Truth markieren";
  }
}
async function runFaceMappingGtMarkAndCopy(params) {
  let json;
  try {
    json = params.mark();
  } catch (error) {
    console.warn("[face-mapping] GT mark failed", error);
    return "mark_failed";
  }
  if (!json) return "mark_failed";
  try {
    await params.writeText(json);
    return "copied";
  } catch (error) {
    console.warn("[face-mapping] GT JSON clipboard failed", error);
    return "copy_failed";
  }
}
export {
  faceMappingGtMarkCopyLabelDe,
  runFaceMappingGtMarkAndCopy
};
