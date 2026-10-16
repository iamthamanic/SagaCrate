/**
 * ensemble-character-identity — Resolve level/species/archetype/essence for hub ensemble rows.
 * Location: src/domains/character/use-cases/ensemble-character-identity.ts
 *
 * Prefers roster meta (owned characters); falls back to Dornhain native pregen by display name
 * so GMs still see party identity for seeded sheets they do not own.
 */
import {
  getCharacterCreationOptionLabel,
  getSagaTreeArchetype,
  getSagaTreeEssence,
  isSagaTreeArchetypeKey,
  isSagaTreeEssenceKey,
  normalizeSagaTreeRaceKey,
  sagaTreeRaceOptions,
  type SagaTreeArchetypeKey,
  type SagaTreeEssenceKey,
} from '../../rules/sagatree/character-creation';
import { getSagaTreeStartingTemplate } from '../../rules/sagatree/starting-templates';
import type { CharacterRosterMetaVm } from '../contracts/character.views';
import { DORNHAIN_PREGEN_SHEETS } from './dornhain-pregen-sheets';

export type EnsembleCharacterIdentityVm = {
  readonly level: number | null;
  readonly speciesLabel: string | null;
  readonly archetypeLabel: string | null;
  readonly essenceLabel: string | null;
  readonly essenceKey: SagaTreeEssenceKey | null;
  readonly archetypeKey: SagaTreeArchetypeKey | null;
};

function emptyIdentity(): EnsembleCharacterIdentityVm {
  return {
    level: null,
    speciesLabel: null,
    archetypeLabel: null,
    essenceLabel: null,
    essenceKey: null,
    archetypeKey: null,
  };
}

function identityFromPregenName(characterName: string): EnsembleCharacterIdentityVm | null {
  const needle = characterName.trim().toLowerCase();
  if (!needle) return null;
  const sheet = DORNHAIN_PREGEN_SHEETS.find(
    (row) => row.displayName.trim().toLowerCase() === needle,
  );
  if (!sheet) return null;
  const template = getSagaTreeStartingTemplate(sheet.startingTemplateKey);
  const essenceKey =
    template?.essence && isSagaTreeEssenceKey(template.essence) ? template.essence : null;
  const archetypeKey =
    template?.archetype && isSagaTreeArchetypeKey(template.archetype)
      ? template.archetype
      : null;
  return {
    level: sheet.level,
    speciesLabel: sheet.raceLabelDe,
    archetypeLabel: sheet.classLabel,
    essenceLabel: essenceKey ? (getSagaTreeEssence(essenceKey)?.label ?? essenceKey) : null,
    essenceKey,
    archetypeKey,
  };
}

function identityFromRoster(row: CharacterRosterMetaVm): EnsembleCharacterIdentityVm {
  const raceKey = row.raceKey ? normalizeSagaTreeRaceKey(row.raceKey) : '';
  const speciesLabel = raceKey
    ? getCharacterCreationOptionLabel(sagaTreeRaceOptions, raceKey)
    : null;
  const essenceKey =
    row.essenceKey && isSagaTreeEssenceKey(row.essenceKey) ? row.essenceKey : null;
  const archetypeKey =
    row.archetypeKey && isSagaTreeArchetypeKey(row.archetypeKey) ? row.archetypeKey : null;
  const archetypeFromKey = archetypeKey
    ? getSagaTreeArchetype(archetypeKey)?.label ?? null
    : null;
  return {
    level: typeof row.level === 'number' && Number.isFinite(row.level) ? row.level : null,
    speciesLabel: speciesLabel && speciesLabel !== raceKey ? speciesLabel : speciesLabel || null,
    archetypeLabel: row.classLabel?.trim() || archetypeFromKey,
    essenceLabel: essenceKey ? (getSagaTreeEssence(essenceKey)?.label ?? essenceKey) : null,
    essenceKey,
    archetypeKey,
  };
}

function hasAnyIdentity(identity: EnsembleCharacterIdentityVm): boolean {
  return Boolean(
    identity.level != null
      || identity.speciesLabel
      || identity.archetypeLabel
      || identity.essenceLabel,
  );
}

/**
 * Merge roster + native pregen fallback into a display identity for one ensemble seat.
 */
export function resolveEnsembleCharacterIdentity(input: {
  characterName: string | null | undefined;
  fromRoster?: CharacterRosterMetaVm | null;
}): EnsembleCharacterIdentityVm | null {
  const name = input.characterName?.trim() ?? '';
  if (!name) return null;

  const fromRoster = input.fromRoster ? identityFromRoster(input.fromRoster) : emptyIdentity();
  if (hasAnyIdentity(fromRoster)) return fromRoster;

  return identityFromPregenName(name);
}

/** Haystack for ensemble full-text filter (account + character + identity). */
export function ensembleMemberSearchHaystack(input: {
  accountDisplayName: string;
  characterName: string | null;
  roleLabel: string;
  identity: EnsembleCharacterIdentityVm | null;
}): string {
  const parts = [
    input.accountDisplayName,
    input.characterName ?? '',
    input.roleLabel,
    input.identity?.level != null ? `Level ${input.identity.level}` : '',
    input.identity?.speciesLabel ?? '',
    input.identity?.archetypeLabel ?? '',
    input.identity?.essenceLabel ?? '',
  ];
  return parts.join(' ').toLowerCase();
}
