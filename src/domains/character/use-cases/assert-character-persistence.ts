/**
 * assert-character-persistence — Server-side SagaTree build validation before persistence.
 * Location: src/domains/character/use-cases/assert-character-persistence.ts
 */
import {
  applySagaTreeAttributeAdvances,
  isValidSagaTreeAttributeBuild,
  type SagaTreeAttributeAdvances,
} from '../../rules/sagatree/attribute-progression';
import {
  assertSagaTreeSkillPersistence,
  resolveSagaTreeSkillBuildState,
  type SagaTreeSkillRankMap,
} from '../../rules/sagatree/skill-progression';
import type { CharacterAttributesDto } from '../domain/character.entity';
import type { SagaTreeProfileDto } from '../domain/sagatree-profile.entity';

function attributesEqual(left: CharacterAttributesDto, right: CharacterAttributesDto): boolean {
  return left.strength === right.strength
    && left.dexterity === right.dexterity
    && left.endurance === right.endurance
    && left.mind === right.mind
    && left.perception === right.perception
    && left.charisma === right.charisma;
}

export function assertValidSagaTreeAttributePersistence(
  attributes: CharacterAttributesDto,
  profile: SagaTreeProfileDto,
  level: number,
): void {
  if (!profile.baseAttributes) return;
  const advances = (profile.attributeAdvances ?? {}) as SagaTreeAttributeAdvances;
  if (!isValidSagaTreeAttributeBuild(profile.baseAttributes, advances, level)) {
    throw new Error('Invalid SagaTree attribute build: base distribution or permanent advances violate Core rules.');
  }
  const expected = applySagaTreeAttributeAdvances(profile.baseAttributes, advances, level);
  if (!attributesEqual(attributes, expected)) {
    throw new Error('Invalid SagaTree attribute build: final attributes must match baseAttributes plus advances.');
  }
}

export function assertValidSagaTreeSkillPersistence(
  skills: SagaTreeSkillRankMap,
  profile: SagaTreeProfileDto,
  level: number,
): void {
  const resolved = resolveSagaTreeSkillBuildState({
    freeSkillRanks: profile.freeSkillRanks,
    backgroundSkillPoints: profile.background.backgroundSkillPoints,
    skillPool: profile.background.skillPool,
    archetypeTrainingSkill: profile.archetypeTrainingSkill,
    skillAdvances: profile.skillAdvances,
    specializations: profile.specializations,
    backgroundSpecialization: profile.background.specialization,
  });

  assertSagaTreeSkillPersistence(
    skills,
    resolved,
    level,
    profile.background.skillPool,
    profile.archetype,
  );
}

export function assertValidSagaTreeCharacterPersistence(
  attributes: CharacterAttributesDto,
  skills: SagaTreeSkillRankMap,
  profile: SagaTreeProfileDto,
  level: number,
): void {
  assertValidSagaTreeAttributePersistence(attributes, profile, level);
  assertValidSagaTreeSkillPersistence(skills, profile, level);
}
