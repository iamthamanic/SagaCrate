import type { CharacterAttributesDto } from '../../../character/domain/character.entity';
import { isSagaTreeAttributeKey, type SagaTreeAttributeKey } from '../character-creation';

export const SAGA_TREE_START_ATTRIBUTE_BONUS_BUDGET = 15;
export const SAGA_TREE_START_ATTRIBUTE_BONUS_MIN = 0;
export const SAGA_TREE_START_ATTRIBUTE_BONUS_CAP = 4;
export const SAGA_TREE_ATTRIBUTE_BONUS_CAP = 5;
export const SAGA_TREE_ATTRIBUTE_ADVANCE_LEVELS = [8, 16] as const;

export type SagaTreeAttributeAdvanceLevel = (typeof SAGA_TREE_ATTRIBUTE_ADVANCE_LEVELS)[number];
export type SagaTreeAttributeAdvances = Partial<Record<SagaTreeAttributeAdvanceLevel, SagaTreeAttributeKey>>;

export type SagaTreePersistedAttributeBuild = {
  baseAttributes?: CharacterAttributesDto;
  attributeAdvances?: SagaTreeAttributeAdvances;
};

export type SagaTreeResolvedAttributeBuild = {
  baseAttributes: CharacterAttributesDto;
  attributeAdvances: SagaTreeAttributeAdvances;
};

export function getSagaTreeAttributeAdvanceLevels(level: number): readonly SagaTreeAttributeAdvanceLevel[] {
  const normalizedLevel = Math.min(20, Math.max(1, Math.round(level)));
  return SAGA_TREE_ATTRIBUTE_ADVANCE_LEVELS.filter((advanceLevel) => normalizedLevel >= advanceLevel);
}

export function getSagaTreeAttributeAdvanceBudget(level: number): number {
  return getSagaTreeAttributeAdvanceLevels(level).length;
}

export function getSagaTreeBaseAttributePointsUsed(attributes: CharacterAttributesDto): number {
  return Object.values(attributes).reduce((sum, value) => sum + value, 0);
}

export function isValidSagaTreeBaseAttributeDistribution(attributes: CharacterAttributesDto): boolean {
  const values = Object.values(attributes);
  return values.every((value) => Number.isInteger(value) && value >= SAGA_TREE_START_ATTRIBUTE_BONUS_MIN && value <= SAGA_TREE_START_ATTRIBUTE_BONUS_CAP)
    && getSagaTreeBaseAttributePointsUsed(attributes) === SAGA_TREE_START_ATTRIBUTE_BONUS_BUDGET;
}

export function applySagaTreeAttributeAdvances(
  baseAttributes: CharacterAttributesDto,
  advances: SagaTreeAttributeAdvances,
  level: number,
): CharacterAttributesDto {
  const result = { ...baseAttributes };
  for (const advanceLevel of getSagaTreeAttributeAdvanceLevels(level)) {
    const attribute = advances[advanceLevel];
    if (!attribute) continue;
    result[attribute] += 1;
  }
  return result;
}

export function isValidSagaTreeAttributeBuild(
  baseAttributes: CharacterAttributesDto,
  advances: SagaTreeAttributeAdvances,
  level: number,
): boolean {
  if (!isValidSagaTreeBaseAttributeDistribution(baseAttributes)) return false;

  const requiredLevels = getSagaTreeAttributeAdvanceLevels(level);
  if (requiredLevels.some((advanceLevel) => !advances[advanceLevel])) return false;

  const finalAttributes = applySagaTreeAttributeAdvances(baseAttributes, advances, level);
  return Object.values(finalAttributes).every((value) => value <= SAGA_TREE_ATTRIBUTE_BONUS_CAP);
}

/** Normalize persisted advance map (JSON keys may be strings). Unknown keys are dropped. */
export function normalizeSagaTreeAttributeAdvances(value: unknown): SagaTreeAttributeAdvances {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  const result: SagaTreeAttributeAdvances = {};
  for (const advanceLevel of SAGA_TREE_ATTRIBUTE_ADVANCE_LEVELS) {
    const raw = record[String(advanceLevel)] ?? record[advanceLevel as unknown as string];
    if (typeof raw === 'string' && isSagaTreeAttributeKey(raw)) result[advanceLevel] = raw;
  }
  return result;
}

/**
 * Reconstruct editor state from persisted profile + final attributes.
 * Old profiles without baseAttributes: treat current attributes as base, advances empty.
 */
export function resolveSagaTreeAttributeBuildState(
  finalAttributes: CharacterAttributesDto,
  persisted?: SagaTreePersistedAttributeBuild | null,
): SagaTreeResolvedAttributeBuild {
  if (persisted?.baseAttributes) {
    return {
      baseAttributes: { ...persisted.baseAttributes },
      attributeAdvances: { ...(persisted.attributeAdvances ?? {}) },
    };
  }
  return {
    baseAttributes: { ...finalAttributes },
    attributeAdvances: {},
  };
}

export function canAssignSagaTreeAttributeAdvance(
  baseAttributes: CharacterAttributesDto,
  advances: SagaTreeAttributeAdvances,
  level: number,
  advanceLevel: SagaTreeAttributeAdvanceLevel,
  attribute: SagaTreeAttributeKey,
): boolean {
  if (level < advanceLevel) return false;
  const candidate = { ...advances, [advanceLevel]: attribute };
  const finalAttributes = applySagaTreeAttributeAdvances(baseAttributes, candidate, level);
  return finalAttributes[attribute] <= SAGA_TREE_ATTRIBUTE_BONUS_CAP;
}

export type SagaTreeAttributeBonusLevelGuideEntry = {
  levelLabel: string;
  maxBonus: number;
  description: string;
};

function formatSagaTreeAttributeBonusLevelLabel(minLevel: number, maxLevel: number): string {
  if (minLevel === maxLevel) return String(minLevel);
  if (maxLevel >= 20) return `${minLevel}+`;
  return `${minLevel}–${maxLevel}`;
}

/** Gruppierte Übersicht: nur Level-Bereiche mit geändertem Bonus-Cap oder neuer permanenter Entwicklung. */
export function getSagaTreeAttributeBonusLevelGuide(): readonly SagaTreeAttributeBonusLevelGuideEntry[] {
  const [firstAdvanceLevel, secondAdvanceLevel] = SAGA_TREE_ATTRIBUTE_ADVANCE_LEVELS;
  return [
    {
      levelLabel: formatSagaTreeAttributeBonusLevelLabel(1, firstAdvanceLevel - 1),
      maxBonus: SAGA_TREE_START_ATTRIBUTE_BONUS_CAP,
      description: 'Basisverteilung',
    },
    {
      levelLabel: formatSagaTreeAttributeBonusLevelLabel(firstAdvanceLevel, secondAdvanceLevel - 1),
      maxBonus: SAGA_TREE_ATTRIBUTE_BONUS_CAP,
      description: '1 zusätzlicher Bonuspunkt darf auf ein Grundattribut verteilt werden',
    },
    {
      levelLabel: formatSagaTreeAttributeBonusLevelLabel(secondAdvanceLevel, 20),
      maxBonus: SAGA_TREE_ATTRIBUTE_BONUS_CAP,
      description: '1 zusätzlicher Bonuspunkt darf auf ein Grundattribut verteilt werden.',
    },
  ];
}
