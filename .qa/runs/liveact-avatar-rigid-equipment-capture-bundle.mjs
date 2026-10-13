// src/infrastructure/character/avatar/avatar-rigid-equipment-runtime.ts
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// src/domains/character/avatar/morph-contract.ts
var MORPH_CONTRACT_VERSION = "SagaTreeAvatarMorphV1";
var AVATAR_MORPH_BODY_KEYS = [
  "height",
  "headSize",
  "shoulderWidth",
  "chest",
  "waist",
  "hips",
  "armLength",
  "legLength",
  "build",
  "muscularity"
];
var AVATAR_MORPH_FACE_KEYS = [
  "faceWidth",
  "faceLength",
  "jawWidth",
  "chin",
  "cheekbones",
  "noseWidth",
  "noseLength",
  "eyeSize",
  "eyeSpacing",
  "eyeAngle",
  "mouthWidth",
  "lipFullness",
  "earSize"
];
var BODY_LABELS_DE = {
  height: "K\xF6rpergr\xF6\xDFe",
  headSize: "Kopfgr\xF6\xDFe",
  shoulderWidth: "Schulterbreite",
  chest: "Brust",
  waist: "Taille",
  hips: "H\xFCfte",
  armLength: "Arml\xE4nge",
  legLength: "Beinl\xE4nge",
  build: "Statur",
  muscularity: "Muskulatur"
};
var FACE_LABELS_DE = {
  faceWidth: "Gesichtsbreite",
  faceLength: "Gesichtsl\xE4nge",
  jawWidth: "Kieferbreite",
  chin: "Kinn",
  cheekbones: "Wangenknochen",
  noseWidth: "Nasenbreite",
  noseLength: "Nasenl\xE4nge",
  eyeSize: "Augengr\xF6\xDFe",
  eyeSpacing: "Augenabstand",
  eyeAngle: "Augenwinkel",
  mouthWidth: "Mundbreite",
  lipFullness: "Lippenf\xFClle",
  earSize: "Ohrgr\xF6\xDFe"
};
function buildParamMeta(keys, group, labels) {
  return keys.map((key) => ({
    key,
    group,
    labelDe: labels[key] ?? key,
    min: -1,
    max: 1,
    default: 0,
    step: 0.05
  }));
}
var AVATAR_MORPH_BODY_META = buildParamMeta(
  AVATAR_MORPH_BODY_KEYS,
  "body",
  BODY_LABELS_DE
);
var AVATAR_MORPH_FACE_META = buildParamMeta(
  AVATAR_MORPH_FACE_KEYS,
  "face",
  FACE_LABELS_DE
);
var AVATAR_MORPH_PARAM_META = [
  ...AVATAR_MORPH_BODY_META,
  ...AVATAR_MORPH_FACE_META
];

// src/domains/character/avatar/rig-contract.ts
var RIG_CONTRACT_VERSION = "SagaTreeHumanoidRigV1";

// src/domains/character/avatar/base-body-contract.ts
var BASE_BODY_ASSET_VERSION = "sagatree-base-humanoid-v1.0.0";

// src/domains/character/avatar/fit-range-contract.ts
var FIT_RANGE_CONTRACT_VERSION = "AvatarFitRangeV1";
var PRIMARY_FIT_KEYS = [
  "height",
  "shoulderWidth",
  "chest",
  "waist",
  "hips",
  "build"
];
function createDefaultTraitFitRange(input) {
  return {
    contractVersion: FIT_RANGE_CONTRACT_VERSION,
    assetId: input.assetId,
    socket: input.socket,
    assetVersion: BASE_BODY_ASSET_VERSION,
    rigVersion: RIG_CONTRACT_VERSION,
    morphContractVersion: MORPH_CONTRACT_VERSION,
    bounds: input.bounds ?? PRIMARY_FIT_KEYS.map((key) => ({ key, min: -0.85, max: 0.85 })),
    allowClamp: input.allowClamp === true
  };
}

// src/domains/character/avatar/mtoon-profile.ts
var MTOON_PROFILE_VERSION = "SagaTreeMToonProfileV1";

// src/domains/character/avatar/content-pack-v1.ts
var LICENSE_SAGA = {
  spdx: "CC0-1.0",
  attribution: "SagaTree Content Pack v1",
  provenance: "sagatree-first-party"
};
function socketForGroup(groupId) {
  switch (groupId) {
    case "ears":
      return "ears";
    case "hair":
      return "hair";
    case "clothing":
      return "clothing";
    case "accessory":
      return "cybernetics";
    case "head":
      return "horns";
    default:
      return "clothing";
  }
}
function asset(partial) {
  return {
    ...partial,
    rigVersion: RIG_CONTRACT_VERSION,
    morphContractVersion: MORPH_CONTRACT_VERSION,
    fitRange: createDefaultTraitFitRange({
      assetId: `${partial.groupId}:${partial.id}`,
      socket: socketForGroup(partial.groupId)
    }),
    materialProfile: MTOON_PROFILE_VERSION,
    license: partial.license ?? LICENSE_SAGA,
    thumbnailSeed: `${partial.groupId}:${partial.id}`
  };
}
var FACES = [
  asset({ id: "human-balanced", groupId: "head", category: "face", label: "Mensch ausgewogen", tags: ["human"], setting: "neutral" }),
  asset({ id: "human-soft", groupId: "head", category: "face", label: "Mensch weich", tags: ["human"], setting: "neutral" }),
  asset({ id: "human-angular", groupId: "head", category: "face", label: "Mensch kantig", tags: ["human"], setting: "neutral" }),
  asset({ id: "elf-angular", groupId: "head", category: "face", label: "Elf fein", tags: ["elf"], setting: "fantasy" }),
  asset({ id: "elf-noble", groupId: "head", category: "face", label: "Elf edel", tags: ["elf"], setting: "fantasy" }),
  asset({ id: "dwarf-broad", groupId: "head", category: "face", label: "Zwerg breit", tags: ["dwarf"], setting: "fantasy" }),
  asset({ id: "orc-heavy", groupId: "head", category: "face", label: "Ork massiv", tags: ["orc"], setting: "fantasy" }),
  asset({ id: "halfling-soft", groupId: "head", category: "face", label: "Halbling weich", tags: ["halfling"], setting: "fantasy" }),
  asset({ id: "cyborg-angular", groupId: "head", category: "face", label: "Cyborg", tags: ["cyborg"], setting: "sci-fi" }),
  asset({ id: "cyborg-plated", groupId: "head", category: "face", label: "Cyborg Panzer", tags: ["cyborg"], setting: "sci-fi" }),
  asset({ id: "alien-oval", groupId: "head", category: "face", label: "Alien oval", tags: ["alien"], setting: "sci-fi" }),
  asset({ id: "alien-ridge", groupId: "head", category: "face", label: "Alien Kamm", tags: ["alien"], setting: "sci-fi" }),
  asset({ id: "neutral-soft", groupId: "head", category: "face", label: "Neutral weich", tags: ["neutral"], setting: "neutral" })
];
var HAIR = [
  asset({ id: "short", groupId: "hair", category: "hair", label: "Kurz", tags: ["basic"], setting: "neutral" }),
  asset({ id: "long", groupId: "hair", category: "hair", label: "Lang", tags: ["basic"], setting: "neutral" }),
  asset({ id: "bald", groupId: "hair", category: "hair", label: "Kahl", tags: ["basic"], setting: "neutral" }),
  asset({ id: "braided", groupId: "hair", category: "hair", label: "Geflochten", tags: ["fantasy"], setting: "fantasy" }),
  asset({ id: "wild", groupId: "hair", category: "hair", label: "Wild", tags: ["fantasy"], setting: "fantasy" }),
  asset({ id: "topknot", groupId: "hair", category: "hair", label: "Topknot", tags: ["fantasy"], setting: "fantasy" }),
  asset({ id: "silver-cascade", groupId: "hair", category: "hair", label: "Silberkaskade", tags: ["elf", "fantasy"], setting: "fantasy" }),
  asset({ id: "warrior-mohawk", groupId: "hair", category: "hair", label: "Kriegs-Iro", tags: ["orc", "fantasy"], setting: "fantasy" }),
  asset({ id: "dwarf-braids", groupId: "hair", category: "hair", label: "Zwergenz\xF6pfe", tags: ["dwarf"], setting: "fantasy" }),
  asset({ id: "mage-hood-hair", groupId: "hair", category: "hair", label: "Magierfrisur", tags: ["mage"], setting: "fantasy" }),
  asset({ id: "buzz-undercut", groupId: "hair", category: "hair", label: "Undercut", tags: ["sci-fi"], setting: "sci-fi" }),
  asset({ id: "neon-spikes", groupId: "hair", category: "hair", label: "Neon-Spikes", tags: ["sci-fi"], setting: "sci-fi" }),
  asset({ id: "data-cables", groupId: "hair", category: "hair", label: "Datenkabel", tags: ["cyborg"], setting: "sci-fi" }),
  asset({ id: "zero-g-float", groupId: "hair", category: "hair", label: "Zero-G", tags: ["sci-fi"], setting: "sci-fi" }),
  asset({ id: "crew-cut", groupId: "hair", category: "hair", label: "Crew Cut", tags: ["military"], setting: "sci-fi" }),
  asset({ id: "ponytail-tech", groupId: "hair", category: "hair", label: "Tech-Pferdeschwanz", tags: ["sci-fi"], setting: "sci-fi" })
];
var FACIAL_HAIR = [
  asset({ id: "beard-short", groupId: "hair", category: "facial-hair", label: "Kurzer Bart", tags: ["beard"], setting: "neutral" }),
  asset({ id: "beard-full", groupId: "hair", category: "facial-hair", label: "Vollbart", tags: ["beard"], setting: "fantasy" }),
  asset({ id: "beard-braided", groupId: "hair", category: "facial-hair", label: "Flechtbart", tags: ["dwarf"], setting: "fantasy" }),
  asset({ id: "goatee", groupId: "hair", category: "facial-hair", label: "Kinnbart", tags: ["beard"], setting: "neutral" }),
  asset({ id: "stubble-cyber", groupId: "hair", category: "facial-hair", label: "Cyber-Stoppel", tags: ["sci-fi"], setting: "sci-fi" }),
  asset({ id: "mustache-thin", groupId: "hair", category: "facial-hair", label: "Schnurrbart", tags: ["beard"], setting: "neutral" })
];
var EYES = [
  asset({ id: "eyes-soft", groupId: "accessory", category: "eyes", label: "Augen weich", tags: ["eyes"], setting: "neutral" }),
  asset({ id: "eyes-sharp", groupId: "accessory", category: "eyes", label: "Augen scharf", tags: ["eyes"], setting: "neutral" }),
  asset({ id: "eyes-glow-elf", groupId: "accessory", category: "eyes", label: "Elfenleucht", tags: ["eyes", "fantasy"], setting: "fantasy" }),
  asset({ id: "eyes-orc-amber", groupId: "accessory", category: "eyes", label: "Ork-Bernstein", tags: ["eyes"], setting: "fantasy" }),
  asset({ id: "brows-heavy", groupId: "accessory", category: "eyes", label: "Brauen schwer", tags: ["brows"], setting: "neutral" }),
  asset({ id: "brows-arch", groupId: "accessory", category: "eyes", label: "Brauen Bogen", tags: ["brows"], setting: "neutral" }),
  asset({ id: "eyes-visor", groupId: "accessory", category: "eyes", label: "Visor-Augen", tags: ["sci-fi"], setting: "sci-fi" }),
  asset({ id: "eyes-alien-multi", groupId: "accessory", category: "eyes", label: "Alien-Iris", tags: ["alien"], setting: "sci-fi" })
];
var OUTFITS = [
  asset({ id: "robe", groupId: "clothing", category: "outfit", label: "Magierrobe", tags: ["fantasy"], setting: "fantasy" }),
  asset({ id: "armor", groupId: "clothing", category: "outfit", label: "Plattenr\xFCstung", tags: ["fantasy"], setting: "fantasy" }),
  asset({ id: "leather", groupId: "clothing", category: "outfit", label: "Lederwams", tags: ["fantasy"], setting: "fantasy" }),
  asset({ id: "noble", groupId: "clothing", category: "outfit", label: "Adelsgewand", tags: ["fantasy"], setting: "fantasy" }),
  asset({ id: "ranger-cloak", groupId: "clothing", category: "outfit", label: "Waldl\xE4ufer", tags: ["fantasy"], setting: "fantasy" }),
  asset({ id: "monk-wraps", groupId: "clothing", category: "outfit", label: "M\xF6nchsbinden", tags: ["fantasy"], setting: "fantasy" }),
  asset({ id: "casual", groupId: "clothing", category: "outfit", label: "Alltag", tags: ["neutral"], setting: "neutral" }),
  asset({ id: "flight-suit", groupId: "clothing", category: "outfit", label: "Fluganzug", tags: ["sci-fi"], setting: "sci-fi" }),
  asset({ id: "corpo-suit", groupId: "clothing", category: "outfit", label: "Corpo-Anzug", tags: ["sci-fi"], setting: "sci-fi" }),
  asset({ id: "street-synth", groupId: "clothing", category: "outfit", label: "Street Synth", tags: ["sci-fi"], setting: "sci-fi" }),
  asset({ id: "marine-armor", groupId: "clothing", category: "outfit", label: "Marine-Panzer", tags: ["sci-fi"], setting: "sci-fi" }),
  asset({ id: "lab-coat", groupId: "clothing", category: "outfit", label: "Laborkittel", tags: ["sci-fi"], setting: "sci-fi" }),
  asset({ id: "void-cloak", groupId: "clothing", category: "outfit", label: "Void-Mantel", tags: ["sci-fi"], setting: "sci-fi" })
];
var SPECIES = [
  asset({ id: "round", groupId: "ears", category: "species-trait", label: "Runde Ohren", tags: ["human"], setting: "neutral" }),
  asset({ id: "elf-long", groupId: "ears", category: "species-trait", label: "Elfenohren", tags: ["elf"], setting: "fantasy" }),
  asset({ id: "orc-pointed", groupId: "ears", category: "species-trait", label: "Orkohren", tags: ["orc"], setting: "fantasy" }),
  asset({ id: "horns-small", groupId: "ears", category: "species-trait", label: "Kleine H\xF6rner", tags: ["demon"], setting: "fantasy" }),
  asset({ id: "horns-curved", groupId: "ears", category: "species-trait", label: "Gebogene H\xF6rner", tags: ["demon"], setting: "fantasy" }),
  asset({ id: "fins-side", groupId: "ears", category: "species-trait", label: "Seitenflossen", tags: ["aquatic"], setting: "fantasy" }),
  asset({ id: "synthetic", groupId: "ears", category: "species-trait", label: "Synth-Ohren", tags: ["cyborg"], setting: "sci-fi" }),
  asset({ id: "antennae", groupId: "ears", category: "species-trait", label: "Antennen", tags: ["alien"], setting: "sci-fi" }),
  asset({ id: "ridge-crest", groupId: "ears", category: "species-trait", label: "Kammr\xFCcken", tags: ["alien"], setting: "sci-fi" }),
  asset({ id: "none", groupId: "ears", category: "species-trait", label: "Keine Ohren sichtbar", tags: ["minimal"], setting: "neutral" })
];
var ACCESSORIES = [
  asset({ id: "none", groupId: "accessory", category: "accessory", label: "Keins", tags: ["none"], setting: "neutral" }),
  asset({ id: "earring", groupId: "accessory", category: "accessory", label: "Ohrring", tags: ["jewelry"], setting: "neutral" }),
  asset({ id: "scar", groupId: "accessory", category: "accessory", label: "Narbe", tags: ["marking"], setting: "neutral" }),
  asset({ id: "tiara", groupId: "accessory", category: "accessory", label: "Diadem", tags: ["fantasy"], setting: "fantasy" }),
  asset({ id: "eyepatch", groupId: "accessory", category: "accessory", label: "Augenklappe", tags: ["fantasy"], setting: "fantasy" }),
  asset({ id: "amulet", groupId: "accessory", category: "accessory", label: "Amulett", tags: ["fantasy"], setting: "fantasy" }),
  asset({ id: "goggles", groupId: "accessory", category: "accessory", label: "Schutzbrille", tags: ["sci-fi"], setting: "sci-fi" }),
  asset({ id: "ear-cuff-tech", groupId: "accessory", category: "accessory", label: "Tech-Ohrclip", tags: ["sci-fi"], setting: "sci-fi" }),
  asset({ id: "holo-pin", groupId: "accessory", category: "accessory", label: "Holo-Pin", tags: ["sci-fi"], setting: "sci-fi" }),
  asset({ id: "bandana", groupId: "accessory", category: "accessory", label: "Bandana", tags: ["street"], setting: "neutral" }),
  asset({ id: "necklace-bone", groupId: "accessory", category: "accessory", label: "Knochenkette", tags: ["fantasy"], setting: "fantasy" }),
  asset({ id: "comm-badge", groupId: "accessory", category: "accessory", label: "Comm-Badge", tags: ["sci-fi"], setting: "sci-fi" })
];
var CYBER = [
  asset({ id: "optic-implant", groupId: "accessory", category: "cybernetic", label: "Optik-Implantat", tags: ["cyber"], setting: "sci-fi" }),
  asset({ id: "jaw-plate", groupId: "accessory", category: "cybernetic", label: "Kieferplatte", tags: ["cyber"], setting: "sci-fi" }),
  asset({ id: "cranial-ports", groupId: "accessory", category: "cybernetic", label: "Sch\xE4delports", tags: ["cyber"], setting: "sci-fi" }),
  asset({ id: "arm-servo-hint", groupId: "accessory", category: "cybernetic", label: "Servo-Mark", tags: ["cyber"], setting: "sci-fi" }),
  asset({ id: "neural-lace", groupId: "accessory", category: "cybernetic", label: "Neural Lace", tags: ["cyber"], setting: "sci-fi" }),
  asset({ id: "vocal-mod", groupId: "accessory", category: "cybernetic", label: "Stimm-Mod", tags: ["cyber"], setting: "sci-fi" }),
  asset({ id: "dermal-chrome", groupId: "accessory", category: "cybernetic", label: "Dermachrom", tags: ["cyber"], setting: "sci-fi" }),
  asset({ id: "hud-lens", groupId: "accessory", category: "cybernetic", label: "HUD-Linse", tags: ["cyber"], setting: "sci-fi" })
];
var MARKINGS = [
  asset({ id: "mark-freckles", groupId: "accessory", category: "skin-marking", label: "Sommersprossen", tags: ["skin"], setting: "neutral" }),
  asset({ id: "mark-tattoo-rune", groupId: "accessory", category: "skin-marking", label: "Runentattoo", tags: ["fantasy"], setting: "fantasy" }),
  asset({ id: "mark-warpaint", groupId: "accessory", category: "skin-marking", label: "Kriegsbemalung", tags: ["fantasy"], setting: "fantasy" }),
  asset({ id: "mark-scales", groupId: "accessory", category: "skin-marking", label: "Schuppen", tags: ["fantasy"], setting: "fantasy" }),
  asset({ id: "mark-circuit", groupId: "accessory", category: "skin-marking", label: "Schaltkreise", tags: ["sci-fi"], setting: "sci-fi" }),
  asset({ id: "mark-biolume", groupId: "accessory", category: "skin-marking", label: "Biolumineszenz", tags: ["alien"], setting: "sci-fi" })
];
var CONTENT_PACK_V1_ASSETS = [
  ...FACES,
  ...HAIR,
  ...FACIAL_HAIR,
  ...EYES,
  ...OUTFITS,
  ...SPECIES,
  ...ACCESSORIES,
  ...CYBER,
  ...MARKINGS
];

// src/domains/character/avatar/trait-catalog.ts
function toOption(asset2) {
  return {
    id: asset2.id,
    groupId: asset2.groupId,
    label: asset2.label,
    hint: asset2.category,
    setting: asset2.setting,
    tags: asset2.tags
  };
}
function buildGroupOptions() {
  const buckets = {
    head: [],
    ears: [],
    hair: [],
    clothing: [],
    accessory: []
  };
  const seen = /* @__PURE__ */ new Set();
  for (const asset2 of CONTENT_PACK_V1_ASSETS) {
    const key = `${asset2.groupId}:${asset2.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    buckets[asset2.groupId].push(toOption(asset2));
  }
  return buckets;
}
var BY_GROUP = buildGroupOptions();
var ALL_OPTIONS = [
  ...BY_GROUP.head,
  ...BY_GROUP.ears,
  ...BY_GROUP.hair,
  ...BY_GROUP.clothing,
  ...BY_GROUP.accessory
];
var OPTION_INDEX = new Map(
  ALL_OPTIONS.map((option) => [`${option.groupId}:${option.id}`, option])
);

// src/domains/character/avatar/avatar-import.ts
var AVATAR_IMPORT_MAX_BYTES = 150 * 1024 * 1024;

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
var LIVEACT_FACE_ASSET_FULL_V1_CHANNELS = LIVEACT_FACE_CHANNELS.filter((id) => id !== "_neutral");

// src/domains/character/liveact/liveact-performance-face-contract.ts
var PERFORMANCE_FACE_REQUIRED_PREMIUM_CONTROLS = [
  "nasolabialFoldLeft",
  "nasolabialFoldRight",
  "cheekVolumeLeft",
  "cheekVolumeRight",
  "lipContourUpperLeft",
  "lipContourUpperRight",
  "lipContourLowerLeft",
  "lipContourLowerRight"
];
var PERFORMANCE_FACE_OPTIONAL_PREMIUM_CONTROLS = [
  "lidTightenLeft",
  "lidTightenRight"
];
var PERFORMANCE_FACE_ALL_CONTROLS = [
  ...PERFORMANCE_FACE_REQUIRED_PREMIUM_CONTROLS,
  ...PERFORMANCE_FACE_OPTIONAL_PREMIUM_CONTROLS
];

// src/domains/character/liveact/liveact-performance-face-aliases.ts
function pascalCase(id) {
  if (!id.length) return id;
  return id.charAt(0).toUpperCase() + id.slice(1);
}
function aliasesForControl(id) {
  const list = [id, pascalCase(id)];
  const underscored = id.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
  if (underscored !== id) list.push(underscored);
  return list;
}
var PERFORMANCE_FACE_TARGET_ALIASES = Object.fromEntries(
  PERFORMANCE_FACE_ALL_CONTROLS.map((id) => [id, aliasesForControl(id)])
);

// src/domains/character/avatar/identity-transfer-v1.ts
var IDENTITY_TRANSFER_SCORE_WEIGHTS = {
  identityFidelity: 0.22,
  silhouetteFidelity: 0.14,
  artifacts: 0.1,
  cost: 0.08,
  latency: 0.08,
  licenseFit: 0.12,
  runtimeComplexity: 0.08,
  reproducibility: 0.1,
  selfHostFit: 0.08
};
var IDENTITY_TRANSFER_GOLDEN_MATRIX_V1 = [
  // landmark-morph-fitting
  score("landmark-morph-fitting", "human", {
    identityFidelity: 0.72,
    silhouetteFidelity: 0.78,
    artifacts: 0.8,
    cost: 0.95,
    latency: 0.9,
    licenseFit: 1,
    runtimeComplexity: 0.75,
    reproducibility: 1,
    selfHostFit: 1
  }, "Landmark\u2192Morph auf Standard; gute Silhouette, mittlere Face-Treue."),
  score("landmark-morph-fitting", "elf", {
    identityFidelity: 0.68,
    silhouetteFidelity: 0.74,
    artifacts: 0.78,
    cost: 0.95,
    latency: 0.9,
    licenseFit: 1,
    runtimeComplexity: 0.75,
    reproducibility: 1,
    selfHostFit: 1
  }, "Ohren/Traits \xFCber Content-Pack; Morph approximiert Schlankheit."),
  score("landmark-morph-fitting", "dwarf", {
    identityFidelity: 0.7,
    silhouetteFidelity: 0.82,
    artifacts: 0.8,
    cost: 0.95,
    latency: 0.9,
    licenseFit: 1,
    runtimeComplexity: 0.75,
    reproducibility: 1,
    selfHostFit: 1
  }, "Compact Family + Build Morph; starke Silhouette."),
  score("landmark-morph-fitting", "gumo-like", {
    identityFidelity: 0.48,
    silhouetteFidelity: 0.55,
    artifacts: 0.7,
    cost: 0.95,
    latency: 0.9,
    licenseFit: 1,
    runtimeComplexity: 0.75,
    reproducibility: 1,
    selfHostFit: 1
  }, "Stark stilisiert: Morph allein unter Threshold \u2192 Fallback n\xF6tig."),
  // texture-projection-bake
  score("texture-projection-bake", "human", {
    identityFidelity: 0.8,
    silhouetteFidelity: 0.7,
    artifacts: 0.55,
    cost: 0.7,
    latency: 0.55,
    licenseFit: 1,
    runtimeComplexity: 0.45,
    reproducibility: 0.85,
    selfHostFit: 0.9
  }, "H\xF6here Look-Treue; Stretch/Seam-Artefakte an Ohren/Hals."),
  score("texture-projection-bake", "elf", {
    identityFidelity: 0.78,
    silhouetteFidelity: 0.68,
    artifacts: 0.5,
    cost: 0.7,
    latency: 0.55,
    licenseFit: 1,
    runtimeComplexity: 0.45,
    reproducibility: 0.85,
    selfHostFit: 0.9
  }, "Skin/Hair Projection gut; spitze Ohren brauchen Trait-Mesh."),
  score("texture-projection-bake", "dwarf", {
    identityFidelity: 0.76,
    silhouetteFidelity: 0.72,
    artifacts: 0.52,
    cost: 0.7,
    latency: 0.55,
    licenseFit: 1,
    runtimeComplexity: 0.45,
    reproducibility: 0.85,
    selfHostFit: 0.9
  }, "Bart/Haut Projection ok; Silhouette weiter Family-Morph."),
  score("texture-projection-bake", "gumo-like", {
    identityFidelity: 0.58,
    silhouetteFidelity: 0.5,
    artifacts: 0.4,
    cost: 0.7,
    latency: 0.55,
    licenseFit: 1,
    runtimeComplexity: 0.45,
    reproducibility: 0.85,
    selfHostFit: 0.9
  }, "Stil-Farben \xFCbertragbar; Form bleibt Family-Approximation."),
  // material-trait-transfer
  score("material-trait-transfer", "human", {
    identityFidelity: 0.55,
    silhouetteFidelity: 0.65,
    artifacts: 0.9,
    cost: 0.98,
    latency: 0.95,
    licenseFit: 1,
    runtimeComplexity: 0.9,
    reproducibility: 1,
    selfHostFit: 1
  }, "Colors/Traits/Materials schnell; wenig Face-Identit\xE4t allein."),
  score("material-trait-transfer", "elf", {
    identityFidelity: 0.6,
    silhouetteFidelity: 0.7,
    artifacts: 0.9,
    cost: 0.98,
    latency: 0.95,
    licenseFit: 1,
    runtimeComplexity: 0.9,
    reproducibility: 1,
    selfHostFit: 1
  }, "Elf-Ohren/Haare als Traits = hohe Produktn\xE4he."),
  score("material-trait-transfer", "dwarf", {
    identityFidelity: 0.58,
    silhouetteFidelity: 0.75,
    artifacts: 0.9,
    cost: 0.98,
    latency: 0.95,
    licenseFit: 1,
    runtimeComplexity: 0.9,
    reproducibility: 1,
    selfHostFit: 1
  }, "Bart/Outfit Traits + Compact Family."),
  score("material-trait-transfer", "gumo-like", {
    identityFidelity: 0.42,
    silhouetteFidelity: 0.45,
    artifacts: 0.88,
    cost: 0.98,
    latency: 0.95,
    licenseFit: 1,
    runtimeComplexity: 0.9,
    reproducibility: 1,
    selfHostFit: 1
  }, "Palette/Traits retten Look-Idee; Form nicht gumo-treu."),
  // ai-assisted (must not be default)
  score("ai-assisted", "human", {
    identityFidelity: 0.88,
    silhouetteFidelity: 0.85,
    artifacts: 0.7,
    cost: 0.25,
    latency: 0.2,
    licenseFit: 0.35,
    runtimeComplexity: 0.3,
    reproducibility: 0.25,
    selfHostFit: 0.2
  }, "Hohe Treue, aber Credits/ToS/Non-Determinismus \u2014 nicht Default."),
  score("ai-assisted", "elf", {
    identityFidelity: 0.86,
    silhouetteFidelity: 0.84,
    artifacts: 0.68,
    cost: 0.25,
    latency: 0.2,
    licenseFit: 0.35,
    runtimeComplexity: 0.3,
    reproducibility: 0.25,
    selfHostFit: 0.2
  }, "Provider-Look; Self-Host/Lizenz unfit f\xFCr Default."),
  score("ai-assisted", "dwarf", {
    identityFidelity: 0.85,
    silhouetteFidelity: 0.83,
    artifacts: 0.68,
    cost: 0.25,
    latency: 0.2,
    licenseFit: 0.35,
    runtimeComplexity: 0.3,
    reproducibility: 0.25,
    selfHostFit: 0.2
  }, "Gleicher Ban: closed/non-repro."),
  score("ai-assisted", "gumo-like", {
    identityFidelity: 0.82,
    silhouetteFidelity: 0.8,
    artifacts: 0.65,
    cost: 0.25,
    latency: 0.2,
    licenseFit: 0.35,
    runtimeComplexity: 0.3,
    reproducibility: 0.25,
    selfHostFit: 0.2
  }, "Beste stilistische Treue \u2014 trotzdem nicht Default.")
];
function score(approachId, fixtureId, scores, notesDe) {
  return {
    approachId,
    fixtureId,
    scores,
    aggregate: weightedAggregate(scores),
    notesDe
  };
}
function weightedAggregate(scores) {
  let sum = 0;
  let w = 0;
  for (const axis of Object.keys(IDENTITY_TRANSFER_SCORE_WEIGHTS)) {
    const weight = IDENTITY_TRANSFER_SCORE_WEIGHTS[axis];
    sum += scores[axis] * weight;
    w += weight;
  }
  return w > 0 ? Number((sum / w).toFixed(4)) : 0;
}

// src/domains/items/model3d-assets.ts
var ITEM_MODEL3D_ASSET_KEY_PREFIX = "model3d:";
var ITEM_MODEL3D_MAX_BYTES = 50 * 1024 * 1024;
function parseItemModel3dAssetKey(model3d) {
  if (!model3d || typeof model3d !== "string") return null;
  const trimmed = model3d.trim();
  if (!trimmed.startsWith(ITEM_MODEL3D_ASSET_KEY_PREFIX)) return null;
  const id = trimmed.slice(ITEM_MODEL3D_ASSET_KEY_PREFIX.length).trim();
  return id || null;
}

// src/domains/character/inventory-v2/operations.ts
var nameCollator = new Intl.Collator("de-DE");

// src/domains/items/taxonomy.ts
var ITEM_KIND_KEYS = [
  "weapon",
  "armor",
  "shield",
  "tool",
  "device",
  "consumable",
  "container",
  "document",
  "currency",
  "key",
  "food",
  "medical",
  "clothing",
  "resource",
  "sport",
  "entertainment",
  "misc"
];
var ITEM_SETTING_TAGS = ["fantasy", "sci-fi", "contemporary"];
var ITEM_TECH_LEVELS = [
  "primitive",
  "medieval",
  "industrial",
  "modern",
  "near-future",
  "advanced"
];
var ITEM_CONTEXTS = [
  "combat",
  "exploration",
  "survival",
  "medical",
  "social",
  "domestic",
  "office",
  "sports",
  "science",
  "engineering",
  "travel",
  "entertainment",
  "urban"
];
var ITEM_CAPABILITIES = [
  "attack",
  "defend",
  "heal",
  "communicate",
  "navigate",
  "illuminate",
  "repair",
  "scan",
  "record",
  "access",
  "carry",
  "consume",
  "trade",
  "unlock",
  "disguise",
  "entertain",
  "research",
  "survive"
];
var ITEM_ROLES = [
  "ordinary",
  "valuable",
  "quest",
  "evidence",
  "contraband",
  "key-item",
  "personal",
  "collectible"
];
var ITEM_ORIGINS = [
  "core-archetype",
  "builtin-standard",
  "personal",
  "world"
];
var KIND_KEY_SET = new Set(ITEM_KIND_KEYS);
var SETTING_TAG_SET = new Set(ITEM_SETTING_TAGS);
var TECH_LEVEL_SET = new Set(ITEM_TECH_LEVELS);
var CONTEXT_SET = new Set(ITEM_CONTEXTS);
var CAPABILITY_SET = new Set(ITEM_CAPABILITIES);
var ROLE_SET = new Set(ITEM_ROLES);
var ORIGIN_SET = new Set(ITEM_ORIGINS);

// src/domains/items/normalize.ts
var KIND_KEY_FROM_TYPE = {
  weapon: "weapon",
  armor: "armor",
  shield: "shield",
  tool: "tool",
  consumable: "consumable",
  container: "container",
  misc: "misc"
};
var ORIGIN_FROM_SCOPE = {
  core: "core-archetype",
  world: "world",
  personal: "personal"
};
function normalizeItemDefinition(def) {
  return {
    ...def,
    kindKey: def.kindKey ?? KIND_KEY_FROM_TYPE[def.type],
    origin: def.origin ?? ORIGIN_FROM_SCOPE[def.scope]
  };
}

// src/domains/items/packs/core-snapshots.ts
var CORE_MECHANIC_SNAPSHOTS = Object.freeze({
  "core.weapon.light-melee": Object.freeze({
    type: "weapon",
    load: 1,
    cost: 1,
    stackLimit: 1,
    equipSlots: ["mainHand", "offHand"],
    damage: "d6+1",
    damageType: "Kinetisch",
    traits: ["Finesse"]
  }),
  "core.weapon.standard-melee": Object.freeze({
    type: "weapon",
    load: 1,
    cost: 2,
    stackLimit: 1,
    equipSlots: ["mainHand", "offHand"],
    damage: "d8+2",
    damageType: "Kinetisch"
  }),
  "core.weapon.heavy-melee": Object.freeze({
    type: "weapon",
    load: 2,
    cost: 3,
    stackLimit: 1,
    equipSlots: ["mainHand", "offHand"],
    twoHanded: true,
    damage: "d10+3",
    damageType: "Kinetisch"
  }),
  "core.weapon.reach-melee": Object.freeze({
    type: "weapon",
    load: 2,
    cost: 2,
    stackLimit: 1,
    equipSlots: ["mainHand", "offHand"],
    twoHanded: true,
    damage: "d8+2",
    damageType: "Kinetisch",
    traits: ["Reichweite"]
  }),
  "core.weapon.light-ranged": Object.freeze({
    type: "weapon",
    load: 1,
    cost: 2,
    stackLimit: 1,
    equipSlots: ["mainHand", "offHand"],
    damage: "d6+1",
    damageType: "Kinetisch"
  }),
  "core.weapon.standard-ranged": Object.freeze({
    type: "weapon",
    load: 1,
    cost: 3,
    stackLimit: 1,
    equipSlots: ["mainHand", "offHand"],
    damage: "d8+2",
    damageType: "Kinetisch"
  }),
  "core.weapon.heavy-ranged": Object.freeze({
    type: "weapon",
    load: 2,
    cost: 4,
    stackLimit: 1,
    equipSlots: ["mainHand", "offHand"],
    twoHanded: true,
    damage: "d10+3",
    damageType: "Kinetisch"
  }),
  "core.weapon.armor-piercing": Object.freeze({
    type: "weapon",
    load: 2,
    cost: 4,
    stackLimit: 1,
    equipSlots: ["mainHand", "offHand"],
    twoHanded: true,
    damage: "d8+2",
    damageType: "Kinetisch",
    traits: ["Durchdringung 1"]
  }),
  "core.armor.light": Object.freeze({
    type: "armor",
    load: 1,
    cost: 2,
    stackLimit: 1,
    equipSlots: ["body"],
    protection: 1,
    requirements: { minimumStrength: 1 }
  }),
  "core.armor.medium": Object.freeze({
    type: "armor",
    load: 2,
    cost: 3,
    stackLimit: 1,
    equipSlots: ["body"],
    protection: 2,
    requirements: { minimumStrength: 2 }
  }),
  "core.armor.heavy": Object.freeze({
    type: "armor",
    load: 3,
    cost: 4,
    stackLimit: 1,
    equipSlots: ["body"],
    protection: 3,
    requirements: { minimumStrength: 4 }
  }),
  "core.shield.standard": Object.freeze({
    type: "shield",
    load: 1,
    cost: 2,
    stackLimit: 1,
    equipSlots: ["mainHand", "offHand"],
    traits: ["+1 Verteidigung", "1 Hand"]
  }),
  "core.tool.medical": Object.freeze({
    type: "tool",
    load: 1,
    cost: 2,
    stackLimit: 1
  }),
  "core.tool.repair": Object.freeze({
    type: "tool",
    load: 1,
    cost: 2,
    stackLimit: 1
  }),
  "core.tool.precision": Object.freeze({
    type: "tool",
    load: 1,
    cost: 2,
    stackLimit: 1
  }),
  "core.tool.survival": Object.freeze({
    type: "tool",
    load: 1,
    cost: 2,
    stackLimit: 1
  }),
  "core.tool.climbing": Object.freeze({
    type: "tool",
    load: 2,
    cost: 2,
    stackLimit: 1
  }),
  "core.tool.navigation": Object.freeze({
    type: "tool",
    load: 1,
    cost: 2,
    stackLimit: 1
  }),
  "core.tool.research": Object.freeze({
    type: "tool",
    load: 1,
    cost: 2,
    stackLimit: 1
  }),
  "core.tool.craft": Object.freeze({
    type: "tool",
    load: 2,
    cost: 2,
    stackLimit: 1
  }),
  "core.consumable.medical": Object.freeze({
    type: "consumable",
    load: 0,
    cost: 1,
    stackLimit: 5
  }),
  "core.consumable.repair": Object.freeze({
    type: "consumable",
    load: 0,
    cost: 1,
    stackLimit: 5
  }),
  "core.consumable.ration": Object.freeze({
    type: "consumable",
    load: 0,
    cost: 1,
    stackLimit: 5
  }),
  "core.consumable.energy": Object.freeze({
    type: "consumable",
    load: 0,
    cost: 1,
    stackLimit: 5
  }),
  "core.consumable.general": Object.freeze({
    type: "consumable",
    load: 0,
    cost: 1,
    stackLimit: 5
  }),
  "core.container.pouch": Object.freeze({
    type: "container",
    load: 0,
    cost: 1,
    stackLimit: 1,
    containerCapacity: 2
  }),
  "core.container.bag": Object.freeze({
    type: "container",
    load: 1,
    cost: 1,
    stackLimit: 1,
    containerCapacity: 4
  }),
  "core.container.backpack": Object.freeze({
    type: "container",
    load: 1,
    cost: 2,
    stackLimit: 1,
    containerCapacity: 6
  }),
  "core.container.transport": Object.freeze({
    type: "container",
    load: 2,
    cost: 2,
    stackLimit: 1,
    containerCapacity: 10
  }),
  "core.misc.light-source": Object.freeze({
    type: "misc",
    load: 0,
    cost: 1,
    stackLimit: 3
  }),
  "core.misc.rope": Object.freeze({
    type: "misc",
    load: 1,
    cost: 1,
    stackLimit: 2
  }),
  "core.misc.documentation": Object.freeze({
    type: "misc",
    load: 0,
    cost: 1,
    stackLimit: 3
  }),
  "core.misc.communicator": Object.freeze({
    type: "misc",
    load: 0,
    cost: 2,
    stackLimit: 1,
    equipSlots: ["accessory1", "accessory2"]
  }),
  "core.misc.headgear": Object.freeze({
    type: "misc",
    load: 1,
    cost: 1,
    stackLimit: 1,
    equipSlots: ["head"]
  }),
  "core.misc.special-device": Object.freeze({
    type: "misc",
    load: 1,
    cost: 3,
    stackLimit: 1,
    equipSlots: ["special"]
  }),
  "core.misc.footwear": Object.freeze({
    type: "misc",
    load: 1,
    cost: 1,
    stackLimit: 1,
    equipSlots: ["feet"]
  })
});

// src/domains/items/packs/build-standard-item.ts
function builtinDefinitionIdToIconKey(definitionId) {
  return definitionId.replace(/\./g, "-");
}
function buildStandardItem(input) {
  const iconKey = input.iconKey ?? builtinDefinitionIdToIconKey(input.id);
  const basedOn = input.basedOnDefinitionId;
  if (basedOn !== void 0) {
    const snapshot = CORE_MECHANIC_SNAPSHOTS[basedOn];
    if (!snapshot) {
      throw new Error(`buildStandardItem: unknown Core snapshot ${basedOn} for ${input.id}`);
    }
    return {
      id: input.id,
      scope: "core",
      origin: "builtin-standard",
      basedOnDefinitionId: basedOn,
      name: input.name,
      description: input.description,
      type: snapshot.type,
      load: snapshot.load,
      cost: snapshot.cost,
      stackLimit: snapshot.stackLimit,
      requirements: snapshot.requirements,
      equipSlots: snapshot.equipSlots,
      twoHanded: snapshot.twoHanded,
      containerCapacity: snapshot.containerCapacity,
      damage: snapshot.damage,
      damageType: snapshot.damageType,
      protection: snapshot.protection,
      traits: snapshot.traits,
      iconKey,
      kindKey: input.kindKey,
      settingTags: [...input.settingTags],
      techLevel: input.techLevel,
      contexts: input.contexts ? [...input.contexts] : void 0,
      capabilities: input.capabilities ? [...input.capabilities] : void 0,
      roles: input.roles ? [...input.roles] : void 0
    };
  }
  if (input.type === void 0 || input.load === void 0 || input.cost === void 0) {
    throw new Error(
      `buildStandardItem: narrative item ${input.id} requires type, load, and cost`
    );
  }
  return {
    id: input.id,
    scope: "core",
    origin: "builtin-standard",
    name: input.name,
    description: input.description,
    type: input.type,
    load: input.load,
    cost: input.cost,
    stackLimit: input.stackLimit ?? 1,
    requirements: input.requirements,
    equipSlots: input.equipSlots,
    twoHanded: input.twoHanded,
    containerCapacity: input.containerCapacity,
    damage: input.damage,
    damageType: input.damageType,
    protection: input.protection,
    traits: input.traits,
    iconKey,
    kindKey: input.kindKey,
    settingTags: [...input.settingTags],
    techLevel: input.techLevel,
    contexts: input.contexts ? [...input.contexts] : void 0,
    capabilities: input.capabilities ? [...input.capabilities] : void 0,
    roles: input.roles ? [...input.roles] : void 0
  };
}

// src/domains/items/packs/contemporary-basic.ts
var SETTING = ["contemporary"];
var TECH = "modern";
var CONTEMPORARY_BASIC_DEFINITIONS = Object.freeze([
  buildStandardItem({
    id: "builtin.contemporary.smartphone",
    name: "Smartphone",
    description: "Allt\xE4gliches Mobiltelefon f\xFCr Anrufe, Nachrichten und Apps.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["social", "office", "urban", "travel"],
    capabilities: ["communicate", "record"],
    kindKey: "device",
    roles: ["personal"],
    basedOnDefinitionId: "core.misc.communicator"
  }),
  buildStandardItem({
    id: "builtin.contemporary.laptop",
    name: "Laptop",
    description: "Tragbarer Computer f\xFCr Arbeit, Studium und Unterhaltung.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["office", "entertainment"],
    capabilities: ["record", "research"],
    kindKey: "device",
    basedOnDefinitionId: "core.misc.special-device"
  }),
  buildStandardItem({
    id: "builtin.contemporary.tablet",
    name: "Tablet",
    description: "Flaches Touch-Ger\xE4t f\xFCr Lesen, Notizen und Medien.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["office", "entertainment"],
    capabilities: ["record"],
    kindKey: "device",
    basedOnDefinitionId: "core.misc.documentation"
  }),
  buildStandardItem({
    id: "builtin.contemporary.headphones",
    name: "Kopfh\xF6rer",
    description: "\xDCber-Ohr- oder In-Ear-Kopfh\xF6rer f\xFCr Musik und Anrufe.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["entertainment", "travel"],
    capabilities: ["entertain"],
    kindKey: "device",
    type: "misc",
    load: 0,
    cost: 1,
    stackLimit: 1
  }),
  buildStandardItem({
    id: "builtin.contemporary.charger",
    name: "Ladeger\xE4t",
    description: "Netzteil und Kabel zum Laden g\xE4ngiger Ger\xE4te.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["travel", "office"],
    kindKey: "device",
    type: "misc",
    load: 0,
    cost: 1,
    stackLimit: 2
  }),
  buildStandardItem({
    id: "builtin.contemporary.powerbank",
    name: "Powerbank",
    description: "Tragbarer Akku zum Nachladen unterwegs.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["travel", "survival"],
    capabilities: ["survive"],
    kindKey: "device",
    basedOnDefinitionId: "core.consumable.energy"
  }),
  buildStandardItem({
    id: "builtin.contemporary.wallet",
    name: "Geldb\xF6rse",
    description: "Kleine B\xF6rse f\xFCr Karten, Ausweis und Bargeld.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["urban", "social"],
    capabilities: ["carry"],
    roles: ["personal"],
    basedOnDefinitionId: "core.container.pouch"
  }),
  buildStandardItem({
    id: "builtin.contemporary.cash",
    name: "Bargeld",
    description: "Scheine und M\xFCnzen f\xFCr allt\xE4gliche Zahlungen.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["urban", "social"],
    capabilities: ["trade"],
    kindKey: "currency",
    roles: ["valuable"],
    type: "misc",
    load: 0,
    cost: 1,
    stackLimit: 1
  }),
  buildStandardItem({
    id: "builtin.contemporary.bank-card",
    name: "Bankkarte",
    description: "Zahlungskarte f\xFCr Konten und Automaten. Narrativ.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["urban", "office"],
    capabilities: ["trade", "access"],
    kindKey: "currency",
    roles: ["personal"],
    type: "misc",
    load: 0,
    cost: 1,
    stackLimit: 1
  }),
  buildStandardItem({
    id: "builtin.contemporary.id-card",
    name: "Personalausweis",
    description: "Amtlicher Identit\xE4tsnachweis. Narrativ.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["urban", "office"],
    capabilities: ["access"],
    kindKey: "document",
    roles: ["personal", "key-item"],
    type: "misc",
    load: 0,
    cost: 0,
    stackLimit: 1
  }),
  buildStandardItem({
    id: "builtin.contemporary.drivers-license",
    name: "F\xFChrerschein",
    description: "Berechtigung zum F\xFChren von Kraftfahrzeugen. Narrativ.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["travel", "urban"],
    capabilities: ["access"],
    kindKey: "document",
    roles: ["personal", "key-item"],
    type: "misc",
    load: 0,
    cost: 0,
    stackLimit: 1
  }),
  buildStandardItem({
    id: "builtin.contemporary.keyring",
    name: "Schl\xFCsselbund",
    description: "Haus-, B\xFCro- und Nebenschl\xFCssel an einem Ring.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["domestic", "urban"],
    capabilities: ["unlock", "access"],
    kindKey: "key",
    roles: ["personal", "key-item"],
    type: "misc",
    load: 0,
    cost: 1,
    stackLimit: 1
  }),
  buildStandardItem({
    id: "builtin.contemporary.key-card",
    name: "Schl\xFCsselkarte",
    description: "Magnet- oder Chipkarte f\xFCr T\xFCren und Zutritt.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["office", "urban"],
    capabilities: ["access", "unlock"],
    kindKey: "key",
    roles: ["key-item"],
    type: "misc",
    load: 0,
    cost: 1,
    stackLimit: 1
  }),
  buildStandardItem({
    id: "builtin.contemporary.backpack",
    name: "Rucksack",
    description: "Alltagsrucksack f\xFCr Schule, Pendeln und Reisen.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["travel", "urban"],
    capabilities: ["carry"],
    basedOnDefinitionId: "core.container.backpack"
  }),
  buildStandardItem({
    id: "builtin.contemporary.handbag",
    name: "Handtasche",
    description: "Kleine Tasche f\xFCr pers\xF6nliche Dinge.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["social", "urban"],
    capabilities: ["carry"],
    basedOnDefinitionId: "core.container.bag"
  }),
  buildStandardItem({
    id: "builtin.contemporary.shopping-bag",
    name: "Einkaufstasche",
    description: "Tragetasche f\xFCr Eink\xE4ufe und lose Gegenst\xE4nde.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["domestic", "urban"],
    capabilities: ["carry"],
    basedOnDefinitionId: "core.container.bag"
  }),
  buildStandardItem({
    id: "builtin.contemporary.notebook",
    name: "Notizbuch",
    description: "Gebundenes Heft f\xFCr Notizen und Skizzen.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["office", "social"],
    capabilities: ["record"],
    kindKey: "document",
    basedOnDefinitionId: "core.misc.documentation"
  }),
  buildStandardItem({
    id: "builtin.contemporary.ballpoint-pen",
    name: "Kugelschreiber",
    description: "Allt\xE4glicher Schreibstift. Rein narrativ.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["office"],
    capabilities: ["record"],
    kindKey: "tool",
    type: "misc",
    load: 0,
    cost: 0,
    stackLimit: 5
  }),
  buildStandardItem({
    id: "builtin.contemporary.document-folder",
    name: "Dokumentenmappe",
    description: "Mappe f\xFCr Unterlagen und Ausdrucke.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["office"],
    capabilities: ["carry", "record"],
    kindKey: "document",
    basedOnDefinitionId: "core.misc.documentation"
  }),
  buildStandardItem({
    id: "builtin.contemporary.contract",
    name: "Vertrag",
    description: "Schriftliche Vereinbarung. Rein narrativ, ohne Kampfwerte.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["office", "social"],
    kindKey: "document",
    roles: ["evidence", "quest"],
    type: "misc",
    load: 0,
    cost: 0,
    stackLimit: 1
  }),
  buildStandardItem({
    id: "builtin.contemporary.flashlight",
    name: "Taschenlampe",
    description: "Batteriebetriebene Lichtquelle f\xFCr dunkle Orte.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["survival", "urban", "exploration"],
    capabilities: ["illuminate"],
    kindKey: "device",
    basedOnDefinitionId: "core.misc.light-source"
  }),
  buildStandardItem({
    id: "builtin.contemporary.lighter",
    name: "Feuerzeug",
    description: "Kleines Feuerzeug zum Entz\xFCnden von Flammen.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["survival", "domestic"],
    capabilities: ["survive"],
    type: "misc",
    load: 0,
    cost: 0,
    stackLimit: 2
  }),
  buildStandardItem({
    id: "builtin.contemporary.umbrella",
    name: "Regenschirm",
    description: "Klappbarer Schirm gegen Regen.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["urban", "travel"],
    capabilities: ["survive"],
    type: "misc",
    load: 1,
    cost: 1,
    stackLimit: 1
  }),
  buildStandardItem({
    id: "builtin.contemporary.water-bottle",
    name: "Wasserflasche",
    description: "Wiederbef\xFCllbare Flasche mit Trinkwasser.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["travel", "sports", "survival"],
    capabilities: ["consume", "survive"],
    kindKey: "food",
    basedOnDefinitionId: "core.consumable.ration"
  }),
  buildStandardItem({
    id: "builtin.contemporary.coffee-cup",
    name: "Kaffeebecher",
    description: "To-go-Becher f\xFCr Hei\xDFgetr\xE4nke. Rein narrativ.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["office", "social", "domestic"],
    capabilities: ["consume"],
    kindKey: "food",
    type: "misc",
    load: 0,
    cost: 0,
    stackLimit: 1
  }),
  buildStandardItem({
    id: "builtin.contemporary.groceries",
    name: "Lebensmittel",
    description: "Allt\xE4gliche Nahrungsmittel f\xFCr Haushalt und Pause.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["domestic", "survival"],
    capabilities: ["consume"],
    kindKey: "food",
    basedOnDefinitionId: "core.consumable.ration"
  }),
  buildStandardItem({
    id: "builtin.contemporary.kitchen-knife",
    name: "K\xFCchenmesser",
    description: "Alltagsmesser f\xFCr die K\xFCche \u2014 kein Kampffokus.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["domestic"],
    kindKey: "tool",
    type: "tool",
    load: 0,
    cost: 1,
    stackLimit: 1
  }),
  buildStandardItem({
    id: "builtin.contemporary.first-aid-kit",
    name: "Erste-Hilfe-Set",
    description: "Pflaster, Verb\xE4nde und Desinfektion f\xFCr kleine Notf\xE4lle.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["medical", "sports", "survival"],
    capabilities: ["heal"],
    kindKey: "medical",
    basedOnDefinitionId: "core.tool.medical"
  }),
  buildStandardItem({
    id: "builtin.contemporary.medication",
    name: "Medikamente",
    description: "Allgemeine Tabletten oder Tropfen. Verbrauch; Wirkung szenenabh\xE4ngig.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["medical", "domestic"],
    capabilities: ["heal", "consume"],
    kindKey: "medical",
    basedOnDefinitionId: "core.consumable.medical"
  }),
  buildStandardItem({
    id: "builtin.contemporary.toolbox",
    name: "Werkzeugkoffer",
    description: "Kasten mit Schraubenziehern, Zange und Hammern.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["engineering", "domestic"],
    capabilities: ["repair"],
    basedOnDefinitionId: "core.tool.craft"
  }),
  buildStandardItem({
    id: "builtin.contemporary.duct-tape",
    name: "Klebeband",
    description: "Stabiles Gewebeband f\xFCr provisorische Reparaturen.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["engineering", "survival"],
    capabilities: ["repair", "consume"],
    kindKey: "resource",
    basedOnDefinitionId: "core.consumable.repair"
  }),
  buildStandardItem({
    id: "builtin.contemporary.work-gloves",
    name: "Arbeitshandschuhe",
    description: "Schutzhandschuhe f\xFCr Werkstatt und Baustelle.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["engineering"],
    kindKey: "clothing",
    type: "misc",
    load: 0,
    cost: 1,
    stackLimit: 1
  }),
  buildStandardItem({
    id: "builtin.contemporary.work-clothes",
    name: "Arbeitskleidung",
    description: "Robuste Kleidung f\xFCr k\xF6rperliche Arbeit.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["engineering", "domestic"],
    kindKey: "clothing",
    type: "misc",
    load: 1,
    cost: 1,
    stackLimit: 1
  }),
  buildStandardItem({
    id: "builtin.contemporary.bike-helmet",
    name: "Fahrradhelm",
    description: "Kopfschutz f\xFCr Radfahren und \xE4hnliche Aktivit\xE4ten.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["sports", "travel", "urban"],
    kindKey: "clothing",
    basedOnDefinitionId: "core.misc.headgear"
  }),
  buildStandardItem({
    id: "builtin.contemporary.transit-ticket",
    name: "Fahrkarte",
    description: "Ticket f\xFCr Bus, Bahn oder vergleichbaren Nahverkehr. Narrativ.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["travel", "urban"],
    capabilities: ["access"],
    kindKey: "document",
    type: "misc",
    load: 0,
    cost: 0,
    stackLimit: 5
  }),
  buildStandardItem({
    id: "builtin.contemporary.car-keys",
    name: "Autoschl\xFCssel",
    description: "Schl\xFCssel oder Funk\xF6ffner f\xFCr ein Fahrzeug.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["travel", "urban"],
    capabilities: ["access", "unlock"],
    kindKey: "key",
    roles: ["personal", "key-item"],
    type: "misc",
    load: 0,
    cost: 1,
    stackLimit: 1
  }),
  buildStandardItem({
    id: "builtin.contemporary.soccer-ball",
    name: "Fu\xDFball",
    description: "Ball f\xFCr Training und Spiel. Rein narrativ.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["sports", "entertainment"],
    capabilities: ["entertain"],
    kindKey: "sport",
    type: "misc",
    load: 1,
    cost: 1,
    stackLimit: 1
  }),
  buildStandardItem({
    id: "builtin.contemporary.whistle",
    name: "Trillerpfeife",
    description: "Pfeife f\xFCr Schiedsrichter, Training oder Aufmerksamkeit.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["sports"],
    capabilities: ["communicate"],
    kindKey: "sport",
    type: "misc",
    load: 0,
    cost: 0,
    stackLimit: 1
  }),
  buildStandardItem({
    id: "builtin.contemporary.sports-bag",
    name: "Sporttasche",
    description: "Tasche f\xFCr Sportkleidung und Trainingszeug.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["sports", "travel"],
    capabilities: ["carry"],
    kindKey: "sport",
    basedOnDefinitionId: "core.container.bag"
  }),
  buildStandardItem({
    id: "builtin.contemporary.guitar",
    name: "Gitarre",
    description: "Akustik- oder Elektrogitarre f\xFCr Unterhaltung. Rein narrativ.",
    settingTags: SETTING,
    techLevel: TECH,
    contexts: ["entertainment", "social"],
    capabilities: ["entertain"],
    kindKey: "entertainment",
    type: "misc",
    load: 2,
    cost: 3,
    stackLimit: 1
  })
]);
var CONTEMPORARY_BASIC_PACK = Object.freeze({
  id: "builtin:contemporary-basic",
  version: 1,
  name: "Contemporary Basic",
  description: "Kuratierter markenfreier Gegenwarts-Startkatalog: Alltag, B\xFCro, Familie, Sport und Stadt.",
  settingTags: SETTING,
  definitionIds: Object.freeze(CONTEMPORARY_BASIC_DEFINITIONS.map((d) => d.id))
});

// src/domains/items/packs/context-packs.ts
function pack(id, name, description, settingTags, definitionIds) {
  return Object.freeze({
    id,
    version: 1,
    name,
    description,
    settingTags,
    definitionIds: Object.freeze([...definitionIds])
  });
}
var CONTEXT_PACK_ADVENTURE = pack(
  "builtin:context-adventure",
  "Adventure",
  "Reise-, Licht- und Erkundungsgegenst\xE4nde f\xFCr Abenteuerstarts.",
  ["fantasy", "sci-fi"],
  [
    "builtin.fantasy.torch",
    "builtin.fantasy.lantern",
    "builtin.fantasy.rope",
    "builtin.fantasy.grappling-hook",
    "builtin.fantasy.backpack",
    "builtin.fantasy.map",
    "builtin.fantasy.compass",
    "builtin.fantasy.travel-rations",
    "builtin.fantasy.waterskin",
    "builtin.scifi.flashlight",
    "builtin.scifi.navigation-module",
    "builtin.scifi.universal-backpack",
    "builtin.scifi.emergency-ration",
    "builtin.scifi.signal-beacon"
  ]
);
var CONTEXT_PACK_COMBAT = pack(
  "builtin:context-combat",
  "Combat",
  "Waffen, Schutz und Munition ohne Markenbezug.",
  ["fantasy", "sci-fi"],
  [
    "builtin.fantasy.longsword",
    "builtin.fantasy.shortsword",
    "builtin.fantasy.dagger",
    "builtin.fantasy.battle-axe",
    "builtin.fantasy.warhammer",
    "builtin.fantasy.spear",
    "builtin.fantasy.quarterstaff",
    "builtin.fantasy.shortbow",
    "builtin.fantasy.longbow",
    "builtin.fantasy.crossbow",
    "builtin.fantasy.arrows",
    "builtin.fantasy.bolts",
    "builtin.fantasy.light-shield",
    "builtin.fantasy.leather-armor",
    "builtin.fantasy.chainmail",
    "builtin.fantasy.plate-armor",
    "builtin.scifi.compact-energy-weapon",
    "builtin.scifi.standard-energy-weapon",
    "builtin.scifi.heavy-energy-rifle",
    "builtin.scifi.stun-device",
    "builtin.scifi.energy-blade",
    "builtin.scifi.light-protective-suit",
    "builtin.scifi.tactical-protective-suit",
    "builtin.scifi.heavy-protective-suit",
    "builtin.scifi.personal-shield-emitter",
    "builtin.scifi.ammo-pack"
  ]
);
var CONTEXT_PACK_SURVIVAL = pack(
  "builtin:context-survival",
  "Survival",
  "\xDCberleben, Licht, Nahrung und Behelfsmittel.",
  ["fantasy", "sci-fi", "contemporary"],
  [
    "builtin.fantasy.travel-rations",
    "builtin.fantasy.waterskin",
    "builtin.fantasy.torch",
    "builtin.fantasy.rope",
    "builtin.fantasy.blanket",
    "builtin.fantasy.tinderbox",
    "builtin.scifi.emergency-ration",
    "builtin.scifi.water-purifier",
    "builtin.scifi.breathing-apparatus",
    "builtin.scifi.signal-beacon",
    "builtin.scifi.cable-tether",
    "builtin.contemporary.flashlight",
    "builtin.contemporary.lighter",
    "builtin.contemporary.water-bottle",
    "builtin.contemporary.powerbank",
    "builtin.contemporary.duct-tape",
    "builtin.contemporary.first-aid-kit"
  ]
);
var CONTEXT_PACK_MEDICAL = pack(
  "builtin:context-medical",
  "Medical",
  "Heilmittel, Medkits und Antitoxine.",
  ["fantasy", "sci-fi", "contemporary"],
  [
    "builtin.fantasy.healing-potion",
    "builtin.fantasy.antidote",
    "builtin.fantasy.healer-kit",
    "builtin.scifi.medkit",
    "builtin.scifi.hypospray",
    "builtin.scifi.antitoxin",
    "builtin.contemporary.first-aid-kit",
    "builtin.contemporary.medication"
  ]
);
var CONTEXT_PACK_OFFICE = pack(
  "builtin:context-office",
  "Office",
  "B\xFCro- und Arbeitsplatzgegenst\xE4nde der Gegenwart.",
  ["contemporary"],
  [
    "builtin.contemporary.smartphone",
    "builtin.contemporary.laptop",
    "builtin.contemporary.tablet",
    "builtin.contemporary.notebook",
    "builtin.contemporary.ballpoint-pen",
    "builtin.contemporary.document-folder",
    "builtin.contemporary.contract",
    "builtin.contemporary.key-card",
    "builtin.contemporary.id-card",
    "builtin.contemporary.coffee-cup",
    "builtin.contemporary.charger"
  ]
);
var CONTEXT_PACK_DOMESTIC = pack(
  "builtin:context-domestic",
  "Domestic",
  "Haushalts- und Alltagsgegenst\xE4nde.",
  ["contemporary", "fantasy"],
  [
    "builtin.contemporary.groceries",
    "builtin.contemporary.kitchen-knife",
    "builtin.contemporary.shopping-bag",
    "builtin.contemporary.keyring",
    "builtin.contemporary.coffee-cup",
    "builtin.contemporary.medication",
    "builtin.contemporary.lighter",
    "builtin.contemporary.work-clothes",
    "builtin.fantasy.blanket",
    "builtin.fantasy.keyring"
  ]
);
var CONTEXT_PACK_SOCIAL = pack(
  "builtin:context-social",
  "Social",
  "Soziale Requisiten, Kommunikation und Wertgegenst\xE4nde.",
  ["fantasy", "sci-fi", "contemporary"],
  [
    "builtin.contemporary.smartphone",
    "builtin.contemporary.wallet",
    "builtin.contemporary.cash",
    "builtin.contemporary.coffee-cup",
    "builtin.contemporary.contract",
    "builtin.contemporary.guitar",
    "builtin.fantasy.sealed-letter",
    "builtin.fantasy.coin-purse",
    "builtin.fantasy.gemstone",
    "builtin.fantasy.musical-instrument",
    "builtin.scifi.communicator",
    "builtin.scifi.credits",
    "builtin.scifi.encrypted-file"
  ]
);
var CONTEXT_PACK_SPORTS = pack(
  "builtin:context-sports",
  "Sports",
  "Sport- und Trainingsgegenst\xE4nde.",
  ["contemporary"],
  [
    "builtin.contemporary.soccer-ball",
    "builtin.contemporary.whistle",
    "builtin.contemporary.sports-bag",
    "builtin.contemporary.bike-helmet",
    "builtin.contemporary.water-bottle",
    "builtin.contemporary.first-aid-kit"
  ]
);
var CONTEXT_PACK_SCIENCE = pack(
  "builtin:context-science",
  "Science",
  "Analyse-, Proben- und Forschungsausr\xFCstung.",
  ["sci-fi", "fantasy"],
  [
    "builtin.scifi.hand-scanner",
    "builtin.scifi.multi-scanner",
    "builtin.scifi.research-kit",
    "builtin.scifi.sample-container",
    "builtin.scifi.datapad",
    "builtin.scifi.data-chip",
    "builtin.fantasy.book"
  ]
);
var CONTEXT_PACK_ENGINEERING = pack(
  "builtin:context-engineering",
  "Engineering",
  "Werkzeug, Reparaturmaterial und technische Hilfsmittel.",
  ["sci-fi", "fantasy", "contemporary"],
  [
    "builtin.scifi.engineering-kit",
    "builtin.scifi.precision-tools",
    "builtin.scifi.repair-material",
    "builtin.scifi.multitool",
    "builtin.scifi.energy-cell",
    "builtin.scifi.portable-energy-pack",
    "builtin.scifi.cable-tether",
    "builtin.scifi.equipment-bag",
    "builtin.fantasy.craftsman-tools",
    "builtin.contemporary.toolbox",
    "builtin.contemporary.duct-tape",
    "builtin.contemporary.work-gloves",
    "builtin.contemporary.work-clothes"
  ]
);
var CONTEXT_PACK_TRAVEL = pack(
  "builtin:context-travel",
  "Travel",
  "Reisegep\xE4ck, Orientierung und Unterwegs-Versorgung.",
  ["fantasy", "sci-fi", "contemporary"],
  [
    "builtin.fantasy.backpack",
    "builtin.fantasy.map",
    "builtin.fantasy.compass",
    "builtin.fantasy.travel-rations",
    "builtin.scifi.universal-backpack",
    "builtin.scifi.navigation-module",
    "builtin.scifi.emergency-ration",
    "builtin.contemporary.backpack",
    "builtin.contemporary.transit-ticket",
    "builtin.contemporary.car-keys",
    "builtin.contemporary.drivers-license",
    "builtin.contemporary.umbrella",
    "builtin.contemporary.powerbank"
  ]
);
var CONTEXT_PACK_ENTERTAINMENT = pack(
  "builtin:context-entertainment",
  "Entertainment",
  "Unterhaltung und Freizeitrequisiten.",
  ["fantasy", "contemporary"],
  [
    "builtin.fantasy.musical-instrument",
    "builtin.fantasy.book",
    "builtin.contemporary.headphones",
    "builtin.contemporary.guitar",
    "builtin.contemporary.tablet",
    "builtin.contemporary.soccer-ball"
  ]
);
var CONTEXT_PACK_URBAN = pack(
  "builtin:context-urban",
  "Urban",
  "Stadtalltag: Zugang, Zahlung, Mobilit\xE4t.",
  ["contemporary", "fantasy", "sci-fi"],
  [
    "builtin.contemporary.smartphone",
    "builtin.contemporary.wallet",
    "builtin.contemporary.cash",
    "builtin.contemporary.bank-card",
    "builtin.contemporary.id-card",
    "builtin.contemporary.keyring",
    "builtin.contemporary.key-card",
    "builtin.contemporary.transit-ticket",
    "builtin.contemporary.car-keys",
    "builtin.contemporary.umbrella",
    "builtin.contemporary.flashlight",
    "builtin.fantasy.lockpicks",
    "builtin.fantasy.coin-purse",
    "builtin.scifi.access-card",
    "builtin.scifi.identity-module",
    "builtin.scifi.credits"
  ]
);
var CONTEXT_PACK_SPACE = pack(
  "builtin:context-space",
  "Space",
  "Raumfahrt- und EVA-Ausr\xFCstung ohne Franchise-Bezug.",
  ["sci-fi"],
  [
    "builtin.scifi.spacesuit",
    "builtin.scifi.breathing-apparatus",
    "builtin.scifi.signal-beacon",
    "builtin.scifi.cable-tether",
    "builtin.scifi.portable-energy-pack",
    "builtin.scifi.communicator",
    "builtin.scifi.navigation-module",
    "builtin.scifi.energy-cell",
    "builtin.scifi.universal-backpack"
  ]
);
var CONTEXT_PACKS = Object.freeze([
  CONTEXT_PACK_ADVENTURE,
  CONTEXT_PACK_COMBAT,
  CONTEXT_PACK_SURVIVAL,
  CONTEXT_PACK_MEDICAL,
  CONTEXT_PACK_OFFICE,
  CONTEXT_PACK_DOMESTIC,
  CONTEXT_PACK_SOCIAL,
  CONTEXT_PACK_SPORTS,
  CONTEXT_PACK_SCIENCE,
  CONTEXT_PACK_ENGINEERING,
  CONTEXT_PACK_TRAVEL,
  CONTEXT_PACK_ENTERTAINMENT,
  CONTEXT_PACK_URBAN,
  CONTEXT_PACK_SPACE
]);

// src/domains/items/packs/fantasy-basic.ts
var SETTING2 = ["fantasy"];
var TECH2 = "medieval";
var FANTASY_BASIC_DEFINITIONS = Object.freeze([
  buildStandardItem({
    id: "builtin.fantasy.longsword",
    name: "Langschwert",
    description: "Ausgewogenes Einhandschwert f\xFCr den regul\xE4ren Nahkampf.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["combat"],
    capabilities: ["attack"],
    basedOnDefinitionId: "core.weapon.standard-melee"
  }),
  buildStandardItem({
    id: "builtin.fantasy.shortsword",
    name: "Kurzschwert",
    description: "Leichte Klinge f\xFCr enge R\xE4ume und schnelle St\xF6\xDFe.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["combat"],
    capabilities: ["attack"],
    basedOnDefinitionId: "core.weapon.light-melee"
  }),
  buildStandardItem({
    id: "builtin.fantasy.dagger",
    name: "Dolch",
    description: "Kurze Stichwaffe, leicht zu verbergen und im Nahkampf n\xFCtzlich.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["combat"],
    capabilities: ["attack"],
    basedOnDefinitionId: "core.weapon.light-melee"
  }),
  buildStandardItem({
    id: "builtin.fantasy.battle-axe",
    name: "Streitaxt",
    description: "Einhandaxt mit genug Wucht f\xFCr den regul\xE4ren Nahkampf.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["combat"],
    capabilities: ["attack"],
    basedOnDefinitionId: "core.weapon.standard-melee"
  }),
  buildStandardItem({
    id: "builtin.fantasy.warhammer",
    name: "Kriegshammer",
    description: "Zweih\xE4ndiger Hammer mit hoher Wucht gegen gepanzerte Gegner.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["combat"],
    capabilities: ["attack"],
    basedOnDefinitionId: "core.weapon.heavy-melee"
  }),
  buildStandardItem({
    id: "builtin.fantasy.spear",
    name: "Speer",
    description: "Stangenwaffe mit verl\xE4ngerter Reichweite im Nahkampf.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["combat"],
    capabilities: ["attack"],
    basedOnDefinitionId: "core.weapon.reach-melee"
  }),
  buildStandardItem({
    id: "builtin.fantasy.quarterstaff",
    name: "Kampfstab",
    description: "Zweih\xE4ndiger Holzstab mit Reichweite; vielseitig und unauff\xE4llig.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["combat"],
    capabilities: ["attack"],
    basedOnDefinitionId: "core.weapon.reach-melee"
  }),
  buildStandardItem({
    id: "builtin.fantasy.shortbow",
    name: "Kurzbogen",
    description: "Kompakter Bogen f\xFCr kurze bis mittlere Distanz.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["combat"],
    capabilities: ["attack"],
    basedOnDefinitionId: "core.weapon.light-ranged"
  }),
  buildStandardItem({
    id: "builtin.fantasy.longbow",
    name: "Langbogen",
    description: "Klassischer Fernkampfbogen f\xFCr den typischen Schusswechsel.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["combat"],
    capabilities: ["attack"],
    basedOnDefinitionId: "core.weapon.standard-ranged"
  }),
  buildStandardItem({
    id: "builtin.fantasy.crossbow",
    name: "Armbrust",
    description: "Schwere Fernkampfwaffe mit hoher Durchschlagskraft; braucht beide H\xE4nde.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["combat"],
    capabilities: ["attack"],
    basedOnDefinitionId: "core.weapon.heavy-ranged"
  }),
  buildStandardItem({
    id: "builtin.fantasy.arrows",
    name: "Pfeile",
    description: "Geb\xFCndelte Pfeile als Verbrauch f\xFCr Bogenwaffen. Kein eigener Schaden.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["combat"],
    kindKey: "resource",
    basedOnDefinitionId: "core.consumable.general"
  }),
  buildStandardItem({
    id: "builtin.fantasy.bolts",
    name: "Bolzen",
    description: "Armbrustbolzen als Verbrauch. Kein eigener Schaden.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["combat"],
    kindKey: "resource",
    basedOnDefinitionId: "core.consumable.general"
  }),
  buildStandardItem({
    id: "builtin.fantasy.light-shield",
    name: "leichter Schild",
    description: "Tragbarer Holz- oder Lederschild f\xFCr eine Hand.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["combat"],
    capabilities: ["defend"],
    basedOnDefinitionId: "core.shield.standard"
  }),
  buildStandardItem({
    id: "builtin.fantasy.leather-armor",
    name: "Lederharnisch",
    description: "Leichter K\xF6rperschutz aus geh\xE4rtetem Leder ohne starke Einschr\xE4nkung.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["combat"],
    capabilities: ["defend"],
    basedOnDefinitionId: "core.armor.light"
  }),
  buildStandardItem({
    id: "builtin.fantasy.chainmail",
    name: "Kettenhemd",
    description: "Mittlerer K\xF6rperschutz aus verschlungenen Ringen; braucht etwas Kraft.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["combat"],
    capabilities: ["defend"],
    basedOnDefinitionId: "core.armor.medium"
  }),
  buildStandardItem({
    id: "builtin.fantasy.plate-armor",
    name: "Plattenr\xFCstung",
    description: "Schwerer Metallschutz mit maximalem Kern-Schutz; nur mit genug St\xE4rke.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["combat"],
    capabilities: ["defend"],
    basedOnDefinitionId: "core.armor.heavy"
  }),
  buildStandardItem({
    id: "builtin.fantasy.healing-potion",
    name: "Heiltrank",
    description: "Trank f\xFCr medizinische Szenen. Konkrete Wirkung legt Weltprofil oder F\xE4higkeit fest.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["medical", "survival"],
    capabilities: ["heal", "consume"],
    kindKey: "medical",
    basedOnDefinitionId: "core.consumable.medical"
  }),
  buildStandardItem({
    id: "builtin.fantasy.antidote",
    name: "Gegengift",
    description: "Mittel gegen Gifte und Toxine. Verbrauch; Wirkung ist szenenabh\xE4ngig.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["medical"],
    capabilities: ["heal", "consume"],
    kindKey: "medical",
    basedOnDefinitionId: "core.consumable.medical"
  }),
  buildStandardItem({
    id: "builtin.fantasy.travel-rations",
    name: "Reiseproviant",
    description: "Getrocknete Nahrung f\xFCr unterwegs. Verbrauchen reduziert die Menge um 1.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["survival", "travel"],
    capabilities: ["consume", "survive"],
    kindKey: "food",
    basedOnDefinitionId: "core.consumable.ration"
  }),
  buildStandardItem({
    id: "builtin.fantasy.waterskin",
    name: "Wasserschlauch",
    description: "Gef\xFCllter Schlauch mit Trinkwasser f\xFCr die Reise.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["survival", "travel"],
    capabilities: ["consume", "survive"],
    kindKey: "food",
    basedOnDefinitionId: "core.consumable.ration"
  }),
  buildStandardItem({
    id: "builtin.fantasy.torch",
    name: "Fackel",
    description: "Pechgetr\xE4nkte Fackel f\xFCr dunkle G\xE4nge und H\xF6hlen.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["exploration", "survival"],
    capabilities: ["illuminate"],
    basedOnDefinitionId: "core.misc.light-source"
  }),
  buildStandardItem({
    id: "builtin.fantasy.lantern",
    name: "Laterne",
    description: "Gesch\xFCtzte \xD6llaterne; zuverl\xE4ssiger als eine offene Fackel.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["exploration", "survival"],
    capabilities: ["illuminate"],
    basedOnDefinitionId: "core.misc.light-source"
  }),
  buildStandardItem({
    id: "builtin.fantasy.rope",
    name: "Seil",
    description: "Hanfseil zum Klettern, Sichern und Ziehen.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["exploration", "survival"],
    capabilities: ["survive"],
    basedOnDefinitionId: "core.misc.rope"
  }),
  buildStandardItem({
    id: "builtin.fantasy.grappling-hook",
    name: "Enterhaken",
    description: "Haken mit Seilanschluss f\xFCr Kletter- und Enterman\xF6ver.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["exploration"],
    capabilities: ["survive"],
    basedOnDefinitionId: "core.tool.climbing"
  }),
  buildStandardItem({
    id: "builtin.fantasy.backpack",
    name: "Rucksack",
    description: "Lederner Reiserucksack mit Platz f\xFCr Ausr\xFCstung.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["travel", "survival"],
    capabilities: ["carry"],
    basedOnDefinitionId: "core.container.backpack"
  }),
  buildStandardItem({
    id: "builtin.fantasy.belt-pouch",
    name: "G\xFCrteltasche",
    description: "Kleine Tasche am G\xFCrtel f\xFCr M\xFCnzen und Kleinteile.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["travel"],
    capabilities: ["carry"],
    basedOnDefinitionId: "core.container.pouch"
  }),
  buildStandardItem({
    id: "builtin.fantasy.lockpicks",
    name: "Dietrichset",
    description: "Feine Stifte und Haken zum \xD6ffnen einfacher Schl\xF6sser.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["exploration", "urban"],
    capabilities: ["unlock"],
    basedOnDefinitionId: "core.tool.precision"
  }),
  buildStandardItem({
    id: "builtin.fantasy.healer-kit",
    name: "Heilerset",
    description: "Verb\xE4nde, Salben und Nadeln f\xFCr Feldversorgung.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["medical"],
    capabilities: ["heal"],
    kindKey: "medical",
    basedOnDefinitionId: "core.tool.medical"
  }),
  buildStandardItem({
    id: "builtin.fantasy.craftsman-tools",
    name: "Handwerkszeug",
    description: "Hammer, Zange und Feilen f\xFCr Reparatur und Fertigung.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["engineering"],
    capabilities: ["repair"],
    basedOnDefinitionId: "core.tool.craft"
  }),
  buildStandardItem({
    id: "builtin.fantasy.map",
    name: "Karte",
    description: "Handgezeichnete Gebietskarte zur Orientierung.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["travel", "exploration"],
    capabilities: ["navigate"],
    basedOnDefinitionId: "core.tool.navigation"
  }),
  buildStandardItem({
    id: "builtin.fantasy.compass",
    name: "Kompass",
    description: "Magnetnadel zur Himmelsrichtungsbestimmung.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["travel", "exploration"],
    capabilities: ["navigate"],
    basedOnDefinitionId: "core.tool.navigation"
  }),
  buildStandardItem({
    id: "builtin.fantasy.writing-kit",
    name: "Schreibzeug",
    description: "Feder, Tinte und Pergament zum Festhalten von Notizen.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["social", "office"],
    capabilities: ["record"],
    kindKey: "document",
    basedOnDefinitionId: "core.misc.documentation"
  }),
  buildStandardItem({
    id: "builtin.fantasy.sealed-letter",
    name: "versiegelter Brief",
    description: "Verschlossenes Schreiben mit Wachssiegel. Rein narrativ.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["social"],
    roles: ["quest", "evidence"],
    kindKey: "document",
    type: "misc",
    load: 0,
    cost: 0,
    stackLimit: 1
  }),
  buildStandardItem({
    id: "builtin.fantasy.book",
    name: "Buch",
    description: "Gebundenes Werk mit Wissen, Geschichten oder Ritualnotizen.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["science", "entertainment"],
    capabilities: ["research"],
    kindKey: "document",
    basedOnDefinitionId: "core.misc.documentation"
  }),
  buildStandardItem({
    id: "builtin.fantasy.keyring",
    name: "Schl\xFCsselbund",
    description: "Mehrere Schl\xFCssel an einem Ring. \xD6ffnet passende Schl\xF6sser narrativ.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["urban", "domestic"],
    capabilities: ["unlock", "access"],
    kindKey: "key",
    roles: ["key-item"],
    type: "misc",
    load: 0,
    cost: 1,
    stackLimit: 1
  }),
  buildStandardItem({
    id: "builtin.fantasy.coin-purse",
    name: "M\xFCnzbeutel",
    description: "Kleiner Beutel mit M\xFCnzen f\xFCr Handel und Bestechung.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["social", "urban"],
    capabilities: ["trade"],
    kindKey: "currency",
    roles: ["valuable"],
    type: "misc",
    load: 0,
    cost: 1,
    stackLimit: 1
  }),
  buildStandardItem({
    id: "builtin.fantasy.gemstone",
    name: "Edelstein",
    description: "Geschliffener Stein von sp\xFCrbarem Wert. Rein narrativ/wertvoll.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["social"],
    capabilities: ["trade"],
    kindKey: "resource",
    roles: ["valuable", "collectible"],
    type: "misc",
    load: 0,
    cost: 3,
    stackLimit: 5
  }),
  buildStandardItem({
    id: "builtin.fantasy.blanket",
    name: "Decke",
    description: "Wolldecke gegen K\xE4lte bei Nachtlagern.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["survival", "domestic"],
    capabilities: ["survive"],
    basedOnDefinitionId: "core.tool.survival"
  }),
  buildStandardItem({
    id: "builtin.fantasy.tinderbox",
    name: "Zunderzeug",
    description: "Feuerstein, Stahl und Zunder zum Entfachen von Flammen.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["survival"],
    capabilities: ["survive", "illuminate"],
    basedOnDefinitionId: "core.tool.survival"
  }),
  buildStandardItem({
    id: "builtin.fantasy.musical-instrument",
    name: "Musikinstrument",
    description: "Tragbares Instrument f\xFCr Unterhaltung und soziale Szenen.",
    settingTags: SETTING2,
    techLevel: TECH2,
    contexts: ["entertainment", "social"],
    capabilities: ["entertain"],
    kindKey: "entertainment",
    type: "misc",
    load: 1,
    cost: 2,
    stackLimit: 1
  })
]);
var FANTASY_BASIC_PACK = Object.freeze({
  id: "builtin:fantasy-basic",
  version: 1,
  name: "Fantasy Basic",
  description: "Kuratierter markenfreier Fantasy-Startkatalog: Waffen, R\xFCstung, Reise- und Alltagsgegenst\xE4nde.",
  settingTags: SETTING2,
  definitionIds: Object.freeze(FANTASY_BASIC_DEFINITIONS.map((d) => d.id))
});

// src/domains/items/packs/scifi-basic.ts
var SETTING3 = ["sci-fi"];
var TECH3 = "advanced";
var SCIFI_BASIC_DEFINITIONS = Object.freeze([
  buildStandardItem({
    id: "builtin.scifi.compact-energy-weapon",
    name: "kompakte Energiewaffe",
    description: "Handliche Energiewaffe f\xFCr kurze bis mittlere Distanz.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["combat"],
    capabilities: ["attack"],
    basedOnDefinitionId: "core.weapon.light-ranged"
  }),
  buildStandardItem({
    id: "builtin.scifi.standard-energy-weapon",
    name: "Standard-Energiewaffe",
    description: "Regul\xE4re Seitenwaffe f\xFCr den typischen Feuerkampf.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["combat"],
    capabilities: ["attack"],
    basedOnDefinitionId: "core.weapon.standard-ranged"
  }),
  buildStandardItem({
    id: "builtin.scifi.heavy-energy-rifle",
    name: "schweres Energiegewehr",
    description: "Zweih\xE4ndige Energiewaffe mit hoher Durchschlagskraft.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["combat"],
    capabilities: ["attack"],
    basedOnDefinitionId: "core.weapon.heavy-ranged"
  }),
  buildStandardItem({
    id: "builtin.scifi.stun-device",
    name: "Bet\xE4ubungsger\xE4t",
    description: "Nichtt\xF6dliche Nah- oder Fernkampfwaffe zum Ausschalten ohne t\xF6dlichen Schaden.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["combat", "urban"],
    capabilities: ["attack"],
    basedOnDefinitionId: "core.weapon.light-ranged"
  }),
  buildStandardItem({
    id: "builtin.scifi.energy-blade",
    name: "Energieklinge",
    description: "Nahkampfwaffe mit energiegeladenem Schneidefeld.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["combat"],
    capabilities: ["attack"],
    basedOnDefinitionId: "core.weapon.standard-melee"
  }),
  buildStandardItem({
    id: "builtin.scifi.light-protective-suit",
    name: "leichter Schutzanzug",
    description: "Flexible Schutzschicht ohne starke Bewegungseinschr\xE4nkung.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["combat"],
    capabilities: ["defend"],
    kindKey: "armor",
    basedOnDefinitionId: "core.armor.light"
  }),
  buildStandardItem({
    id: "builtin.scifi.tactical-protective-suit",
    name: "taktischer Schutzanzug",
    description: "Ausgewogener K\xF6rperschutz f\xFCr Einsatzteams; braucht etwas Kraft.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["combat"],
    capabilities: ["defend"],
    kindKey: "armor",
    basedOnDefinitionId: "core.armor.medium"
  }),
  buildStandardItem({
    id: "builtin.scifi.heavy-protective-suit",
    name: "schwerer Schutzanzug",
    description: "Schwerer Einsatzanzug mit maximalem Kern-Schutz.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["combat"],
    capabilities: ["defend"],
    kindKey: "armor",
    basedOnDefinitionId: "core.armor.heavy"
  }),
  buildStandardItem({
    id: "builtin.scifi.personal-shield-emitter",
    name: "pers\xF6nlicher Schildemitter",
    description: "Tragbarer Emitter, der wie ein Schild eine Hand belegt.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["combat"],
    capabilities: ["defend"],
    kindKey: "device",
    basedOnDefinitionId: "core.shield.standard"
  }),
  buildStandardItem({
    id: "builtin.scifi.energy-cell",
    name: "Energiezelle",
    description: "Austauschbare Zelle als Betriebsmittel f\xFCr Ger\xE4te und Waffen.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["engineering", "survival"],
    capabilities: ["consume"],
    kindKey: "resource",
    basedOnDefinitionId: "core.consumable.energy"
  }),
  buildStandardItem({
    id: "builtin.scifi.ammo-pack",
    name: "Munitionspack",
    description: "Nachladepack f\xFCr Energiewaffen. Kein eigener Schaden.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["combat"],
    capabilities: ["consume"],
    kindKey: "resource",
    basedOnDefinitionId: "core.consumable.general"
  }),
  buildStandardItem({
    id: "builtin.scifi.medkit",
    name: "Medkit",
    description: "Kompaktes medizinisches Set f\xFCr Feldversorgung.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["medical"],
    capabilities: ["heal"],
    kindKey: "medical",
    basedOnDefinitionId: "core.tool.medical"
  }),
  buildStandardItem({
    id: "builtin.scifi.hypospray",
    name: "Hypospray",
    description: "Injizierbarer medizinischer Verbrauch f\xFCr Akutbehandlung.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["medical"],
    capabilities: ["heal", "consume"],
    kindKey: "medical",
    basedOnDefinitionId: "core.consumable.medical"
  }),
  buildStandardItem({
    id: "builtin.scifi.antitoxin",
    name: "Antitoxin",
    description: "Gegenmittel gegen Toxine und Biogifte. Verbrauch.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["medical"],
    capabilities: ["heal", "consume"],
    kindKey: "medical",
    basedOnDefinitionId: "core.consumable.medical"
  }),
  buildStandardItem({
    id: "builtin.scifi.emergency-ration",
    name: "Notration",
    description: "Komprimierte Nahrung f\xFCr Notlagen und lange Missionen.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["survival", "travel"],
    capabilities: ["consume", "survive"],
    kindKey: "food",
    basedOnDefinitionId: "core.consumable.ration"
  }),
  buildStandardItem({
    id: "builtin.scifi.water-purifier",
    name: "Wasseraufbereiter",
    description: "Kleines Ger\xE4t zur Aufbereitung von Trinkwasser vor Ort.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["survival"],
    capabilities: ["survive"],
    kindKey: "device",
    basedOnDefinitionId: "core.tool.survival"
  }),
  buildStandardItem({
    id: "builtin.scifi.communicator",
    name: "Kommunikator",
    description: "Tragbares Ger\xE4t zur Kommunikation \xFCber Distanz.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["social", "travel"],
    capabilities: ["communicate"],
    kindKey: "device",
    basedOnDefinitionId: "core.misc.communicator"
  }),
  buildStandardItem({
    id: "builtin.scifi.datapad",
    name: "Datapad",
    description: "Tragbarer Datenleser und Notizger\xE4t.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["office", "science"],
    capabilities: ["record", "research"],
    kindKey: "device",
    basedOnDefinitionId: "core.misc.documentation"
  }),
  buildStandardItem({
    id: "builtin.scifi.hand-scanner",
    name: "Handscanner",
    description: "Kompakter Scanner f\xFCr Oberfl\xE4chen und einfache Messungen.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["science", "exploration"],
    capabilities: ["scan", "research"],
    kindKey: "device",
    basedOnDefinitionId: "core.tool.research"
  }),
  buildStandardItem({
    id: "builtin.scifi.multi-scanner",
    name: "Multiscanner",
    description: "Vielseitiges Analyseger\xE4t f\xFCr Umwelt, Material und Biozeichen.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["science", "exploration"],
    capabilities: ["scan", "research"],
    kindKey: "device",
    basedOnDefinitionId: "core.tool.research"
  }),
  buildStandardItem({
    id: "builtin.scifi.navigation-module",
    name: "Navigationsmodul",
    description: "Modul zur Orientierung und Routenplanung in unbekanntem Terrain.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["travel", "exploration"],
    capabilities: ["navigate"],
    kindKey: "device",
    basedOnDefinitionId: "core.tool.navigation"
  }),
  buildStandardItem({
    id: "builtin.scifi.engineering-kit",
    name: "Engineering-Kit",
    description: "Werkzeugsatz f\xFCr Wartung und Feldreparaturen an Technik.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["engineering"],
    capabilities: ["repair"],
    basedOnDefinitionId: "core.tool.repair"
  }),
  buildStandardItem({
    id: "builtin.scifi.precision-tools",
    name: "Pr\xE4zisionswerkzeug",
    description: "Feine Werkzeuge f\xFCr Elektronik und filigrane Arbeit.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["engineering"],
    capabilities: ["repair"],
    basedOnDefinitionId: "core.tool.precision"
  }),
  buildStandardItem({
    id: "builtin.scifi.repair-material",
    name: "Reparaturmaterial",
    description: "Verbrauchsteile und Dichtmittel f\xFCr Reparaturen.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["engineering"],
    capabilities: ["repair", "consume"],
    kindKey: "resource",
    basedOnDefinitionId: "core.consumable.repair"
  }),
  buildStandardItem({
    id: "builtin.scifi.research-kit",
    name: "Forschungskit",
    description: "Instrumente und Probentr\xE4ger f\xFCr Labor- und Feldanalyse.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["science"],
    capabilities: ["research"],
    basedOnDefinitionId: "core.tool.research"
  }),
  buildStandardItem({
    id: "builtin.scifi.sample-container",
    name: "Probenbeh\xE4lter",
    description: "Versiegelbarer Beh\xE4lter f\xFCr Proben und Empfindliches.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["science"],
    capabilities: ["carry", "research"],
    basedOnDefinitionId: "core.container.pouch"
  }),
  buildStandardItem({
    id: "builtin.scifi.flashlight",
    name: "Taschenlampe",
    description: "Kompakte Lichtquelle f\xFCr dunkle Korridore und Au\xDFenarbeiten.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["exploration", "survival"],
    capabilities: ["illuminate"],
    kindKey: "device",
    basedOnDefinitionId: "core.misc.light-source"
  }),
  buildStandardItem({
    id: "builtin.scifi.multitool",
    name: "Multitool",
    description: "Kombiniertes Handwerkzeug f\xFCr allt\xE4gliche technische Aufgaben.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["engineering", "survival"],
    capabilities: ["repair"],
    basedOnDefinitionId: "core.tool.craft"
  }),
  buildStandardItem({
    id: "builtin.scifi.access-card",
    name: "Zugangskarte",
    description: "Berechtigungskarte f\xFCr T\xFCren und Terminals. Narrativ.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["urban", "office"],
    capabilities: ["access", "unlock"],
    kindKey: "key",
    roles: ["key-item"],
    type: "misc",
    load: 0,
    cost: 1,
    stackLimit: 1
  }),
  buildStandardItem({
    id: "builtin.scifi.identity-module",
    name: "Identit\xE4tsmodul",
    description: "Pers\xF6nliches Identifikationsmodul f\xFCr Zugang und Nachweis.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["urban", "social"],
    capabilities: ["access"],
    kindKey: "key",
    roles: ["personal", "key-item"],
    type: "misc",
    load: 0,
    cost: 2,
    stackLimit: 1
  }),
  buildStandardItem({
    id: "builtin.scifi.data-chip",
    name: "Datenchip",
    description: "Kleiner Datentr\xE4ger f\xFCr Dateien und Logs.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["science", "office"],
    capabilities: ["record"],
    kindKey: "document",
    basedOnDefinitionId: "core.misc.documentation"
  }),
  buildStandardItem({
    id: "builtin.scifi.encrypted-file",
    name: "verschl\xFCsselte Datei",
    description: "Gesch\xFCtzte Datenablage. Inhalt und Schl\xFCssel sind narrativ.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["science", "social"],
    capabilities: ["record"],
    kindKey: "document",
    roles: ["evidence", "quest"],
    type: "misc",
    load: 0,
    cost: 1,
    stackLimit: 1
  }),
  buildStandardItem({
    id: "builtin.scifi.credits",
    name: "Credits",
    description: "Digitale oder physische Zahlungseinheit f\xFCr Handel.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["social", "urban"],
    capabilities: ["trade"],
    kindKey: "currency",
    roles: ["valuable"],
    type: "misc",
    load: 0,
    cost: 1,
    stackLimit: 1
  }),
  buildStandardItem({
    id: "builtin.scifi.universal-backpack",
    name: "Universalrucksack",
    description: "Modularer Rucksack f\xFCr Mission und Alltag.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["travel", "survival"],
    capabilities: ["carry"],
    basedOnDefinitionId: "core.container.backpack"
  }),
  buildStandardItem({
    id: "builtin.scifi.equipment-bag",
    name: "Ausr\xFCstungstasche",
    description: "Robuste Tasche f\xFCr Werkzeug und Einsatzmaterial.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["engineering", "travel"],
    capabilities: ["carry"],
    basedOnDefinitionId: "core.container.bag"
  }),
  buildStandardItem({
    id: "builtin.scifi.spacesuit",
    name: "Raumanzug",
    description: "Druckanzug f\xFCr Au\xDFenbordeins\xE4tze und luftlose Umgebungen.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["survival", "exploration"],
    capabilities: ["survive", "defend"],
    kindKey: "clothing",
    basedOnDefinitionId: "core.armor.medium"
  }),
  buildStandardItem({
    id: "builtin.scifi.breathing-apparatus",
    name: "Atemger\xE4t",
    description: "Tragbares Atemsystem f\xFCr toxische oder d\xFCnne Atmosph\xE4ren.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["survival"],
    capabilities: ["survive"],
    kindKey: "device",
    basedOnDefinitionId: "core.tool.survival"
  }),
  buildStandardItem({
    id: "builtin.scifi.signal-beacon",
    name: "Signalgeber",
    description: "Notfallbake zum Aussenden von Ortungs- und Hilfsignalen.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["survival", "travel"],
    capabilities: ["communicate", "survive"],
    kindKey: "device",
    basedOnDefinitionId: "core.misc.special-device"
  }),
  buildStandardItem({
    id: "builtin.scifi.cable-tether",
    name: "Kabel/Leine",
    description: "Sicherungsleine oder Daten-/Energiekabel f\xFCr Arbeit und EVA.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["engineering", "survival"],
    capabilities: ["survive"],
    basedOnDefinitionId: "core.misc.rope"
  }),
  buildStandardItem({
    id: "builtin.scifi.portable-energy-pack",
    name: "tragbarer Energiepack",
    description: "Mobiler Energiespeicher f\xFCr Ger\xE4te und Notstrom.",
    settingTags: SETTING3,
    techLevel: TECH3,
    contexts: ["engineering", "survival"],
    capabilities: ["survive"],
    kindKey: "device",
    basedOnDefinitionId: "core.consumable.energy"
  })
]);
var SCIFI_BASIC_PACK = Object.freeze({
  id: "builtin:scifi-basic",
  version: 1,
  name: "Sci-Fi Basic",
  description: "Kuratierter markenfreier Science-Fiction-Startkatalog: Energieausr\xFCstung, Medizin, Technik und Raumfahrt.",
  settingTags: SETTING3,
  definitionIds: Object.freeze(SCIFI_BASIC_DEFINITIONS.map((d) => d.id))
});

// src/domains/items/packs/index.ts
var FANTASY_BASIC_PACK_ID = "builtin:fantasy-basic";
var SCIFI_BASIC_PACK_ID = "builtin:scifi-basic";
var CONTEMPORARY_BASIC_PACK_ID = "builtin:contemporary-basic";
var BASE_PACKS = Object.freeze([
  FANTASY_BASIC_PACK,
  SCIFI_BASIC_PACK,
  CONTEMPORARY_BASIC_PACK
]);
var ALL_ITEM_PACKS = Object.freeze([
  ...BASE_PACKS,
  ...CONTEXT_PACKS
]);
var BUILTIN_STANDARD_DEFINITIONS = Object.freeze([
  ...FANTASY_BASIC_DEFINITIONS,
  ...SCIFI_BASIC_DEFINITIONS,
  ...CONTEMPORARY_BASIC_DEFINITIONS
]);
var DEFINITION_BY_ID = new Map(
  BUILTIN_STANDARD_DEFINITIONS.map((definition) => [definition.id, definition])
);
var PACK_BY_ID = new Map(
  ALL_ITEM_PACKS.map((pack2) => [pack2.id, pack2])
);
var STRESS_TEST_PACK_COMBINATIONS = Object.freeze([
  {
    id: "fantasy-adventure",
    label: "Fantasy-Abenteuer",
    packIds: Object.freeze([
      FANTASY_BASIC_PACK_ID,
      "builtin:context-adventure",
      "builtin:context-survival"
    ])
  },
  {
    id: "space-scifi",
    label: "Space-Sci-Fi",
    packIds: Object.freeze([
      SCIFI_BASIC_PACK_ID,
      "builtin:context-space",
      "builtin:context-science",
      "builtin:context-engineering",
      "builtin:context-medical"
    ])
  },
  {
    id: "contemporary-office",
    label: "Contemporary Office",
    packIds: Object.freeze([
      CONTEMPORARY_BASIC_PACK_ID,
      "builtin:context-office",
      "builtin:context-social"
    ])
  },
  {
    id: "contemporary-social-domestic",
    label: "Contemporary Social/Domestic",
    packIds: Object.freeze([
      CONTEMPORARY_BASIC_PACK_ID,
      "builtin:context-social",
      "builtin:context-domestic"
    ])
  },
  {
    id: "contemporary-sports",
    label: "Contemporary Sports",
    packIds: Object.freeze([
      CONTEMPORARY_BASIC_PACK_ID,
      "builtin:context-sports",
      "builtin:context-office",
      "builtin:context-medical"
    ])
  },
  {
    id: "contemporary-urban-survival",
    label: "Contemporary Urban/Survival",
    packIds: Object.freeze([
      CONTEMPORARY_BASIC_PACK_ID,
      "builtin:context-urban",
      "builtin:context-survival"
    ])
  }
]);

// src/domains/items/library-query.ts
var EMPTY_ITEM_LIBRARY_FILTERS = Object.freeze({
  kinds: Object.freeze([]),
  settings: Object.freeze([]),
  contexts: Object.freeze([]),
  sources: Object.freeze([]),
  packIds: Object.freeze([])
});

// src/domains/items/assets.ts
var ITEM_THUMBNAIL_MAX_BYTES = 10 * 1024 * 1024;

// src/domains/character/inventory-v2/core-catalog.ts
var CORE_SHARED_ICON_KEYS = Object.freeze({
  "core.weapon.light-melee": "builtin-fantasy-dagger",
  "core.weapon.standard-melee": "builtin-fantasy-longsword",
  "core.weapon.heavy-melee": "builtin-fantasy-warhammer",
  "core.weapon.reach-melee": "builtin-fantasy-spear",
  "core.weapon.light-ranged": "builtin-fantasy-shortbow",
  "core.weapon.standard-ranged": "builtin-fantasy-longbow",
  "core.weapon.heavy-ranged": "builtin-fantasy-crossbow",
  "core.weapon.armor-piercing": "builtin-fantasy-battle-axe",
  "core.armor.light": "builtin-fantasy-leather-armor",
  "core.armor.medium": "builtin-fantasy-chainmail",
  "core.armor.heavy": "builtin-fantasy-plate-armor",
  "core.shield.standard": "builtin-fantasy-light-shield",
  "core.tool.medical": "builtin-fantasy-healer-kit",
  "core.tool.repair": "builtin-contemporary-toolbox",
  "core.tool.precision": "builtin-fantasy-lockpicks",
  "core.tool.survival": "builtin-fantasy-tinderbox",
  "core.tool.climbing": "builtin-fantasy-grappling-hook",
  "core.tool.navigation": "builtin-fantasy-compass",
  "core.tool.research": "builtin-scifi-research-kit",
  "core.tool.craft": "builtin-fantasy-craftsman-tools",
  "core.consumable.medical": "builtin-fantasy-healing-potion",
  "core.consumable.repair": "builtin-scifi-repair-material",
  "core.consumable.ration": "builtin-fantasy-travel-rations",
  "core.consumable.energy": "builtin-scifi-energy-cell",
  "core.consumable.general": "builtin-fantasy-arrows",
  "core.container.pouch": "builtin-fantasy-belt-pouch",
  "core.container.bag": "builtin-contemporary-shopping-bag",
  "core.container.backpack": "builtin-fantasy-backpack",
  "core.container.transport": "builtin-contemporary-sports-bag",
  "core.misc.light-source": "builtin-fantasy-torch",
  "core.misc.rope": "builtin-fantasy-rope",
  "core.misc.documentation": "builtin-fantasy-book",
  "core.misc.communicator": "builtin-contemporary-smartphone",
  "core.misc.headgear": "builtin-contemporary-bike-helmet",
  "core.misc.special-device": "builtin-contemporary-laptop",
  "core.misc.footwear": "core-misc-footwear"
});
function deepFreeze(value) {
  if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}
var CORE_DEFINITIONS_RAW = [
  // --- Weapons (8) ---
  {
    id: "core.weapon.light-melee",
    scope: "core",
    name: "Leichte Nahkampfwaffe",
    description: "Leichte Einhandwaffe f\xFCr enge R\xE4ume und schnelle St\xF6\xDFe. Die konkrete Form \u2014 Messer, Kurzschwert, Schlagstock \u2014 legt das Weltprofil fest.",
    type: "weapon",
    load: 1,
    cost: 1,
    stackLimit: 1,
    equipSlots: ["mainHand", "offHand"],
    damage: "d6+1",
    damageType: "Kinetisch",
    traits: ["Finesse"]
  },
  {
    id: "core.weapon.standard-melee",
    scope: "core",
    name: "Standard-Nahkampfwaffe",
    description: "Ausgewogene Einhandwaffe f\xFCr den regul\xE4ren Nahkampf. Form und Material bestimmt das Weltprofil.",
    type: "weapon",
    load: 1,
    cost: 2,
    stackLimit: 1,
    equipSlots: ["mainHand", "offHand"],
    damage: "d8+2",
    damageType: "Kinetisch"
  },
  {
    id: "core.weapon.heavy-melee",
    scope: "core",
    name: "Schwere Nahkampfwaffe",
    description: "Zweih\xE4ndige Nahkampfwaffe mit hoher Wucht. Ben\xF6tigt beide H\xE4nde und liefert sp\xFCrbar mehr Schaden.",
    type: "weapon",
    load: 2,
    cost: 3,
    stackLimit: 1,
    equipSlots: ["mainHand", "offHand"],
    twoHanded: true,
    damage: "d10+3",
    damageType: "Kinetisch"
  },
  {
    id: "core.weapon.reach-melee",
    scope: "core",
    name: "Reichweiten-Nahkampfwaffe",
    description: "Zweih\xE4ndige Nahkampfwaffe mit verl\xE4ngerter Reichweite. Ideal, wenn Abstand im Nahkampf z\xE4hlt.",
    type: "weapon",
    load: 2,
    cost: 2,
    stackLimit: 1,
    equipSlots: ["mainHand", "offHand"],
    twoHanded: true,
    damage: "d8+2",
    damageType: "Kinetisch",
    traits: ["Reichweite"]
  },
  {
    id: "core.weapon.light-ranged",
    scope: "core",
    name: "Leichte Fernkampfwaffe",
    description: "Kompakte Fernkampfwaffe f\xFCr kurze bis mittlere Distanz. Die konkrete Ausf\xFChrung legt das Weltprofil fest.",
    type: "weapon",
    load: 1,
    cost: 2,
    stackLimit: 1,
    equipSlots: ["mainHand", "offHand"],
    damage: "d6+1",
    damageType: "Kinetisch"
  },
  {
    id: "core.weapon.standard-ranged",
    scope: "core",
    name: "Standard-Fernkampfwaffe",
    description: "Regul\xE4re Fernkampfwaffe f\xFCr den typischen Schusswechsel. Form und Munition bestimmt das Weltprofil.",
    type: "weapon",
    load: 1,
    cost: 3,
    stackLimit: 1,
    equipSlots: ["mainHand", "offHand"],
    damage: "d8+2",
    damageType: "Kinetisch"
  },
  {
    id: "core.weapon.heavy-ranged",
    scope: "core",
    name: "Schwere Fernkampfwaffe",
    description: "Zweih\xE4ndige Fernkampfwaffe mit hoher Durchschlagskraft. Ben\xF6tigt beide H\xE4nde.",
    type: "weapon",
    load: 2,
    cost: 4,
    stackLimit: 1,
    equipSlots: ["mainHand", "offHand"],
    twoHanded: true,
    damage: "d10+3",
    damageType: "Kinetisch"
  },
  {
    id: "core.weapon.armor-piercing",
    scope: "core",
    name: "Durchdringungswaffe",
    description: "Zweih\xE4ndige Waffe, die einen Punkt Schutz ignoriert. Geeignet gegen gepanzerte Ziele.",
    type: "weapon",
    load: 2,
    cost: 4,
    stackLimit: 1,
    equipSlots: ["mainHand", "offHand"],
    twoHanded: true,
    damage: "d8+2",
    damageType: "Kinetisch",
    traits: ["Durchdringung 1"]
  },
  // --- Armor & shield (4) ---
  {
    id: "core.armor.light",
    scope: "core",
    name: "Leichte R\xFCstung",
    description: "Leichter K\xF6rperschutz ohne starke Bewegungseinschr\xE4nkung. Form und Material bestimmt das Weltprofil.",
    type: "armor",
    load: 1,
    cost: 2,
    stackLimit: 1,
    equipSlots: ["body"],
    protection: 1,
    requirements: { minimumStrength: 1 }
  },
  {
    id: "core.armor.medium",
    scope: "core",
    name: "Mittlere R\xFCstung",
    description: "Ausgewogener K\xF6rperschutz f\xFCr Abenteurer, die Standfestigkeit brauchen. Erfordert etwas Kraft.",
    type: "armor",
    load: 2,
    cost: 3,
    stackLimit: 1,
    equipSlots: ["body"],
    protection: 2,
    requirements: { minimumStrength: 2 }
  },
  {
    id: "core.armor.heavy",
    scope: "core",
    name: "Schwere R\xFCstung",
    description: "Schwerer K\xF6rperschutz mit maximalem Kern-Schutz. Nur mit ausreichender St\xE4rke tragbar.",
    type: "armor",
    load: 3,
    cost: 4,
    stackLimit: 1,
    equipSlots: ["body"],
    protection: 3,
    requirements: { minimumStrength: 4 }
  },
  {
    id: "core.shield.standard",
    scope: "core",
    name: "Schild",
    description: "Tragbarer Schild f\xFCr eine Hand. Gew\xE4hrt +1 Verteidigung; die konkrete Bauweise legt das Weltprofil fest.",
    type: "shield",
    load: 1,
    cost: 2,
    stackLimit: 1,
    equipSlots: ["mainHand", "offHand"],
    traits: ["+1 Verteidigung", "1 Hand"]
  },
  // --- Tools (8) ---
  {
    id: "core.tool.medical",
    scope: "core",
    name: "Medizinisches Set",
    description: "Werkzeuge und Verb\xE4nde f\xFCr medizinische Versorgung. Verleiht keinen Zahlenbonus \u2014 die Wirkung kommt aus Fertigkeit und Szene.",
    type: "tool",
    load: 1,
    cost: 2,
    stackLimit: 1
  },
  {
    id: "core.tool.repair",
    scope: "core",
    name: "Reparaturset",
    description: "Werkzeuge zum Flicken von Ger\xE4ten, Fahrzeugen oder Ausr\xFCstung. Ohne impliziten Zahlenbonus.",
    type: "tool",
    load: 1,
    cost: 2,
    stackLimit: 1
  },
  {
    id: "core.tool.precision",
    scope: "core",
    name: "Pr\xE4zisionswerkzeug",
    description: "Feine Werkzeuge f\xFCr Schlosserei, Elektronik oder filigrane Arbeit. Wirkung \xFCber Fertigkeit, nicht \xFCber versteckte Boni.",
    type: "tool",
    load: 1,
    cost: 2,
    stackLimit: 1
  },
  {
    id: "core.tool.survival",
    scope: "core",
    name: "\xDCberlebensset",
    description: "Grundausstattung f\xFCr Lager, Wetter und Wildnis. Kein stillschweigender Zahlenbonus.",
    type: "tool",
    load: 1,
    cost: 2,
    stackLimit: 1
  },
  {
    id: "core.tool.climbing",
    scope: "core",
    name: "Kletterset",
    description: "Seile, Karabiner und Hilfsmittel zum Klettern. Die Probe bleibt Athletik/Akrobatik.",
    type: "tool",
    load: 2,
    cost: 2,
    stackLimit: 1
  },
  {
    id: "core.tool.navigation",
    scope: "core",
    name: "Navigationsset",
    description: "Hilfsmittel zur Orientierung und Routenfindung. Kein automatischer Erfolg auf Navigation.",
    type: "tool",
    load: 1,
    cost: 2,
    stackLimit: 1
  },
  {
    id: "core.tool.research",
    scope: "core",
    name: "Analyse- & Forschungsset",
    description: "Instrumente und Notizhilfen f\xFCr Untersuchung und Analyse. Wirkung \xFCber Ermitteln/Wissen, nicht \xFCber versteckte Boni.",
    type: "tool",
    load: 1,
    cost: 2,
    stackLimit: 1
  },
  {
    id: "core.tool.craft",
    scope: "core",
    name: "Handwerksset",
    description: "Werkzeuge f\xFCr Fertigung und Umbau. Erfindet kein Crafting-Subsystem und keinen Zahlenbonus.",
    type: "tool",
    load: 2,
    cost: 2,
    stackLimit: 1
  },
  // --- Consumables (5) ---
  {
    id: "core.consumable.medical",
    scope: "core",
    name: "Medizinischer Verbrauch",
    description: "Verbrauchsmaterial f\xFCr medizinische Szenen. Verbrauchen reduziert die Menge um 1; konkrete Heilwirkung legt Weltprofil oder F\xE4higkeit fest.",
    type: "consumable",
    load: 0,
    cost: 1,
    stackLimit: 5
  },
  {
    id: "core.consumable.repair",
    scope: "core",
    name: "Reparaturmaterial",
    description: "Verbrauchsmaterial f\xFCr Reparaturen. Verbrauchen reduziert die Menge um 1; kein automatischer Reparaturerfolg.",
    type: "consumable",
    load: 0,
    cost: 1,
    stackLimit: 5
  },
  {
    id: "core.consumable.ration",
    scope: "core",
    name: "Nahrung & Wasser",
    description: "Tagesverpflegung und Trinkwasser. Verbrauchen reduziert die Menge um 1; kein Stillen von anderen Mechaniken.",
    type: "consumable",
    load: 0,
    cost: 1,
    stackLimit: 5
  },
  {
    id: "core.consumable.energy",
    scope: "core",
    name: "Energie- / Betriebsmittel",
    description: "Betriebsmittel f\xFCr Ger\xE4te und Fahrzeuge. Verbrauchen reduziert die Menge um 1; Wirkung ist weltprofilabh\xE4ngig.",
    type: "consumable",
    load: 0,
    cost: 1,
    stackLimit: 5
  },
  {
    id: "core.consumable.general",
    scope: "core",
    name: "Allgemeiner Verbrauch",
    description: "Generisches Verbrauchsmaterial f\xFCr Szenenbedarf. Verbrauchen reduziert die Menge um 1 ohne fest verdrahteten Effekt.",
    type: "consumable",
    load: 0,
    cost: 1,
    stackLimit: 5
  },
  // --- Containers (4) ---
  {
    id: "core.container.pouch",
    scope: "core",
    name: "G\xFCrteltasche",
    description: "Kleine Tasche mit zwei Pl\xE4tzen. Belegt selbst einen Basisslot; Inhalt z\xE4hlt weiterhin zur Last.",
    type: "container",
    load: 0,
    cost: 1,
    stackLimit: 1,
    containerCapacity: 2
  },
  {
    id: "core.container.bag",
    scope: "core",
    name: "Tasche",
    description: "Tragbare Tasche mit vier Pl\xE4tzen. Kein Nesting \u2014 Container d\xFCrfen keine Container enthalten.",
    type: "container",
    load: 1,
    cost: 1,
    stackLimit: 1,
    containerCapacity: 4
  },
  {
    id: "core.container.backpack",
    scope: "core",
    name: "Rucksack",
    description: "Rucksack mit sechs Pl\xE4tzen. Belegt einen Basisslot; Last des Inhalts z\xE4hlt vollst\xE4ndig weiter.",
    type: "container",
    load: 1,
    cost: 2,
    stackLimit: 1,
    containerCapacity: 6
  },
  {
    id: "core.container.transport",
    scope: "core",
    name: "Transportbeh\xE4lter",
    description: "Gro\xDFer Beh\xE4lter mit zehn Pl\xE4tzen f\xFCr sperrige Transporte. Kein Nesting in V1.",
    type: "container",
    load: 2,
    cost: 2,
    stackLimit: 1,
    containerCapacity: 10
  },
  // --- Misc / wearable utility (6) ---
  {
    id: "core.misc.light-source",
    scope: "core",
    name: "Lichtquelle",
    description: "Tragbare Lichtquelle f\xFCr dunkle Orte. Form \u2014 Fackel, Lampe, Glowstick \u2014 legt das Weltprofil fest.",
    type: "misc",
    load: 0,
    cost: 1,
    stackLimit: 3
  },
  {
    id: "core.misc.rope",
    scope: "core",
    name: "Seil / Leine",
    description: "Seil oder Leine f\xFCr Klettern, Sichern und Ziehen. Kein stillschweigender Zahlenbonus.",
    type: "misc",
    load: 1,
    cost: 1,
    stackLimit: 2
  },
  {
    id: "core.misc.documentation",
    scope: "core",
    name: "Dokumentationsmaterial",
    description: "Notizb\xFCcher, Datentr\xE4ger oder vergleichbares Material zum Festhalten von Informationen.",
    type: "misc",
    load: 0,
    cost: 1,
    stackLimit: 3
  },
  {
    id: "core.misc.communicator",
    scope: "core",
    name: "Kommunikationsmittel",
    description: "Ger\xE4t oder Artefakt zur Kommunikation \xFCber Distanz. Die konkrete Realisierung \u2014 mundan, magisch oder technisch \u2014 geh\xF6rt zum Weltprofil.",
    type: "misc",
    load: 0,
    cost: 2,
    stackLimit: 1,
    equipSlots: ["accessory1", "accessory2"]
  },
  {
    id: "core.misc.headgear",
    scope: "core",
    name: "Kopfbedeckung / Schutzhelm",
    description: "Kopfbedeckung oder Helm ohne eigenen Schutzwert. Schutz kommt nur, wenn eine Regel oder F\xE4higkeit ihn ausdr\xFCcklich vergibt.",
    type: "misc",
    load: 1,
    cost: 1,
    stackLimit: 1,
    equipSlots: ["head"]
  },
  {
    id: "core.misc.special-device",
    scope: "core",
    name: "Spezialger\xE4t",
    description: "Universelles Spezialger\xE4t f\xFCr au\xDFergew\xF6hnliche Aufgaben. Mundane, magische oder technische Auspr\xE4gung bestimmt das Weltprofil; kein versteckter Zahlenbonus.",
    type: "misc",
    load: 1,
    cost: 3,
    stackLimit: 1,
    equipSlots: ["special"]
  },
  {
    id: "core.misc.footwear",
    scope: "core",
    name: "Schuhe / Fu\xDFschutz",
    description: "Schuhe, Stiefel oder Fu\xDFschutz ohne eigenen Schutzwert. Schutz kommt nur, wenn eine Regel oder F\xE4higkeit ihn ausdr\xFCcklich vergibt. Nur im F\xFC\xDFe-Slot ausr\xFCstbar.",
    type: "misc",
    load: 1,
    cost: 1,
    stackLimit: 1,
    equipSlots: ["feet"]
  }
];
var CORE_DEFINITIONS = deepFreeze(
  CORE_DEFINITIONS_RAW.map((definition) => {
    const iconKey = CORE_SHARED_ICON_KEYS[definition.id];
    if (!iconKey) {
      throw new Error(`core-catalog: missing shared iconKey for ${definition.id}`);
    }
    return normalizeItemDefinition({ ...definition, iconKey });
  })
);

// src/domains/character/avatar/equipment-visual-contract.ts
var TRANSFORM_CLAMP = {
  position: 5,
  rotation: Math.PI * 2,
  scaleMin: 0.05,
  scaleMax: 5
};

// src/domains/character/avatar/custom-rig-decision-v1.ts
var CUSTOM_RIG_BENCHMARK_SCORE_WEIGHTS = {
  skeletonSemantics: 0.16,
  skinWeights: 0.16,
  animationStability: 0.14,
  runtimeCost: 0.1,
  hardwareFit: 0.08,
  licenseFit: 0.1,
  reproducibility: 0.1,
  selfHostFit: 0.08,
  failureModeClarity: 0.08
};
var FIXTURE_PROFILE = {
  human: "humanoid",
  dwarf: "humanoid",
  alien: "humanoid",
  "gumo-like": "custom-creature",
  "faruk-like": "custom-creature"
};
function weightedRigAggregate(scores) {
  let sum = 0;
  let w = 0;
  for (const axis of Object.keys(
    CUSTOM_RIG_BENCHMARK_SCORE_WEIGHTS
  )) {
    const weight = CUSTOM_RIG_BENCHMARK_SCORE_WEIGHTS[axis];
    sum += scores[axis] * weight;
    w += weight;
  }
  return w > 0 ? Number((sum / w).toFixed(4)) : 0;
}
function cell(pathId, fixtureId, scores, outcome, notesDe) {
  return {
    pathId,
    fixtureId,
    profileKind: FIXTURE_PROFILE[fixtureId],
    scores,
    aggregate: weightedRigAggregate(scores),
    outcome,
    notesDe
  };
}
var CUSTOM_RIG_BENCHMARK_MATRIX_V1 = [
  // meshy-full-rig
  cell("meshy-full-rig", "human", {
    skeletonSemantics: 0.88,
    skinWeights: 0.82,
    animationStability: 0.8,
    runtimeCost: 0.45,
    hardwareFit: 0.55,
    licenseFit: 0.55,
    reproducibility: 0.55,
    selfHostFit: 0.2,
    failureModeClarity: 0.7
  }, "viable", "Humanoide Meshy Auto-Rig gut; Credits/Cloud; Output immer re-analysieren."),
  cell("meshy-full-rig", "dwarf", {
    skeletonSemantics: 0.85,
    skinWeights: 0.78,
    animationStability: 0.78,
    runtimeCost: 0.45,
    hardwareFit: 0.55,
    licenseFit: 0.55,
    reproducibility: 0.55,
    selfHostFit: 0.2,
    failureModeClarity: 0.7
  }, "viable", "Compact-Proportionen ok; Skinweights an Beinen gelegentlich limited."),
  cell("meshy-full-rig", "alien", {
    skeletonSemantics: 0.72,
    skinWeights: 0.7,
    animationStability: 0.68,
    runtimeCost: 0.45,
    hardwareFit: 0.55,
    licenseFit: 0.55,
    reproducibility: 0.55,
    selfHostFit: 0.2,
    failureModeClarity: 0.65
  }, "limited", "Stilisiert humanoid \u2014 oft limited nach Analyzer."),
  cell("meshy-full-rig", "gumo-like", {
    skeletonSemantics: 0.35,
    skinWeights: 0.4,
    animationStability: 0.35,
    runtimeCost: 0.45,
    hardwareFit: 0.55,
    licenseFit: 0.55,
    reproducibility: 0.55,
    selfHostFit: 0.2,
    failureModeClarity: 0.75
  }, "unsuitable", "Custom Form \u2192 falsche Humanoid-Bones; nicht Default."),
  cell("meshy-full-rig", "faruk-like", {
    skeletonSemantics: 0.3,
    skinWeights: 0.35,
    animationStability: 0.3,
    runtimeCost: 0.45,
    hardwareFit: 0.55,
    licenseFit: 0.55,
    reproducibility: 0.55,
    selfHostFit: 0.2,
    failureModeClarity: 0.75
  }, "unsuitable", "Schnecken-/Faruk-Anatomie: Auto-Rig erfindet Humanoid \u2014 fail."),
  // meshy-generate-rig (infra remesh+rig on generate path)
  cell("meshy-generate-rig", "human", {
    skeletonSemantics: 0.86,
    skinWeights: 0.8,
    animationStability: 0.78,
    runtimeCost: 0.4,
    hardwareFit: 0.5,
    licenseFit: 0.55,
    reproducibility: 0.5,
    selfHostFit: 0.2,
    failureModeClarity: 0.68
  }, "viable", "Generate-Pipeline Remesh+Rig; provider-spezifisch, nicht Domain-Begriff."),
  cell("meshy-generate-rig", "dwarf", {
    skeletonSemantics: 0.82,
    skinWeights: 0.76,
    animationStability: 0.75,
    runtimeCost: 0.4,
    hardwareFit: 0.5,
    licenseFit: 0.55,
    reproducibility: 0.5,
    selfHostFit: 0.2,
    failureModeClarity: 0.68
  }, "viable", "Wie full-rig f\xFCr humanoide Generate-Ergebnisse."),
  cell("meshy-generate-rig", "alien", {
    skeletonSemantics: 0.7,
    skinWeights: 0.68,
    animationStability: 0.65,
    runtimeCost: 0.4,
    hardwareFit: 0.5,
    licenseFit: 0.55,
    reproducibility: 0.5,
    selfHostFit: 0.2,
    failureModeClarity: 0.65
  }, "limited", "Generate-Rig oft limited nach Revalidation."),
  cell("meshy-generate-rig", "gumo-like", {
    skeletonSemantics: 0.32,
    skinWeights: 0.38,
    animationStability: 0.32,
    runtimeCost: 0.4,
    hardwareFit: 0.5,
    licenseFit: 0.55,
    reproducibility: 0.5,
    selfHostFit: 0.2,
    failureModeClarity: 0.72
  }, "unsuitable", "Generate-Rig erzwingt Humanoid \u2014 Custom bleibt Original-Rig."),
  cell("meshy-generate-rig", "faruk-like", {
    skeletonSemantics: 0.28,
    skinWeights: 0.32,
    animationStability: 0.28,
    runtimeCost: 0.4,
    hardwareFit: 0.5,
    licenseFit: 0.55,
    reproducibility: 0.5,
    selfHostFit: 0.2,
    failureModeClarity: 0.72
  }, "unsuitable", "Nicht f\xFCr Custom Creature Default."),
  // skintokens-full-rig
  cell("skintokens-full-rig", "human", {
    skeletonSemantics: 0.8,
    skinWeights: 0.78,
    animationStability: 0.75,
    runtimeCost: 0.7,
    hardwareFit: 0.45,
    licenseFit: 0.85,
    reproducibility: 0.7,
    selfHostFit: 0.75,
    failureModeClarity: 0.7
  }, "unavailable", "Self-host Worker in diesem Spike unavailable \u2014 Adapter stub only."),
  cell("skintokens-full-rig", "dwarf", {
    skeletonSemantics: 0.78,
    skinWeights: 0.75,
    animationStability: 0.72,
    runtimeCost: 0.7,
    hardwareFit: 0.45,
    licenseFit: 0.85,
    reproducibility: 0.7,
    selfHostFit: 0.75,
    failureModeClarity: 0.7
  }, "unavailable", "Gleicher Worker-Status."),
  cell("skintokens-full-rig", "alien", {
    skeletonSemantics: 0.65,
    skinWeights: 0.62,
    animationStability: 0.6,
    runtimeCost: 0.7,
    hardwareFit: 0.45,
    licenseFit: 0.85,
    reproducibility: 0.7,
    selfHostFit: 0.75,
    failureModeClarity: 0.68
  }, "unavailable", "Worker unavailable."),
  cell("skintokens-full-rig", "gumo-like", {
    skeletonSemantics: 0.45,
    skinWeights: 0.42,
    animationStability: 0.4,
    runtimeCost: 0.7,
    hardwareFit: 0.45,
    licenseFit: 0.85,
    reproducibility: 0.7,
    selfHostFit: 0.75,
    failureModeClarity: 0.7
  }, "unavailable", "Prior art hoffnungsvoll f\xFCr Custom \u2014 Worker fehlt."),
  cell("skintokens-full-rig", "faruk-like", {
    skeletonSemantics: 0.42,
    skinWeights: 0.4,
    animationStability: 0.38,
    runtimeCost: 0.7,
    hardwareFit: 0.45,
    licenseFit: 0.85,
    reproducibility: 0.7,
    selfHostFit: 0.75,
    failureModeClarity: 0.7
  }, "unavailable", "Nicht produktiv bis Worker optional-adapter."),
  // skintokens-existing-skeleton
  cell("skintokens-existing-skeleton", "human", {
    skeletonSemantics: 0.9,
    skinWeights: 0.85,
    animationStability: 0.82,
    runtimeCost: 0.8,
    hardwareFit: 0.5,
    licenseFit: 0.85,
    reproducibility: 0.75,
    selfHostFit: 0.75,
    failureModeClarity: 0.75
  }, "unavailable", "Existing-skeleton mode: Worker unavailable unless enabled."),
  cell("skintokens-existing-skeleton", "dwarf", {
    skeletonSemantics: 0.88,
    skinWeights: 0.82,
    animationStability: 0.8,
    runtimeCost: 0.8,
    hardwareFit: 0.5,
    licenseFit: 0.85,
    reproducibility: 0.75,
    selfHostFit: 0.75,
    failureModeClarity: 0.75
  }, "unavailable", "Worker unavailable."),
  cell("skintokens-existing-skeleton", "alien", {
    skeletonSemantics: 0.75,
    skinWeights: 0.7,
    animationStability: 0.68,
    runtimeCost: 0.8,
    hardwareFit: 0.5,
    licenseFit: 0.85,
    reproducibility: 0.75,
    selfHostFit: 0.75,
    failureModeClarity: 0.72
  }, "unavailable", "Worker unavailable."),
  cell("skintokens-existing-skeleton", "gumo-like", {
    skeletonSemantics: 0.7,
    skinWeights: 0.65,
    animationStability: 0.62,
    runtimeCost: 0.8,
    hardwareFit: 0.5,
    licenseFit: 0.85,
    reproducibility: 0.75,
    selfHostFit: 0.75,
    failureModeClarity: 0.78
  }, "unavailable", "Beste SkinTokens-Idee f\xFCr Custom \u2014 blocked by unavailable."),
  cell("skintokens-existing-skeleton", "faruk-like", {
    skeletonSemantics: 0.68,
    skinWeights: 0.62,
    animationStability: 0.6,
    runtimeCost: 0.8,
    hardwareFit: 0.5,
    licenseFit: 0.85,
    reproducibility: 0.75,
    selfHostFit: 0.75,
    failureModeClarity: 0.78
  }, "unavailable", "Worker unavailable \u2192 Fallback Import-Existing."),
  // unirig-prior-art (research only)
  cell("unirig-prior-art", "human", {
    skeletonSemantics: 0.75,
    skinWeights: 0.7,
    animationStability: 0.68,
    runtimeCost: 0.55,
    hardwareFit: 0.4,
    licenseFit: 0.5,
    reproducibility: 0.4,
    selfHostFit: 0.45,
    failureModeClarity: 0.55
  }, "unavailable", "Prior art UniRig \u2014 kein SagaTree-Adapter; nicht Default."),
  cell("unirig-prior-art", "dwarf", {
    skeletonSemantics: 0.72,
    skinWeights: 0.68,
    animationStability: 0.65,
    runtimeCost: 0.55,
    hardwareFit: 0.4,
    licenseFit: 0.5,
    reproducibility: 0.4,
    selfHostFit: 0.45,
    failureModeClarity: 0.55
  }, "unavailable", "Research only."),
  cell("unirig-prior-art", "alien", {
    skeletonSemantics: 0.6,
    skinWeights: 0.55,
    animationStability: 0.52,
    runtimeCost: 0.55,
    hardwareFit: 0.4,
    licenseFit: 0.5,
    reproducibility: 0.4,
    selfHostFit: 0.45,
    failureModeClarity: 0.55
  }, "unavailable", "Research only."),
  cell("unirig-prior-art", "gumo-like", {
    skeletonSemantics: 0.55,
    skinWeights: 0.5,
    animationStability: 0.48,
    runtimeCost: 0.55,
    hardwareFit: 0.4,
    licenseFit: 0.5,
    reproducibility: 0.4,
    selfHostFit: 0.45,
    failureModeClarity: 0.55
  }, "unavailable", "Interessant f\xFCr Custom \u2014 kein Adapter."),
  cell("unirig-prior-art", "faruk-like", {
    skeletonSemantics: 0.52,
    skinWeights: 0.48,
    animationStability: 0.45,
    runtimeCost: 0.55,
    hardwareFit: 0.4,
    licenseFit: 0.5,
    reproducibility: 0.4,
    selfHostFit: 0.45,
    failureModeClarity: 0.55
  }, "unavailable", "Research only \u2014 Folgeprojekt, nicht #266 Blocker."),
  // import-existing-rig (always local)
  cell("import-existing-rig", "human", {
    skeletonSemantics: 0.95,
    skinWeights: 0.9,
    animationStability: 0.9,
    runtimeCost: 0.98,
    hardwareFit: 0.95,
    licenseFit: 1,
    reproducibility: 1,
    selfHostFit: 1,
    failureModeClarity: 0.9
  }, "viable", "Vorhandenes Rig behalten + Analyzer \u2014 Prefer when already rigged."),
  cell("import-existing-rig", "dwarf", {
    skeletonSemantics: 0.95,
    skinWeights: 0.9,
    animationStability: 0.9,
    runtimeCost: 0.98,
    hardwareFit: 0.95,
    licenseFit: 1,
    reproducibility: 1,
    selfHostFit: 1,
    failureModeClarity: 0.9
  }, "viable", "Beste lokale Option wenn Import schon geriggt."),
  cell("import-existing-rig", "alien", {
    skeletonSemantics: 0.9,
    skinWeights: 0.85,
    animationStability: 0.85,
    runtimeCost: 0.98,
    hardwareFit: 0.95,
    licenseFit: 1,
    reproducibility: 1,
    selfHostFit: 1,
    failureModeClarity: 0.9
  }, "viable", "Import-Rig + V2 Analyzer."),
  cell("import-existing-rig", "gumo-like", {
    skeletonSemantics: 0.92,
    skinWeights: 0.88,
    animationStability: 0.88,
    runtimeCost: 0.98,
    hardwareFit: 0.95,
    licenseFit: 1,
    reproducibility: 1,
    selfHostFit: 1,
    failureModeClarity: 0.95
  }, "viable", "Custom Default: Original-Rig behalten; Auto-Rig optional."),
  cell("import-existing-rig", "faruk-like", {
    skeletonSemantics: 0.92,
    skinWeights: 0.88,
    animationStability: 0.88,
    runtimeCost: 0.98,
    hardwareFit: 0.95,
    licenseFit: 1,
    reproducibility: 1,
    selfHostFit: 1,
    failureModeClarity: 0.95
  }, "viable", "Custom Default: vorhandenes Rig oder limited Artifact.")
];

// src/domains/character/avatar/modular-generate-decomposition-v1.ts
var SCORE_WEIGHTS = {
  editability: 0.18,
  wardrobeSeparability: 0.16,
  identityFidelity: 0.14,
  cost: 0.1,
  latency: 0.08,
  licenseFit: 0.1,
  reproducibility: 0.12,
  selfHostFit: 0.08,
  complexity: 0.04
};
function weightedAggregate2(scores) {
  let sum = 0;
  for (const axis of Object.keys(SCORE_WEIGHTS)) {
    sum += scores[axis] * SCORE_WEIGHTS[axis];
  }
  return Math.round(sum * 1e3) / 1e3;
}
function cell2(approachId, fixtureId, scores, outcome, notesDe) {
  return {
    approachId,
    fixtureId,
    scores,
    aggregate: weightedAggregate2(scores),
    outcome,
    notesDe
  };
}
var MODULAR_GENERATE_DECOMPOSITION_MATRIX_V1 = [
  cell2(
    "vision-parse-library-body-catalog-wearables",
    "human",
    {
      editability: 0.92,
      wardrobeSeparability: 0.9,
      identityFidelity: 0.78,
      cost: 0.75,
      latency: 0.7,
      licenseFit: 0.95,
      reproducibility: 0.92,
      selfHostFit: 0.85,
      complexity: 0.7
    },
    "viable",
    "Vision/semantic \u2192 kanonischer Body + Katalog-Wearables."
  ),
  cell2(
    "vision-parse-library-body-catalog-wearables",
    "elf",
    {
      editability: 0.9,
      wardrobeSeparability: 0.88,
      identityFidelity: 0.76,
      cost: 0.74,
      latency: 0.68,
      licenseFit: 0.95,
      reproducibility: 0.9,
      selfHostFit: 0.85,
      complexity: 0.68
    },
    "viable",
    "Species-Preset + Identity-Transfer; Wearables katalogisch."
  ),
  cell2(
    "vision-parse-library-body-catalog-wearables",
    "dwarf",
    {
      editability: 0.88,
      wardrobeSeparability: 0.86,
      identityFidelity: 0.74,
      cost: 0.74,
      latency: 0.68,
      licenseFit: 0.95,
      reproducibility: 0.9,
      selfHostFit: 0.85,
      complexity: 0.66
    },
    "viable",
    "Compact family path; Props getrennt."
  ),
  cell2(
    "vision-parse-library-body-catalog-wearables",
    "gumo-like",
    {
      editability: 0.35,
      wardrobeSeparability: 0.4,
      identityFidelity: 0.55,
      cost: 0.7,
      latency: 0.7,
      licenseFit: 0.95,
      reproducibility: 0.88,
      selfHostFit: 0.85,
      complexity: 0.6
    },
    "limited",
    "Ungew\xF6hnliche Anatomie \u2192 Freie Form, nicht falsche Family."
  ),
  cell2(
    "vision-parse-library-body-catalog-wearables",
    "outfit-shirt-pants-boots-prop",
    {
      editability: 0.9,
      wardrobeSeparability: 0.92,
      identityFidelity: 0.72,
      cost: 0.72,
      latency: 0.65,
      licenseFit: 0.95,
      reproducibility: 0.9,
      selfHostFit: 0.85,
      complexity: 0.65
    },
    "viable",
    "Shirt/Pants/Boots aus Katalog; Prop rigid separat."
  ),
  cell2(
    "generate-body-only-catalog-wearables",
    "human",
    {
      editability: 0.8,
      wardrobeSeparability: 0.88,
      identityFidelity: 0.7,
      cost: 0.55,
      latency: 0.55,
      licenseFit: 0.8,
      reproducibility: 0.75,
      selfHostFit: 0.6,
      complexity: 0.55
    },
    "viable",
    "Body generieren + Katalog-Kleidung \u2014 teurer, brauchbar."
  ),
  cell2(
    "generate-body-only-catalog-wearables",
    "outfit-shirt-pants-boots-prop",
    {
      editability: 0.78,
      wardrobeSeparability: 0.9,
      identityFidelity: 0.68,
      cost: 0.5,
      latency: 0.5,
      licenseFit: 0.8,
      reproducibility: 0.72,
      selfHostFit: 0.58,
      complexity: 0.52
    },
    "viable",
    "Outfit bleibt katalogisch \u2014 gute Separabilit\xE4t."
  ),
  cell2(
    "full-mesh-autosplit",
    "outfit-shirt-pants-boots-prop",
    {
      editability: 0.4,
      wardrobeSeparability: 0.35,
      identityFidelity: 0.65,
      cost: 0.45,
      latency: 0.5,
      licenseFit: 0.7,
      reproducibility: 0.4,
      selfHostFit: 0.45,
      complexity: 0.25
    },
    "unsuitable",
    "Auto-Split allein unzuverl\xE4ssig \u2014 nie full modular markieren."
  ),
  cell2(
    "full-mesh-autosplit",
    "human",
    {
      editability: 0.42,
      wardrobeSeparability: 0.38,
      identityFidelity: 0.62,
      cost: 0.48,
      latency: 0.52,
      licenseFit: 0.7,
      reproducibility: 0.42,
      selfHostFit: 0.45,
      complexity: 0.28
    },
    "unsuitable",
    "Bekleideter Blob bleibt limited/monolithic bis validiert."
  ),
  cell2(
    "provider-part-split",
    "human",
    {
      editability: 0.7,
      wardrobeSeparability: 0.75,
      identityFidelity: 0.7,
      cost: 0.5,
      latency: 0.55,
      licenseFit: 0.55,
      reproducibility: 0.5,
      selfHostFit: 0.35,
      complexity: 0.45
    },
    "limited",
    "Adapter-Capability nur \u2014 kein Domain-Contract."
  ),
  cell2(
    "provider-part-split",
    "outfit-shirt-pants-boots-prop",
    {
      editability: 0.68,
      wardrobeSeparability: 0.72,
      identityFidelity: 0.68,
      cost: 0.48,
      latency: 0.52,
      licenseFit: 0.55,
      reproducibility: 0.48,
      selfHostFit: 0.35,
      complexity: 0.42
    },
    "limited",
    "Vendor-Split darf Rollen nicht autoritativ setzen."
  ),
  cell2(
    "free-form-blob",
    "gumo-like",
    {
      editability: 0.2,
      wardrobeSeparability: 0.15,
      identityFidelity: 0.8,
      cost: 0.7,
      latency: 0.75,
      licenseFit: 0.8,
      reproducibility: 0.85,
      selfHostFit: 0.7,
      complexity: 0.85
    },
    "viable",
    "Ehrliche Freie Form \u2014 Custom Creature Original Pfad."
  ),
  cell2(
    "free-form-blob",
    "human",
    {
      editability: 0.25,
      wardrobeSeparability: 0.2,
      identityFidelity: 0.82,
      cost: 0.72,
      latency: 0.78,
      licenseFit: 0.8,
      reproducibility: 0.85,
      selfHostFit: 0.7,
      complexity: 0.88
    },
    "limited",
    "F\xFCr kanonisch editierbar ungeeignet \u2014 nur Degrade-Pfad."
  )
];

// src/domains/character/avatar/avatar-save-export.ts
var AVATAR_SAVE_EXPORT_MAX_BYTES = 150 * 1024 * 1024;

// src/domains/character/avatar/facial-contract.ts
var FACIAL_EMOTION_KEYS = ["neutral", "happy", "angry", "sad"];
var FACIAL_VISEME_KEYS = ["aa", "ih", "ou", "ee", "oh"];
var FACIAL_BLINK_KEY = "blink";
var FACIAL_CANONICAL_KEYS = [
  FACIAL_BLINK_KEY,
  ...FACIAL_EMOTION_KEYS,
  ...FACIAL_VISEME_KEYS
];

// src/domains/character/avatar/avatar-structure-analyzer-v2.ts
var AVATAR_STRUCTURE_ANALYSIS_BOUNDS = {
  maxBytes: 150 * 1024 * 1024,
  maxNodes: 8e3,
  maxMeshes: 2e3,
  maxBones: 1024,
  maxMorphTargets: 512,
  maxSkinnedMeshes: 256,
  maxSkeletons: 16
};

// src/domains/character/avatar/face-tracking-contract.ts
var DEFAULT_FACE_TRACKING_LIMITS = {
  maxYaw: 0.55,
  maxPitch: 0.4,
  maxRoll: 0.35,
  presenceThreshold: 0.45,
  desktopFps: 30,
  mobileFps: 15,
  smooth: 0.35
};
var FACE_TRACKING_QUALITY_PROFILES = {
  desktop: {
    id: "desktop",
    labelDe: "Desktop",
    fpsCap: DEFAULT_FACE_TRACKING_LIMITS.desktopFps,
    enableHeadPose: true,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: true
  },
  mobile: {
    id: "mobile",
    labelDe: "Mobile",
    fpsCap: DEFAULT_FACE_TRACKING_LIMITS.mobileFps,
    enableHeadPose: false,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: false
  }
};

// src/domains/character/avatar/meshy-avatar-job.ts
var MESHY_AVATAR_IMAGE_MAX_BYTES = 4 * 1024 * 1024;

// src/domains/character/avatar/generation/meshy-adapter.ts
var MESHY_BASE_SETTINGS = {
  outputFormat: "glb",
  topology: "triangle"
};
var MESHY_PRESET_FAST = {
  id: "fast",
  labelDe: "Schnell",
  descriptionDe: "Vorschau & Iteration \u2014 g\xFCnstiger, schnellere Feedback-Schleife.",
  version: 1,
  providerId: "meshy",
  settings: {
    ...MESHY_BASE_SETTINGS,
    modelId: "latest",
    geometryQuality: "standard",
    textureQuality: "2k",
    pose: "a-pose",
    imageEnhancement: false,
    pbr: true,
    initialRemesh: true,
    targetPolycount: 4e4,
    keepMaster: false,
    runtimePolycount: 4e4
  }
};
var MESHY_PRESET_RECOMMENDED = {
  id: "recommended",
  labelDe: "Empfohlen",
  descriptionDe: "Beste Balance f\xFCr SagaTree-Hauptcharaktere: High-Detail-Master, danach Runtime-Optimize.",
  version: 1,
  providerId: "meshy",
  settings: {
    ...MESHY_BASE_SETTINGS,
    modelId: "latest",
    geometryQuality: "high",
    textureQuality: "4k",
    pose: "a-pose",
    imageEnhancement: false,
    pbr: true,
    initialRemesh: false,
    targetPolycount: 5e4,
    keepMaster: true,
    runtimePolycount: 5e4
  }
};
var MESHY_PRESET_MAXIMUM = {
  id: "maximum",
  labelDe: "Maximale Qualit\xE4t",
  descriptionDe: "Beste aktuell verf\xFCgbare Meshy-Qualit\xE4t (kann sich mit neuen Modellen \xE4ndern).",
  version: 1,
  providerId: "meshy",
  settings: {
    ...MESHY_BASE_SETTINGS,
    modelId: "latest",
    geometryQuality: "maximum",
    textureQuality: "4k",
    pose: "a-pose",
    imageEnhancement: false,
    pbr: true,
    initialRemesh: false,
    targetPolycount: 5e4,
    keepMaster: true,
    runtimePolycount: 5e4,
    providerExtras: { ultra_mode: true }
  }
};

// src/domains/character/avatar/rigid-equipment-plan.ts
var RIGID_EQUIPMENT_PLAN_VERSION = "SagaTreeRigidEquipmentPlanV1";
function planRigidEquipmentAttaches(input) {
  const available = input.availableAnchors instanceof Set ? input.availableAnchors : new Set(input.availableAnchors);
  const attach = [];
  const keep = /* @__PURE__ */ new Set();
  for (const visual of input.visuals) {
    if (visual.status !== "ready") continue;
    if (visual.attachment !== "rigid") continue;
    if (!visual.assetKey || !visual.anchor || !visual.transform) continue;
    if (!available.has(visual.anchor)) continue;
    keep.add(visual.instanceId);
    attach.push({
      instanceId: visual.instanceId,
      assetKey: visual.assetKey,
      anchor: visual.anchor,
      position: visual.transform.position,
      rotationEuler: visual.transform.rotationEuler,
      scale: visual.transform.scale,
      hideRegions: visual.hideRegions,
      replaceSocket: visual.replaceSocket,
      generation: input.generation
    });
  }
  const previous = input.previousInstanceIds ?? [];
  const detachInstanceIds = previous.filter((id) => !keep.has(id));
  return {
    contractVersion: RIGID_EQUIPMENT_PLAN_VERSION,
    attach,
    detachInstanceIds
  };
}

// src/domains/character/avatar/species-template-models-v1.ts
var SPECIES_TEMPLATE_MODEL_PUBLIC_BASE = "/assets/avatars/species";
var SPECIES_GENDER_MESH_FIDELITY = {
  human: {
    "masculine-read": `${SPECIES_TEMPLATE_MODEL_PUBLIC_BASE}/human-male-quality-20260921-m5-face3.vrm?v=quality5-face3-repro1`,
    "feminine-read": `${SPECIES_TEMPLATE_MODEL_PUBLIC_BASE}/human-female-quality-20260921-f5-face3.vrm?v=quality5-face3-repro1`
  }
};
var SPECIES_GENDER_MESH_PREVIEW = {
  human: {
    "masculine-read": `${SPECIES_TEMPLATE_MODEL_PUBLIC_BASE}/human-preview-lod-v1.vrm?v=preview-lod1`,
    "feminine-read": `${SPECIES_TEMPLATE_MODEL_PUBLIC_BASE}/human-preview-lod-v1.vrm?v=preview-lod1`
  }
};

// src/domains/character/use-cases/avatar-presets.ts
var DEFAULT_HAIR_COLOR = "#000000";
var DEFAULT_SKIN_TONE = "#F5E6D3";
var neutralPreset = {
  id: "humanoid-neutral",
  baseBody: "humanoid-medium",
  head: "neutral-soft",
  ears: "round",
  hair: "short",
  clothing: "casual",
  skinTone: DEFAULT_SKIN_TONE,
  hairColor: DEFAULT_HAIR_COLOR,
  bodySize: 50,
  height: 50
};
var avatarRacePresets = {
  human: {
    ...neutralPreset,
    id: "fantasy-human",
    head: "human-balanced"
  },
  elf: {
    ...neutralPreset,
    id: "fantasy-elf",
    baseBody: "humanoid-tall",
    head: "elf-angular",
    ears: "elf-long",
    hair: "long",
    clothing: "robe",
    skinTone: "#E7C8B1",
    bodySize: 42,
    height: 62
  },
  dwarf: {
    ...neutralPreset,
    id: "fantasy-dwarf",
    baseBody: "humanoid-heavy",
    head: "dwarf-broad",
    ears: "round",
    hair: "braided",
    clothing: "armor",
    hairColor: "#4A2A1C",
    bodySize: 74,
    height: 32
  },
  halfling: {
    ...neutralPreset,
    id: "fantasy-halfling",
    baseBody: "humanoid-short",
    head: "halfling-soft",
    hair: "wild",
    clothing: "leather",
    bodySize: 38,
    height: 26
  },
  orc: {
    ...neutralPreset,
    id: "fantasy-orc",
    baseBody: "humanoid-heavy",
    head: "orc-heavy",
    ears: "orc-pointed",
    hair: "wild",
    clothing: "armor",
    skinTone: "#78966A",
    hairColor: "#211F1C",
    bodySize: 82,
    height: 68
  },
  cyborg: {
    ...neutralPreset,
    id: "scifi-cyborg",
    head: "cyborg-angular",
    ears: "synthetic",
    hair: "short",
    clothing: "armor",
    accessory: "optic-implant",
    skinTone: "#C7C7C7",
    hairColor: "#20242A",
    bodySize: 58,
    height: 56
  },
  alien: {
    ...neutralPreset,
    id: "scifi-alien",
    baseBody: "humanoid-tall",
    head: "alien-oval",
    ears: "none",
    hair: "bald",
    clothing: "robe",
    skinTone: "#86C7B5",
    hairColor: "#213438",
    bodySize: 36,
    height: 72
  }
};
function isLoopbackHostname(hostname) {
  const host = hostname.trim().toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1";
}
function normalizeSafeUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) return void 0;
  if (trimmed.startsWith("/")) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.protocol === "https:") return url.toString();
    if (url.protocol === "http:" && isLoopbackHostname(url.hostname)) {
      return url.toString();
    }
    return void 0;
  } catch {
    return void 0;
  }
}

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

// src/infrastructure/character/avatar/avatar-rigid-equipment-runtime.ts
var MAX_CACHED_GLBS = 8;
var AvatarRigidEquipmentRuntime = class {
  group = new THREE.Group();
  loader = new GLTFLoader();
  attached = /* @__PURE__ */ new Map();
  cache = /* @__PURE__ */ new Map();
  loadTokens = /* @__PURE__ */ new Map();
  generation = 0;
  avatarRoot = null;
  analysis = null;
  resolveUrl;
  disposed = false;
  constructor(resolveUrl = () => null) {
    this.group.name = "saga-rigid-equipment";
    this.resolveUrl = resolveUrl;
  }
  getGroup() {
    return this.group;
  }
  /**
   * Temporarily hide attached rigid equipment and reveal hideTargets for MediaPipe capture.
   * Returns restore() — call in finally. Does not mutate visuals/traits/inventory.
   */
  beginFaceMappingBaseFaceCapture() {
    const hide = [this.group];
    const reveal = [];
    for (const entry of this.attached.values()) {
      hide.push(entry.root);
      for (const target of entry.hideTargets) {
        reveal.push(target);
      }
    }
    return beginFaceMappingBaseFaceCaptureVisibility({ hide, reveal });
  }
  /**
   * Test seam (#421): register a synthetic attached root without GLTF load.
   * Production Auto Mapping never calls this.
   */
  attachSyntheticForFaceMappingCaptureTest(params) {
    this.detach(params.instanceId);
    this.attached.set(params.instanceId, {
      instanceId: params.instanceId,
      root: params.root,
      hideTargets: [...params.hideTargets ?? []],
      generation: this.generation
    });
  }
  setUrlResolver(resolveUrl) {
    this.resolveUrl = resolveUrl;
  }
  bindAvatar(root, analysis) {
    this.clearAll(true);
    this.avatarRoot = root;
    this.analysis = analysis;
    if (root) {
      root.add(this.group);
    }
  }
  /**
   * Apply #158 visuals — only rigid+ready. Missing/incompatible skip silently.
   */
  async applyVisuals(visuals) {
    if (this.disposed) return;
    this.generation += 1;
    const generation = this.generation;
    const available = this.listAvailableAnchors();
    const previous = [...this.attached.keys()];
    const plan = planRigidEquipmentAttaches({
      visuals,
      previousInstanceIds: previous,
      generation,
      availableAnchors: available
    });
    for (const instanceId of plan.detachInstanceIds) {
      this.detach(instanceId);
    }
    await Promise.all(plan.attach.map((op) => this.attachOp(op, generation)));
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.clearAll(true);
    this.cache.clear();
    this.group.removeFromParent();
  }
  listAvailableAnchors() {
    const set = /* @__PURE__ */ new Set();
    const anchors = this.analysis?.rig.anchors;
    if (!anchors) return set;
    for (const [key, name] of Object.entries(anchors)) {
      if (name) set.add(key);
    }
    return set;
  }
  findAnchorObject(anchor) {
    if (!this.avatarRoot || !this.analysis) return null;
    const sourceName = this.analysis.rig.anchors[anchor];
    if (!sourceName) return null;
    let found = null;
    this.avatarRoot.traverse((obj) => {
      if (found) return;
      if (obj.name === sourceName) found = obj;
    });
    return found;
  }
  async attachOp(op, generation) {
    if (this.disposed || generation !== this.generation) return;
    if (!parseItemModel3dAssetKey(op.assetKey)) return;
    const token = (this.loadTokens.get(op.instanceId) ?? 0) + 1;
    this.loadTokens.set(op.instanceId, token);
    const anchorObj = this.findAnchorObject(op.anchor);
    if (!anchorObj) return;
    let template = this.cache.get(op.assetKey);
    if (!template) {
      const url = await this.resolveUrl(op.assetKey);
      const safe = url ? normalizeSafeUrl(url) : void 0;
      if (!safe) return;
      try {
        const gltf = await this.loader.loadAsync(safe);
        if (this.disposed || generation !== this.generation || this.loadTokens.get(op.instanceId) !== token) {
          return;
        }
        template = gltf.scene;
        this.cache.set(op.assetKey, template);
        while (this.cache.size > MAX_CACHED_GLBS) {
          const first = this.cache.keys().next().value;
          if (!first) break;
          this.cache.delete(first);
        }
      } catch {
        return;
      }
    }
    if (this.disposed || generation !== this.generation || this.loadTokens.get(op.instanceId) !== token) {
      return;
    }
    this.detach(op.instanceId);
    const clone = template.clone(true);
    clone.name = `rigid-${op.instanceId}`;
    clone.position.set(op.position[0], op.position[1], op.position[2]);
    clone.rotation.set(op.rotationEuler[0], op.rotationEuler[1], op.rotationEuler[2]);
    clone.scale.set(op.scale[0], op.scale[1], op.scale[2]);
    anchorObj.add(clone);
    const hideTargets = this.applyHideRegions(op.hideRegions);
    this.attached.set(op.instanceId, {
      instanceId: op.instanceId,
      root: clone,
      hideTargets,
      generation
    });
  }
  applyHideRegions(regions) {
    if (!this.avatarRoot) return [];
    const targets = [];
    const hints = regions.filter((r) => r !== "none").map((r) => r.toLowerCase());
    if (hints.length === 0) return targets;
    this.avatarRoot.traverse((obj) => {
      const name = obj.name.toLowerCase();
      if (!hints.some((hint) => name.includes(hint))) return;
      if (!obj.visible) return;
      obj.visible = false;
      targets.push(obj);
    });
    return targets;
  }
  detach(instanceId) {
    const entry = this.attached.get(instanceId);
    if (!entry) return;
    for (const target of entry.hideTargets) {
      target.visible = true;
    }
    entry.root.removeFromParent();
    entry.root.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const mat of mats) mat.dispose();
      }
    });
    this.attached.delete(instanceId);
  }
  clearAll(restoreHide) {
    for (const id of [...this.attached.keys()]) {
      if (!restoreHide) {
        const entry = this.attached.get(id);
        if (entry) entry.hideTargets = [];
      }
      this.detach(id);
    }
  }
};
export {
  AvatarRigidEquipmentRuntime
};
