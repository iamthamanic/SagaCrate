/**
 * public-resource-id — SagaTree Public ID contract (generate, parse, validate).
 * Location: src/domains/resource-id/public-resource-id.ts
 *
 * Format: PREFIX-XXXXX with alphabet excluding ambiguous O/0/I/1.
 * Public IDs are identifiers, never authorization secrets.
 */

export const PUBLIC_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' as const;

export const PUBLIC_RESOURCE_PREFIXES = {
  saga: 'SA',
  session: 'SE',
  character: 'CH',
  npcCreature: 'NPCC',
  item: 'IT',
  world: 'WO',
  look: 'LK',
  scene: 'SC',
  quest: 'QT',
} as const;

export type PublicResourceKind = keyof typeof PUBLIC_RESOURCE_PREFIXES;

export type PublicResourcePrefix =
  (typeof PUBLIC_RESOURCE_PREFIXES)[PublicResourceKind];

/** Reserved prefixes without persistence in this foundation issue. */
export const RESERVED_PUBLIC_RESOURCE_PREFIXES: ReadonlyArray<PublicResourcePrefix> = [
  PUBLIC_RESOURCE_PREFIXES.scene,
  PUBLIC_RESOURCE_PREFIXES.quest,
];

const PREFIX_BY_VALUE: ReadonlyMap<string, PublicResourceKind> = new Map(
  (Object.entries(PUBLIC_RESOURCE_PREFIXES) as Array<[PublicResourceKind, PublicResourcePrefix]>).map(
    ([kind, prefix]) => [prefix, kind],
  ),
);

const BODY_LENGTH = 5;
const BODY_PATTERN = new RegExp(`^[${PUBLIC_ID_ALPHABET}]{${BODY_LENGTH}}$`);

export type ParsedPublicResourceId = {
  kind: PublicResourceKind;
  prefix: PublicResourcePrefix;
  body: string;
  value: string;
};

function hasLetterAndDigit(body: string): boolean {
  let hasLetter = false;
  let hasDigit = false;
  for (const ch of body) {
    if (ch >= 'A' && ch <= 'Z') hasLetter = true;
    if (ch >= '2' && ch <= '9') hasDigit = true;
  }
  return hasLetter && hasDigit;
}

export function isPublicResourcePrefix(value: string): value is PublicResourcePrefix {
  return PREFIX_BY_VALUE.has(value);
}

export function publicResourceKindForPrefix(
  prefix: string,
): PublicResourceKind | null {
  return PREFIX_BY_VALUE.get(prefix) ?? null;
}

export function isValidPublicIdBody(body: string): boolean {
  return BODY_PATTERN.test(body) && hasLetterAndDigit(body);
}

export function formatPublicResourceId(
  prefix: PublicResourcePrefix,
  body: string,
): string {
  return `${prefix}-${body}`;
}

/**
 * Parse a public resource id. Returns null for invalid shape/prefix/body.
 */
export function parsePublicResourceId(raw: string): ParsedPublicResourceId | null {
  const value = raw.trim().toUpperCase();
  const dash = value.indexOf('-');
  if (dash <= 0 || dash === value.length - 1) return null;

  const prefix = value.slice(0, dash);
  const body = value.slice(dash + 1);
  if (!isPublicResourcePrefix(prefix)) return null;
  if (!isValidPublicIdBody(body)) return null;

  const kind = publicResourceKindForPrefix(prefix);
  if (!kind) return null;

  return {
    kind,
    prefix,
    body,
    value: formatPublicResourceId(prefix, body),
  };
}

export function isValidPublicResourceId(
  raw: string,
  expectedKind?: PublicResourceKind,
): boolean {
  const parsed = parsePublicResourceId(raw);
  if (!parsed) return false;
  if (expectedKind && parsed.kind !== expectedKind) return false;
  return true;
}

export function assertPublicResourceId(
  raw: string,
  expectedKind?: PublicResourceKind,
): ParsedPublicResourceId {
  const parsed = parsePublicResourceId(raw);
  if (!parsed) {
    throw new Error(`Invalid public resource id: ${raw}`);
  }
  if (expectedKind && parsed.kind !== expectedKind) {
    throw new Error(
      `Expected public id kind ${expectedKind}, got ${parsed.kind}: ${raw}`,
    );
  }
  return parsed;
}

/**
 * Cryptographically-strong body generator for tests / client-side retries.
 * Production rows are assigned server-side (migration trigger / RPC).
 */
export function generatePublicIdBody(
  randomByte: (maxExclusive: number) => number = defaultRandomByte,
): string {
  for (let attempt = 0; attempt < 64; attempt += 1) {
    let body = '';
    for (let i = 0; i < BODY_LENGTH; i += 1) {
      body += PUBLIC_ID_ALPHABET[randomByte(PUBLIC_ID_ALPHABET.length)] ?? 'A';
    }
    if (isValidPublicIdBody(body)) return body;
  }
  // Extremely unlikely; force mixed letter+digit.
  return 'A2BC3';
}

export function generatePublicResourceId(
  kind: PublicResourceKind,
  randomByte?: (maxExclusive: number) => number,
): string {
  const prefix = PUBLIC_RESOURCE_PREFIXES[kind];
  return formatPublicResourceId(prefix, generatePublicIdBody(randomByte));
}

/**
 * Deterministic Public ID for in-memory Core/builtin catalog rows (no DB trigger).
 * Same seed always yields the same IT-/NPCC-/… id; not a substitute for server
 * assignment on persisted Personal/World rows.
 */
export function deriveStablePublicResourceId(
  kind: PublicResourceKind,
  seed: string,
): string {
  const prefix = PUBLIC_RESOURCE_PREFIXES[kind];
  const alphabet = PUBLIC_ID_ALPHABET;
  const base = alphabet.length;
  let hash = fnv1a32(`${kind}:${seed.trim()}`);

  for (let attempt = 0; attempt < 64; attempt += 1) {
    let h = (hash + attempt * 0x9e3779b9) >>> 0;
    let body = '';
    for (let i = 0; i < BODY_LENGTH; i += 1) {
      body += alphabet[h % base] ?? 'A';
      h = Math.imul(h ^ (i + 1), 0x01000193) >>> 0;
    }
    if (isValidPublicIdBody(body)) {
      return formatPublicResourceId(prefix, body);
    }
  }
  return formatPublicResourceId(prefix, 'A2BC3');
}

/** FNV-1a 32-bit — stable across JS runtimes for catalog seed hashing. */
function fnv1a32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function defaultRandomByte(maxExclusive: number): number {
  if (maxExclusive <= 0) return 0;
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return (buf[0] ?? 0) % maxExclusive;
  }
  return Math.floor(Math.random() * maxExclusive);
}
