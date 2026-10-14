/**
 * dornhain-pregen-sheets — Full SagaTree Core sheets for Dornhain native pregens.
 * Location: src/domains/character/use-cases/dornhain-pregen-sheets.ts
 *
 * Seed / provision must persist these so Character Editor opens with Spezies,
 * Archetyp, Essenz, Traits and skill provenance already selected.
 */
import { getSagaTreeBackgroundTemplate } from '../../rules/sagatree/background-templates';
import {
  createEmptySagaTreeSkillRanks,
  getSagaTreeSpeciesTraitCost,
  normalizeSagaTreeRaceKey,
  type SagaTreeRaceKey,
  type SagaTreeSkillKey,
  type SagaTreeSpeciesTraitKey,
} from '../../rules/sagatree/character-creation';

export { normalizeSagaTreeRaceKey };
import {
  backgroundSkillPointsToTrainedSkills,
  resolveSagaTreeSkillRanks,
} from '../../rules/sagatree/skill-progression';
import type { SagaTreeSpeciesTraitOptionKey } from '../../rules/sagatree/species-trait-options';
import {
  getSagaTreeStartingTemplate,
  type SagaTreeStartingTemplateKey,
} from '../../rules/sagatree/starting-templates';
import type { CharacterAttributesDto } from '../domain/character.entity';
import type {
  SagaTreeProfileDto,
  SagaTreeSpeciesTraitInstanceDto,
} from '../domain/sagatree-profile.entity';
import { assertValidSagaTreeCharacterPersistence } from './assert-character-persistence';

export type DornhainPregenAssetId =
  | 'pregen.warrior'
  | 'pregen.scout'
  | 'pregen.mystic'
  | 'pregen.diplomat';

export interface DornhainPregenSheetDefinition {
  readonly assetId: DornhainPregenAssetId;
  readonly displayName: string;
  readonly classLabel: string;
  readonly level: number;
  readonly race: SagaTreeRaceKey;
  /** Feminine / display race label for library cards when distinct from catalog label. */
  readonly raceLabelDe: string;
  readonly startingTemplateKey: SagaTreeStartingTemplateKey;
  readonly speciesTraitInstances: readonly SagaTreeSpeciesTraitInstanceDto[];
  readonly starterItemDefinitionIds: readonly string[];
  readonly milieuAccess: string;
  readonly contact: string;
  readonly complication: string;
  readonly communication: string;
}

export interface DornhainPregenPersistencePayload {
  readonly assetId: DornhainPregenAssetId;
  readonly name: string;
  readonly description: string;
  readonly class: string;
  readonly race: SagaTreeRaceKey;
  readonly raceLabelDe: string;
  readonly level: number;
  readonly rulesetKey: 'sagatree-core';
  readonly sheetStatus: 'complete';
  readonly attributes: CharacterAttributesDto & { nativeAssetId: DornhainPregenAssetId };
  readonly skills: Record<SagaTreeSkillKey, number>;
  readonly sagatreeProfile: SagaTreeProfileDto;
  readonly inventory: readonly string[];
  readonly sagadriveMeta: {
    readonly origin: 'native';
    readonly nativeAssetId: DornhainPregenAssetId;
    readonly starter: true;
  };
}

function trait(
  key: SagaTreeSpeciesTraitKey,
  option?: SagaTreeSpeciesTraitOptionKey,
): SagaTreeSpeciesTraitInstanceDto {
  return {
    trait: key,
    ...(option ? { option } : {}),
    source: 'species-creation',
    acquiredAtLevel: 1,
  };
}

/**
 * Canonical Dornhain party sheets.
 * Races follow product intent (Zwergin / Späher-Ork / Elfin / Mensch).
 * Builds reuse validated Level-1 starting templates; characters are seeded at level 2
 * (no skill advances until level 3).
 */
export const DORNHAIN_PREGEN_SHEETS: readonly DornhainPregenSheetDefinition[] = [
  {
    assetId: 'pregen.warrior',
    displayName: 'Brenna Sturmfaust',
    classLabel: 'Kämpferin',
    level: 2,
    race: 'dwarf',
    raceLabelDe: 'Zwergin',
    startingTemplateKey: 'berserker',
    speciesTraitInstances: [
      trait('natural-protection'),
      trait('sharpened-sense', 'sense-hearing'),
    ],
    starterItemDefinitionIds: [
      'builtin.fantasy.healing-potion',
      'builtin.fantasy.longsword',
      'builtin.fantasy.rope',
    ],
    milieuAccess: 'Arenen & Zwergenhallen',
    contact: 'Waffenmeisterin aus dem Clan',
    complication: 'Alte Blutschuld',
    communication: 'Kampfzeichen',
  },
  {
    assetId: 'pregen.scout',
    displayName: 'Kael Schattenpfad',
    classLabel: 'Späher',
    level: 2,
    race: 'orc',
    raceLabelDe: 'Ork',
    startingTemplateKey: 'assassin',
    speciesTraitInstances: [
      trait('natural-protection'),
      trait('natural-weapon'),
    ],
    starterItemDefinitionIds: [
      'builtin.fantasy.healing-potion',
      'builtin.fantasy.shortbow',
      'builtin.fantasy.lockpicks',
    ],
    milieuAccess: 'Randgebiete & Schleichwege',
    contact: 'Schmugglerin an der Grenze',
    complication: 'Teufelsauge — Markenzeichen und Gefahr',
    communication: 'Handzeichen',
  },
  {
    assetId: 'pregen.mystic',
    displayName: 'Liora Mondschein',
    classLabel: 'Mystikerin',
    level: 2,
    race: 'elf',
    raceLabelDe: 'Elfin',
    startingTemplateKey: 'mage',
    speciesTraitInstances: [
      trait('enhanced-sight', 'darkvision'),
      trait('low-rest-need'),
    ],
    starterItemDefinitionIds: [
      'builtin.fantasy.healing-potion',
      'builtin.fantasy.quarterstaff',
      'builtin.fantasy.healer-kit',
    ],
    milieuAccess: 'Archive & Mondtempel',
    contact: 'Mentorin der Akademie',
    complication: 'Umstrittene Theorie',
    communication: 'Akademischer Fachjargon',
  },
  {
    assetId: 'pregen.diplomat',
    displayName: 'Oskar Federkiel',
    classLabel: 'Diplomat',
    level: 2,
    race: 'human',
    raceLabelDe: 'Mensch',
    startingTemplateKey: 'mentalist',
    speciesTraitInstances: [
      trait('sharpened-sense', 'sense-sight'),
      trait('narrow-resistance', 'poison-toxins'),
      trait('enduring-organism'),
    ],
    starterItemDefinitionIds: [
      'builtin.fantasy.healing-potion',
      'builtin.fantasy.dagger',
      'builtin.fantasy.writing-kit',
    ],
    milieuAccess: 'Höfe & Schreibstuben',
    contact: 'Archivarin der Stadt',
    complication: 'Offene Schuld gegenüber einem Gönner',
    communication: 'Diplomatische Formeln',
  },
];

function buildProfile(def: DornhainPregenSheetDefinition): {
  profile: SagaTreeProfileDto;
  attributes: CharacterAttributesDto;
  skills: Record<SagaTreeSkillKey, number>;
} {
  const template = getSagaTreeStartingTemplate(def.startingTemplateKey);
  if (!template) {
    throw new Error(`Dornhain pregen ${def.assetId}: missing template ${def.startingTemplateKey}`);
  }
  const background = getSagaTreeBackgroundTemplate(template.backgroundTemplateId);
  if (!background) {
    throw new Error(`Dornhain pregen ${def.assetId}: missing background ${template.backgroundTemplateId}`);
  }

  const traitCost = getSagaTreeSpeciesTraitCost(def.speciesTraitInstances.map((entry) => entry.trait));
  if (traitCost !== 3) {
    throw new Error(`Dornhain pregen ${def.assetId}: species trait budget must be 3, got ${traitCost}`);
  }

  const freeSkillRanks = { ...createEmptySagaTreeSkillRanks(), ...template.freeSkillRanks };
  const backgroundSkillPoints = { ...template.backgroundSkillPoints };
  const skillBuild = {
    freeSkillRanks,
    backgroundSkillPoints,
    archetypeTrainingSkill: template.archetypeTrainingSkill,
    specializations: [template.backgroundSpecialization],
  };
  const skills = resolveSagaTreeSkillRanks(skillBuild, def.level);

  const profile: SagaTreeProfileDto = {
    archetype: template.archetype,
    essence: template.essence,
    speciesTraitInstances: def.speciesTraitInstances.map((instance) => ({ ...instance })),
    backgroundTemplateId: template.backgroundTemplateId,
    background: {
      name: background.name,
      skillPool: [...background.skillPool] as SagaTreeSkillKey[],
      trainedSkills: backgroundSkillPointsToTrainedSkills(backgroundSkillPoints),
      backgroundSkillPoints,
      specialization: { ...template.backgroundSpecialization },
      milieuAccess: def.milieuAccess,
      contact: def.contact,
      complication: def.complication,
      communication: def.communication,
    },
    archetypeTrainingSkill: template.archetypeTrainingSkill,
    freeSkillRanks,
    specializations: [template.backgroundSpecialization],
    baseAttributes: { ...template.attributes },
    attributeAdvances: {},
    drive: 3,
    momentum: 0,
  };

  return {
    profile,
    attributes: { ...template.attributes },
    skills,
  };
}

export function buildDornhainPregenPersistence(
  def: DornhainPregenSheetDefinition,
): DornhainPregenPersistencePayload {
  const { profile, attributes, skills } = buildProfile(def);
  assertValidSagaTreeCharacterPersistence(attributes, skills, profile, def.level);

  return {
    assetId: def.assetId,
    name: def.displayName,
    description: `Dornhain-Starter · ${def.classLabel}`,
    class: def.classLabel,
    race: def.race,
    raceLabelDe: def.raceLabelDe,
    level: def.level,
    rulesetKey: 'sagatree-core',
    sheetStatus: 'complete',
    attributes: { ...attributes, nativeAssetId: def.assetId },
    skills,
    sagatreeProfile: profile,
    inventory: def.starterItemDefinitionIds,
    sagadriveMeta: {
      origin: 'native',
      nativeAssetId: def.assetId,
      starter: true,
    },
  };
}

export function listDornhainPregenPersistencePayloads(): readonly DornhainPregenPersistencePayload[] {
  return DORNHAIN_PREGEN_SHEETS.map(buildDornhainPregenPersistence);
}

export function getDornhainPregenSheet(
  assetId: DornhainPregenAssetId,
): DornhainPregenSheetDefinition | undefined {
  return DORNHAIN_PREGEN_SHEETS.find((sheet) => sheet.assetId === assetId);
}
