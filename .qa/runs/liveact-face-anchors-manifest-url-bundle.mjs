// src/infrastructure/character/liveact/face-anchors-manifest-url.ts
function modelStemFromPathname(pathname) {
  const slash = pathname.lastIndexOf("/");
  const file = slash >= 0 ? pathname.slice(slash + 1) : pathname;
  if (!file) return null;
  const stem = file.replace(/\.(glb|vrm|gltf)$/i, "");
  return stem || null;
}
function listFaceAnchorsManifestUrlCandidates(modelUrl) {
  const trimmed = modelUrl.trim();
  if (!trimmed) return [];
  try {
    const base = typeof globalThis !== "undefined" && "location" in globalThis ? globalThis.location.href : "http://localhost/";
    const url = new URL(trimmed, base);
    url.hash = "";
    const cacheBustSearch = url.search;
    const path = url.pathname;
    const slash = path.lastIndexOf("/");
    if (slash < 0) return [];
    const dir = path.slice(0, slash + 1);
    const stem = modelStemFromPathname(path);
    const out = [];
    if (stem) {
      url.pathname = `${dir}${stem}-face-anchors.json`;
      url.search = cacheBustSearch;
      out.push(url.href);
    }
    url.pathname = `${dir}face-anchors.json`;
    url.search = cacheBustSearch;
    out.push(url.href);
    return out;
  } catch {
    return [];
  }
}
function resolveFaceAnchorsManifestUrlFromModelUrl(modelUrl) {
  const candidates = listFaceAnchorsManifestUrlCandidates(modelUrl);
  return candidates[0] ?? null;
}
export {
  listFaceAnchorsManifestUrlCandidates,
  resolveFaceAnchorsManifestUrlFromModelUrl
};
