// src/infrastructure/character/avatar/face-anchor-runtime.ts
import * as THREE from "three";

// src/domains/character/avatar/face-anchor-contract.ts
var BARYCENTRIC_EPS = 1e-4;
var BARYCENTRIC_SUM_EPS = 1e-3;
function validateFaceAnchorBarycentric(barycentric) {
  const { u, v, w } = barycentric;
  if (!Number.isFinite(u) || !Number.isFinite(v) || !Number.isFinite(w)) {
    return { code: "invalid_barycentric", detail: "Barycentric components must be finite numbers." };
  }
  if (u < -BARYCENTRIC_EPS || v < -BARYCENTRIC_EPS || w < -BARYCENTRIC_EPS) {
    return { code: "invalid_barycentric", detail: "Barycentric weights must be non-negative." };
  }
  const sum = u + v + w;
  if (Math.abs(sum - 1) > BARYCENTRIC_SUM_EPS) {
    return {
      code: "invalid_barycentric",
      detail: `Barycentric weights must sum to 1 (got ${sum}).`
    };
  }
  return null;
}
function validateFaceAnchorTriangleBinding(binding, anchorId) {
  const issues = [];
  const nodeIdentity = binding.nodeIdentity.trim();
  if (!nodeIdentity) {
    issues.push({
      code: "invalid_node_identity",
      anchorId,
      detail: "nodeIdentity must be a non-empty stable node id."
    });
  }
  if (!Number.isInteger(binding.primitiveIndex) || binding.primitiveIndex < 0) {
    issues.push({
      code: "invalid_primitive_index",
      anchorId,
      detail: "primitiveIndex must be a non-negative integer."
    });
  }
  if (!Number.isInteger(binding.triangleIndex) || binding.triangleIndex < 0) {
    issues.push({
      code: "invalid_triangle_index",
      anchorId,
      detail: "triangleIndex must be a non-negative integer."
    });
  }
  const baryIssue = validateFaceAnchorBarycentric(binding.barycentric);
  if (baryIssue) {
    issues.push({ ...baryIssue, anchorId });
  }
  return { ok: issues.length === 0, issues };
}

// src/infrastructure/character/avatar/face-anchor-runtime.ts
var _vertex = new THREE.Vector3();
var _vertexB = new THREE.Vector3();
var _vertexC = new THREE.Vector3();
var _morphDelta = new THREE.Vector3();
var _world = new THREE.Vector3();
function buildFaceAnchorNodeIndex(root) {
  const map = /* @__PURE__ */ new Map();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const name = object.name.trim();
    if (!name || map.has(name)) return;
    map.set(name, object);
  });
  return map;
}
function resolvePrimitiveRange(geometry, primitiveIndex) {
  const groups = geometry.groups;
  if (groups && groups.length > 0) {
    if (primitiveIndex < 0 || primitiveIndex >= groups.length) return null;
    const group = groups[primitiveIndex];
    const triangleCount = Math.floor(group.count / 3);
    return {
      triangleCount,
      indexOffset: group.start,
      nonIndexedVertexOffset: group.start
    };
  }
  if (primitiveIndex !== 0) return null;
  const index = geometry.index;
  if (index) {
    return { triangleCount: Math.floor(index.count / 3), indexOffset: 0, nonIndexedVertexOffset: 0 };
  }
  const position = geometry.getAttribute("position");
  if (!position) return null;
  return {
    triangleCount: Math.floor(position.count / 3),
    indexOffset: 0,
    nonIndexedVertexOffset: 0
  };
}
function triangleVertexIndices(geometry, primitiveIndex, triangleIndex) {
  const range = resolvePrimitiveRange(geometry, primitiveIndex);
  if (!range || triangleIndex < 0 || triangleIndex >= range.triangleCount) return null;
  const index = geometry.index;
  if (index) {
    const base2 = range.indexOffset + triangleIndex * 3;
    if (base2 + 2 >= index.count) return null;
    return [index.getX(base2), index.getX(base2 + 1), index.getX(base2 + 2)];
  }
  const position = geometry.getAttribute("position");
  if (!position) return null;
  const base = range.nonIndexedVertexOffset + triangleIndex * 3;
  if (base + 2 >= position.count) return null;
  return [base, base + 1, base + 2];
}
function readDeformedVertex(mesh, vertexIndex, target) {
  const geometry = mesh.geometry;
  const position = geometry.getAttribute("position");
  if (!position || vertexIndex < 0 || vertexIndex >= position.count) {
    target.set(0, 0, 0);
    return;
  }
  target.fromBufferAttribute(position, vertexIndex);
  const morphPositions = geometry.morphAttributes.position;
  const influences = mesh.morphTargetInfluences;
  if (morphPositions?.length && influences?.length) {
    for (let i = 0; i < morphPositions.length; i += 1) {
      const weight = influences[i] ?? 0;
      if (weight === 0) continue;
      const morphAttr = morphPositions[i];
      if (!morphAttr) continue;
      _morphDelta.fromBufferAttribute(morphAttr, vertexIndex);
      target.addScaledVector(_morphDelta, weight);
    }
  }
  if (mesh instanceof THREE.SkinnedMesh) {
    mesh.applyBoneTransform(vertexIndex, target);
  }
}
function resolveMeshForBinding(nodeIndex, binding) {
  const node = nodeIndex.get(binding.nodeIdentity.trim());
  if (!node || !(node instanceof THREE.Mesh)) return null;
  return node;
}
function evaluateFaceAnchorWorldPosition(nodeIndex, anchorId, binding, target) {
  const validated = validateFaceAnchorTriangleBinding(binding, anchorId);
  if (!validated.ok) {
    return { status: "unavailable", anchorId };
  }
  const mesh = resolveMeshForBinding(nodeIndex, binding);
  if (!mesh) {
    return { status: "unavailable", anchorId };
  }
  const geometry = mesh.geometry;
  if (!geometry) {
    return { status: "unavailable", anchorId };
  }
  const indices = triangleVertexIndices(geometry, binding.primitiveIndex, binding.triangleIndex);
  if (!indices) {
    return { status: "unavailable", anchorId };
  }
  readDeformedVertex(mesh, indices[0], _vertex);
  readDeformedVertex(mesh, indices[1], _vertexB);
  readDeformedVertex(mesh, indices[2], _vertexC);
  const { u, v, w } = binding.barycentric;
  _world.copy(_vertex).multiplyScalar(u);
  _world.addScaledVector(_vertexB, v);
  _world.addScaledVector(_vertexC, w);
  mesh.localToWorld(_world);
  const out = target ?? new THREE.Vector3();
  out.copy(_world);
  return {
    status: "available",
    anchorId,
    x: out.x,
    y: out.y,
    z: out.z
  };
}
function evaluateFaceAnchorsManifest(root, manifest) {
  root.updateMatrixWorld(true);
  const nodeIndex = buildFaceAnchorNodeIndex(root);
  const evaluations = {};
  for (const [id, binding] of Object.entries(manifest.anchors)) {
    if (!binding) continue;
    const anchorId = id;
    evaluations[anchorId] = evaluateFaceAnchorWorldPosition(nodeIndex, anchorId, binding);
  }
  return { evaluations };
}
export {
  buildFaceAnchorNodeIndex,
  evaluateFaceAnchorWorldPosition,
  evaluateFaceAnchorsManifest
};
