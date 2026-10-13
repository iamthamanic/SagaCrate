/**
 * normalize-character — Pure normalization for character domain payloads.
 * Location: src/domains/character/use-cases/normalize-character.ts
 */
import { getSagaTreeBackgroundTemplate } from '../../rules/sagatree/background-templates';
import {
  createEmptySagaTreeSkillRanks,
  isSagaTreeArchetypeKey,
  isSagaTreeEssenceKey,
  isSagaTreeSkillKey,
  isSagaTreeSpeciesTraitKey,
  sagaTreeSkillDefinitions,
  type SagaTreeSkillKey,
} from '../../rules/sagatree/character-creation';
import {
  normalizeSagaTreeAttributeAdvances,
  type SagaTreeAttributeAdvances,
} from '../../rules/sagatree/attribute-progression';
import {
  backgroundSkillPointsToTrainedSkills,
  normalizeBackgroundSkillPoints,
  normalizeFreeSkillRanks,
  normalizeSkillAdvances,
  normalizeSpecializationRecords,
} from '../../rules/sagatree/skill-progression';
import {
  getSagaTreeSpeciesTraitOptionCatalog,
  normalizeSagaTreeSpeciesTraitOptionKey,
} from '../../rules/sagatree/species-trait-options';
import type {
  CharacterAttributesDto,
  CharacterAttributeStorageDto,
  ItemDto,
} from '../domain/character.entity';
import type {
  SagaTreeAttributeAdvancesDto,
  SagaTreeBackgroundDto,
  SagaTreeProfileDto,
  SagaTreeSpeciesProfileDto,
  SagaTreeSpeciesTraitDetailsDto,
  SagaTreeSpeciesTraitInstanceDto,
} from '../domain/sagatree-profile.entity';

const DEFAULT_ATTRIBUTES: CharacterAttributesDto = { strength: 4, dexterity: 3, endurance: 3, mind: 2, perception: 2, charisma: 1 };

function clampInteger(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function normalizeAttributes(value?: CharacterAttributeStorageDto): CharacterAttributesDto {
  return {
    strength: typeof value?.strength === 'number' ? value.strength : DEFAULT_ATTRIBUTES.strength,
    dexterity: typeof value?.dexterity === 'number' ? value.dexterity : DEFAULT_ATTRIBUTES.dexterity,
    endurance: typeof value?.endurance === 'number' ? value.endurance : typeof value?.constitution === 'number' ? value.constitution : DEFAULT_ATTRIBUTES.endurance,
    mind: typeof value?.mind === 'number' ? value.mind : typeof value?.intelligence === 'number' ? value.intelligence : DEFAULT_ATTRIBUTES.mind,
    perception: typeof value?.perception === 'number' ? value.perception : typeof value?.wisdom === 'number' ? value.wisdom : DEFAULT_ATTRIBUTES.perception,
    charisma: typeof value?.charisma === 'number' ? value.charisma : DEFAULT_ATTRIBUTES.charisma,
  };
}

export function normalizeSkills(value?: Partial<Record<SagaTreeSkillKey, number>>): Record<SagaTreeSkillKey, number> {
  const result = createEmptySagaTreeSkillRanks();
  for (const skill of sagaTreeSkillDefinitions) {
    const rank = value?.[skill.key];
    if (typeof rank === 'number') result[skill.key] = clampInteger(rank, 0, 5);
  }
  return result;
}

function createEmptyBackground(): SagaTreeBackgroundDto {
  return { name: '', skillPool: [], trainedSkills: [], milieuAccess: '', contact: '', complication: '', communication: '' };
}

function createDefaultSagaTreeProfile(): SagaTreeProfileDto {
  return { speciesTraitInstances: [], backgroundTemplateId: null, background: createEmptyBackground(), drive: 3, momentum: 0 };
}

function normalizeSagaTreeBackground(value?: Partial<SagaTreeBackgroundDto>): SagaTreeBackgroundDto {
  const skillPool = Array.isArray(value?.skillPool) ? value.skillPool.filter(isSagaTreeSkillKey).slice(0, 4) : [];
  const explicitBackgroundSkillPoints = normalizeBackgroundSkillPoints(value?.backgroundSkillPoints, skillPool);
  const hasExplicitBackgroundPoints = Object.keys(explicitBackgroundSkillPoints).length > 0;
  const trainedSkills = hasExplicitBackgroundPoints
    ? backgroundSkillPointsToTrainedSkills(explicitBackgroundSkillPoints)
    : [];
  const specialization = value?.specialization && isSagaTreeSkillKey(value.specialization.skill) && typeof value.specialization.name === 'string'
    ? {
        skill: value.specialization.skill,
        name: value.specialization.name.trim(),
        ...(value.specialization.source === 'background' || value.specialization.source === 'skill-development'
          ? { source: value.specialization.source }
          : {}),
        ...(typeof value.specialization.acquiredAtLevel === 'number'
          ? { acquiredAtLevel: clampInteger(value.specialization.acquiredAtLevel, 1, 20) }
          : {}),
      }
    : undefined;
  return {
    name: typeof value?.name === 'string' ? value.name : '',
    skillPool,
    trainedSkills,
    ...(hasExplicitBackgroundPoints ? { backgroundSkillPoints: explicitBackgroundSkillPoints } : {}),
    specialization,
    milieuAccess: typeof value?.milieuAccess === 'string' ? value.milieuAccess : '',
    contact: typeof value?.contact === 'string' ? value.contact : '',
    complication: typeof value?.complication === 'string' ? value.complication : '',
    communication: typeof value?.communication === 'string' ? value.communication : '',
  };
}

export function normalizeBackgroundTemplateId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  return getSagaTreeBackgroundTemplate(value) ? value : null;
}

function normalizeSpeciesTraitDetails(value: unknown): SagaTreeSpeciesTraitDetailsDto {
  if (!isRecord(value)) return {};
  const result: SagaTreeSpeciesTraitDetailsDto = {};
  for (const [key, detail] of Object.entries(value)) {
    if (!isSagaTreeSpeciesTraitKey(key) || typeof detail !== 'string') continue;
    const normalized = detail.trim();
    if (normalized) result[key] = normalized;
  }
  return result;
}

export function normalizeLegacySpeciesTraitInstances(
  traits: unknown,
  details: unknown,
): SagaTreeSpeciesTraitInstanceDto[] {
  if (!Array.isArray(traits)) return [];
  const normalizedDetails = normalizeSpeciesTraitDetails(details);
  const result: SagaTreeSpeciesTraitInstanceDto[] = [];

  for (const trait of traits) {
    if (!isSagaTreeSpeciesTraitKey(trait)) continue;
    const detail = normalizedDetails[trait];
    const option = detail ? normalizeSagaTreeSpeciesTraitOptionKey(trait, detail) : undefined;
    result.push({
      trait,
      ...(option ? { option } : detail ? { legacyDetail: detail } : {}),
      source: 'species-creation',
      acquiredAtLevel: 1,
    });
  }

  return result;
}

export function normalizeSpeciesTraitInstances(
  value: unknown,
  legacyTraits: unknown,
  legacyDetails: unknown,
): SagaTreeSpeciesTraitInstanceDto[] {
  const candidates: SagaTreeSpeciesTraitInstanceDto[] = [];

  if (Array.isArray(value)) {
    for (const entry of value) {
      if (!isRecord(entry) || typeof entry.trait !== 'string' || !isSagaTreeSpeciesTraitKey(entry.trait)) continue;
      const trait = entry.trait;
      const rawOption = typeof entry.option === 'string' ? entry.option : '';
      const option = rawOption ? normalizeSagaTreeSpeciesTraitOptionKey(trait, rawOption) : undefined;
      const legacyDetail = typeof entry.legacyDetail === 'string' ? entry.legacyDetail.trim() : '';
      candidates.push({
        trait,
        ...(option ? { option } : legacyDetail ? { legacyDetail } : {}),
        source: 'species-creation',
        acquiredAtLevel: typeof entry.acquiredAtLevel === 'number' ? clampInteger(entry.acquiredAtLevel, 1, 20) : 1,
      });
    }
  } else {
    candidates.push(...normalizeLegacySpeciesTraitInstances(legacyTraits, legacyDetails));
  }

  const result: SagaTreeSpeciesTraitInstanceDto[] = [];
  for (const candidate of candidates) {
    const repeatable = Boolean(getSagaTreeSpeciesTraitOptionCatalog(candidate.trait));
    if (!repeatable && result.some((entry) => entry.trait === candidate.trait)) continue;
    if (candidate.option && result.some((entry) => entry.trait === candidate.trait && entry.option === candidate.option)) continue;
    if (!candidate.option && !candidate.legacyDetail && repeatable && result.some((entry) => entry.trait === candidate.trait && !entry.option && !entry.legacyDetail)) continue;
    result.push(candidate);
  }
  return result;
}

export function normalizeSpeciesProfile(value: unknown): SagaTreeSpeciesProfileDto | undefined {
  if (!isRecord(value)) return undefined;
  const name = typeof value.name === 'string' ? value.name.trim() : '';
  if (!name) return undefined;
  return {
    name,
    bodyDescription: typeof value.bodyDescription === 'string' ? value.bodyDescription.trim() : '',
  };
}

export function normalizeOptionalBaseAttributes(value: unknown): CharacterAttributesDto | undefined {
  if (!isRecord(value)) return undefined;
  const keys = ['strength', 'dexterity', 'endurance', 'mind', 'perception', 'charisma'] as const;
  const result = {} as CharacterAttributesDto;
  for (const key of keys) {
    const raw = value[key];
    if (typeof raw !== 'number' || !Number.isFinite(raw)) return undefined;
    result[key] = Math.round(raw);
  }
  return result;
}

function normalizePresetReleaseMode(value: unknown): 'manual' | 'auto' | undefined {
  if (value === 'auto' || value === 'manual') return value;
  return undefined;
}

export function normalizeSagaTreeProfile(value?: Partial<SagaTreeProfileDto> | null): SagaTreeProfileDto {
  if (!value) return createDefaultSagaTreeProfile();
  const baseAttributes = normalizeOptionalBaseAttributes(value.baseAttributes);
  const attributeAdvances = normalizeSagaTreeAttributeAdvances(value.attributeAdvances) as SagaTreeAttributeAdvancesDto;
  const presetReleaseMode = normalizePresetReleaseMode(value.presetReleaseMode);
  const background = normalizeSagaTreeBackground(value.background);
  const freeSkillRanks = normalizeFreeSkillRanks(value.freeSkillRanks);
  const skillAdvances = normalizeSkillAdvances(value.skillAdvances);
  const specializations = normalizeSpecializationRecords(value.specializations);
  const hasFreeSkillRanks = sagaTreeSkillDefinitions.some((skill) => (freeSkillRanks[skill.key] ?? 0) > 0);
  return {
    archetype: value.archetype && isSagaTreeArchetypeKey(value.archetype) ? value.archetype : undefined,
    essence: value.essence && isSagaTreeEssenceKey(value.essence) ? value.essence : undefined,
    speciesTraitInstances: normalizeSpeciesTraitInstances(value.speciesTraitInstances, value.speciesTraits, value.speciesTraitDetails),
    speciesProfile: normalizeSpeciesProfile(value.speciesProfile),
    backgroundTemplateId: normalizeBackgroundTemplateId(value.backgroundTemplateId),
    background,
    archetypeTrainingSkill: value.archetypeTrainingSkill && isSagaTreeSkillKey(value.archetypeTrainingSkill) ? value.archetypeTrainingSkill : undefined,
    ...(hasFreeSkillRanks ? { freeSkillRanks } : {}),
    ...(skillAdvances.length > 0 ? { skillAdvances } : {}),
    ...(specializations.length > 0 ? { specializations } : {}),
    ...(baseAttributes ? { baseAttributes, attributeAdvances } : Object.keys(attributeAdvances).length > 0 ? { attributeAdvances } : {}),
    ...(presetReleaseMode ? { presetReleaseMode } : {}),
    drive: typeof value.drive === 'number' ? clampInteger(value.drive, 0, 5) : 3,
    momentum: typeof value.momentum === 'number' ? clampInteger(value.momentum, 0, 3) : 0,
  };
}

export function normalizeInventory(items?: ItemDto[]): ItemDto[] {
  return (items ?? []).map((item) => ({
    ...item,
    quantity: Math.max(1, Math.round(item.quantity || 1)),
    load: item.load ?? 1,
    traits: item.traits ?? [],
  }));
}

export function normalizeTextBlocks(value: unknown): string[] {
  if (Array.isArray(value)) {
    return Array.from(new Set(
      value
        .filter((entry): entry is string => typeof entry === 'string')
        .map((entry) => entry.trim())
        .filter(Boolean),
    ));
  }
  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized ? [normalized] : [];
  }
  return [];
}

export { isValidSagaTreeAttributeBuild } from '../../rules/sagatree/attribute-progression';
export { normalizeSagaTreeAttributeAdvances };
export type { SagaTreeAttributeAdvances };
