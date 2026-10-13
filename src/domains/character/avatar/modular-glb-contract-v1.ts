/**
 * SagaTree Modular Avatar GLB v1 — pure domain metadata contract (#250).
 * Location: src/domains/character/avatar/modular-glb-contract-v1.ts
 *
 * Validates `extras.sagatree` on glTF nodes/assets. Never trusts foreign extras blindly.
 * Names are human-readable fallback only — machine truth is extras + role enums.
 */

import {
  EQUIPMENT_HIDE_REGIONS,
  type EquipmentHideRegion,
} from './equipment-visual-contract';
import {
  AVATAR_V2_BODY_FAMILIES,
  type AvatarV2BodyFamily,
  isAvatarV2BodyFamily,
} from './composition-contract-v2';
import {
  SAGA_TREE_HUMANOID_ANCHORS,
  type SagaTreeHumanoidAnchorId,
} from './rig-contract';

export const MODULAR_AVATAR_GLB_CONTRACT_VERSION = 'SagaTreeModularAvatarGlbV1' as const;

export const MODULAR_AVATAR_GLB_NODE_ROLES = ['body', 'wearable', 'trait', 'prop'] as const;
export type ModularAvatarGlbNodeRole = (typeof MODULAR_AVATAR_GLB_NODE_ROLES)[number];

export const MODULAR_AVATAR_GLB_SLOTS = [
  'body_base',
  'head',
  'hair',
  'ears',
  'torso',
  'legs',
  'feet',
  'hands',
  'accessory',
  'prop_main',
  'prop_off',
] as const;
export type ModularAvatarGlbSlot = (typeof MODULAR_AVATAR_GLB_SLOTS)[number];

export const MODULAR_AVATAR_GLB_STATUSES = [
  'valid',
  'limited',
  'needs-review',
  'invalid',
] as const;
export type ModularAvatarGlbStatus = (typeof MODULAR_AVATAR_GLB_STATUSES)[number];

/** Machine-readable SagaTree extras blob (glTF extras.sagatree). */
export interface ModularAvatarGlbExtrasV1 {
  contractVersion: typeof MODULAR_AVATAR_GLB_CONTRACT_VERSION;
  role: ModularAvatarGlbNodeRole;
  slot?: ModularAvatarGlbSlot;
  /** Body family hint for wearables/body; custom allowed. */
  bodyFamily?: AvatarV2BodyFamily;
  /** Rigid/prop attachment anchor when role is prop or wearable-rigid. */
  attachmentAnchor?: SagaTreeHumanoidAnchorId;
  hideRegions?: readonly EquipmentHideRegion[];
  /** Optional human label — never used as validation authority. */
  displayName?: string;
}

export interface ModularAvatarGlbNodeDescriptor {
  /** glTF node name — fallback only when extras missing. */
  name?: string;
  extras?: unknown;
}

export interface ModularAvatarGlbValidationIssue {
  code: string;
  path: string;
  messageDe: string;
}

export interface ModularAvatarGlbValidationResult {
  contractVersion: typeof MODULAR_AVATAR_GLB_CONTRACT_VERSION;
  status: ModularAvatarGlbStatus;
  nodes: readonly ModularAvatarGlbExtrasV1[];
  issues: readonly ModularAvatarGlbValidationIssue[];
}

export function isModularAvatarGlbNodeRole(value: unknown): value is ModularAvatarGlbNodeRole {
  return (
    typeof value === 'string' &&
    (MODULAR_AVATAR_GLB_NODE_ROLES as readonly string[]).includes(value)
  );
}

export function isModularAvatarGlbSlot(value: unknown): value is ModularAvatarGlbSlot {
  return typeof value === 'string' && (MODULAR_AVATAR_GLB_SLOTS as readonly string[]).includes(value);
}

function isHideRegion(value: unknown): value is EquipmentHideRegion {
  return typeof value === 'string' && (EQUIPMENT_HIDE_REGIONS as readonly string[]).includes(value);
}

function isAnchor(value: unknown): value is SagaTreeHumanoidAnchorId {
  return (
    typeof value === 'string' && (SAGA_TREE_HUMANOID_ANCHORS as readonly string[]).includes(value)
  );
}

/**
 * Parse a single `extras.sagatree` object. Unknown contract versions → needs-review payload
 * is signaled by returning null + issues (caller aggregates).
 */
export function parseModularAvatarGlbExtras(
  extrasRoot: unknown,
  pathPrefix = 'extras.sagatree',
): {
  extras: ModularAvatarGlbExtrasV1 | null;
  issues: ModularAvatarGlbValidationIssue[];
  versionMismatch: boolean;
} {
  const issues: ModularAvatarGlbValidationIssue[] = [];

  if (extrasRoot === null || extrasRoot === undefined) {
    return { extras: null, issues: [], versionMismatch: false };
  }
  if (typeof extrasRoot !== 'object' || Array.isArray(extrasRoot)) {
    issues.push({
      code: 'extras-not-object',
      path: pathPrefix,
      messageDe: 'extras.sagatree muss ein Objekt sein.',
    });
    return { extras: null, issues, versionMismatch: false };
  }

  const bag = extrasRoot as Record<string, unknown>;
  const sagatree = bag.sagatree !== undefined ? bag.sagatree : bag;
  const root =
    bag.sagatree !== undefined && typeof bag.sagatree === 'object' && !Array.isArray(bag.sagatree)
      ? (bag.sagatree as Record<string, unknown>)
      : bag;

  // Prefer nested extras.sagatree; also accept already-unwrapped objects with contractVersion.
  const meta =
    bag.sagatree !== undefined
      ? root
      : 'contractVersion' in bag || 'role' in bag
        ? bag
        : typeof sagatree === 'object' && sagatree !== null && !Array.isArray(sagatree)
          ? (sagatree as Record<string, unknown>)
          : null;

  if (!meta) {
    issues.push({
      code: 'extras-missing-sagatree',
      path: pathPrefix,
      messageDe: 'Kein gültiges extras.sagatree gefunden.',
    });
    return { extras: null, issues, versionMismatch: false };
  }

  const version = meta.contractVersion;
  if (version !== MODULAR_AVATAR_GLB_CONTRACT_VERSION) {
    issues.push({
      code: 'version-mismatch',
      path: `${pathPrefix}.contractVersion`,
      messageDe: `Unbekannte oder fehlende Modular-GLB-Version (erwartet ${MODULAR_AVATAR_GLB_CONTRACT_VERSION}).`,
    });
    return { extras: null, issues, versionMismatch: true };
  }

  if (!isModularAvatarGlbNodeRole(meta.role)) {
    issues.push({
      code: 'invalid-role',
      path: `${pathPrefix}.role`,
      messageDe: 'role muss body|wearable|trait|prop sein.',
    });
    return { extras: null, issues, versionMismatch: false };
  }

  let slot: ModularAvatarGlbSlot | undefined;
  if (meta.slot !== undefined) {
    if (!isModularAvatarGlbSlot(meta.slot)) {
      issues.push({
        code: 'invalid-slot',
        path: `${pathPrefix}.slot`,
        messageDe: 'Unbekannter Slot — fail-closed.',
      });
    } else {
      slot = meta.slot;
    }
  }

  let bodyFamily: AvatarV2BodyFamily | undefined;
  if (meta.bodyFamily !== undefined) {
    if (!isAvatarV2BodyFamily(meta.bodyFamily)) {
      issues.push({
        code: 'invalid-body-family',
        path: `${pathPrefix}.bodyFamily`,
        messageDe: 'bodyFamily muss standard|compact|heavy|custom sein.',
      });
    } else {
      bodyFamily = meta.bodyFamily;
    }
  }

  let attachmentAnchor: SagaTreeHumanoidAnchorId | undefined;
  if (meta.attachmentAnchor !== undefined) {
    if (!isAnchor(meta.attachmentAnchor)) {
      issues.push({
        code: 'invalid-anchor',
        path: `${pathPrefix}.attachmentAnchor`,
        messageDe: 'attachmentAnchor ist kein kanonischer Humanoid-Anker.',
      });
    } else {
      attachmentAnchor = meta.attachmentAnchor;
    }
  }

  const hideRegions: EquipmentHideRegion[] = [];
  if (meta.hideRegions !== undefined) {
    if (!Array.isArray(meta.hideRegions)) {
      issues.push({
        code: 'invalid-hide-regions',
        path: `${pathPrefix}.hideRegions`,
        messageDe: 'hideRegions muss ein Array sein.',
      });
    } else {
      for (let i = 0; i < meta.hideRegions.length; i += 1) {
        const region = meta.hideRegions[i];
        if (!isHideRegion(region)) {
          issues.push({
            code: 'invalid-hide-region',
            path: `${pathPrefix}.hideRegions[${i}]`,
            messageDe: 'Unbekannte Hide-Region — ignoriert/fehlgeschlagen.',
          });
        } else {
          hideRegions.push(region);
        }
      }
    }
  }

  // Hard fail if role invalid already returned; soft issues on optional fields → still emit extras
  // only when no hard issues beyond optionals. Invalid optional fields already recorded —
  // if any invalid-* on optionals, drop extras and fail-closed for that node.
  const hardOptional = issues.some((issue) =>
    ['invalid-slot', 'invalid-body-family', 'invalid-anchor', 'invalid-hide-regions', 'invalid-hide-region'].includes(
      issue.code,
    ),
  );
  if (hardOptional) {
    return { extras: null, issues, versionMismatch: false };
  }

  const extras: ModularAvatarGlbExtrasV1 = {
    contractVersion: MODULAR_AVATAR_GLB_CONTRACT_VERSION,
    role: meta.role,
    ...(slot ? { slot } : {}),
    ...(bodyFamily ? { bodyFamily } : {}),
    ...(attachmentAnchor ? { attachmentAnchor } : {}),
    ...(hideRegions.length > 0 ? { hideRegions } : {}),
    ...(typeof meta.displayName === 'string' ? { displayName: meta.displayName } : {}),
  };

  return { extras, issues, versionMismatch: false };
}

/**
 * Validate a list of node descriptors (from analyzer or fixtures).
 * Missing extras on all nodes → limited (heuristic path later), not invalid.
 * Any version mismatch → needs-review.
 * Any invalid extras object → invalid.
 */
export function validateModularAvatarGlbNodes(
  nodes: readonly ModularAvatarGlbNodeDescriptor[],
): ModularAvatarGlbValidationResult {
  const issues: ModularAvatarGlbValidationIssue[] = [];
  const parsedNodes: ModularAvatarGlbExtrasV1[] = [];
  let versionMismatch = false;
  let invalidExtras = false;
  let extrasPresent = 0;

  nodes.forEach((node, index) => {
    const path = `nodes[${index}]`;
    if (node.extras === undefined || node.extras === null) {
      return;
    }
    extrasPresent += 1;
    const result = parseModularAvatarGlbExtras(node.extras, `${path}.extras`);
    issues.push(...result.issues);
    if (result.versionMismatch) versionMismatch = true;
    if (!result.extras && result.issues.length > 0) invalidExtras = true;
    if (result.extras) parsedNodes.push(result.extras);
  });

  let status: ModularAvatarGlbStatus = 'valid';
  if (nodes.length === 0) {
    status = 'invalid';
    issues.push({
      code: 'empty-nodes',
      path: 'nodes',
      messageDe: 'Keine Nodes zum Validieren.',
    });
  } else if (versionMismatch) {
    status = 'needs-review';
  } else if (invalidExtras) {
    status = 'invalid';
  } else if (extrasPresent === 0) {
    status = 'limited';
    issues.push({
      code: 'no-sagatree-extras',
      path: 'nodes',
      messageDe: 'Keine extras.sagatree — Analyzer darf nur heuristisch ableiten.',
    });
  } else if (parsedNodes.every((node) => node.role !== 'body')) {
    status = 'limited';
    issues.push({
      code: 'missing-body-role',
      path: 'nodes',
      messageDe: 'Kein Node mit role=body — Body_Base empfohlen.',
    });
  }

  return {
    contractVersion: MODULAR_AVATAR_GLB_CONTRACT_VERSION,
    status,
    nodes: parsedNodes,
    issues,
  };
}

/** Canonical allowed role/slot pairs for docs + fixtures. */
export const MODULAR_AVATAR_GLB_ROLE_SLOT_HINTS: Readonly<
  Record<ModularAvatarGlbNodeRole, readonly ModularAvatarGlbSlot[]>
> = {
  body: ['body_base'],
  wearable: ['torso', 'legs', 'feet', 'hands', 'head'],
  trait: ['hair', 'ears', 'head', 'accessory'],
  prop: ['prop_main', 'prop_off', 'accessory'],
};

export { AVATAR_V2_BODY_FAMILIES, EQUIPMENT_HIDE_REGIONS, SAGA_TREE_HUMANOID_ANCHORS };
