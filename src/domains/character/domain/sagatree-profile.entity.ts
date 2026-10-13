/**
 * sagatree-profile.entity — Domain entities for SagaTree character profile.
 * Location: src/domains/character/domain/sagatree-profile.entity.ts
 */
import type {
  SagaTreeArchetypeKey,
  SagaTreeAttributeKey,
  SagaTreeEssenceKey,
  SagaTreeSkillKey,
  SagaTreeSpeciesTraitKey,
} from '../../rules/sagatree/character-creation';
import type {
  SagaTreeBackgroundSkillPoints,
  SagaTreeSkillAdvanceDto,
  SagaTreeSpecializationRecordDto,
  SagaTreeSpecializationSource,
} from '../../rules/sagatree/skill-progression';
import type { SagaTreeSpeciesTraitOptionKey } from '../../rules/sagatree/species-trait-options';
import type { CharacterAttributesDto } from './character.entity';

export type SagaTreeAttributeAdvancesDto = Partial<Record<8 | 16, SagaTreeAttributeKey>>;

export interface SagaTreeSpecializationDto {
  skill: SagaTreeSkillKey;
  name: string;
  source?: SagaTreeSpecializationSource;
  acquiredAtLevel?: number;
}

export interface SagaTreeBackgroundDto {
  name: string;
  skillPool: SagaTreeSkillKey[];
  /** Derived from backgroundSkillPoints for UI compatibility — not a skill-progression source of truth. */
  trainedSkills: SagaTreeSkillKey[];
  backgroundSkillPoints?: SagaTreeBackgroundSkillPoints;
  specialization?: SagaTreeSpecializationDto;
  milieuAccess: string;
  contact: string;
  complication: string;
  communication: string;
}

export type SagaTreeSpeciesTraitDetailsDto = Partial<Record<SagaTreeSpeciesTraitKey, string>>;

export type SagaTreeSpeciesTraitSource = 'species-creation';

export interface SagaTreeSpeciesTraitInstanceDto {
  trait: SagaTreeSpeciesTraitKey;
  option?: SagaTreeSpeciesTraitOptionKey;
  legacyDetail?: string;
  source: SagaTreeSpeciesTraitSource;
  acquiredAtLevel: number;
}

export interface SagaTreeSpeciesProfileDto {
  name: string;
  bodyDescription: string;
}

export type SagaTreePresetReleaseMode = 'manual' | 'auto';

export interface SagaTreeProfileDto {
  archetype?: SagaTreeArchetypeKey;
  essence?: SagaTreeEssenceKey;
  speciesTraitInstances: SagaTreeSpeciesTraitInstanceDto[];
  speciesTraits?: SagaTreeSpeciesTraitKey[];
  speciesTraitDetails?: SagaTreeSpeciesTraitDetailsDto;
  speciesProfile?: SagaTreeSpeciesProfileDto;
  backgroundTemplateId?: string | null;
  background: SagaTreeBackgroundDto;
  archetypeTrainingSkill?: SagaTreeSkillKey;
  freeSkillRanks?: Partial<Record<SagaTreeSkillKey, number>>;
  skillAdvances?: SagaTreeSkillAdvanceDto[];
  specializations?: SagaTreeSpecializationRecordDto[];
  baseAttributes?: CharacterAttributesDto;
  attributeAdvances?: SagaTreeAttributeAdvancesDto;
  presetReleaseMode?: SagaTreePresetReleaseMode;
  drive: number;
  momentum: number;
}
