/**
 * NPC/creature compact-statblock power types (Core §15).
 * Location: src/domains/rules/sagatree/npc-creature-power/types.ts
 */

export type SagaTreeNpcLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20;

export type SagaTreeMachtgrad = 'gering' | 'mittel' | 'hoch' | 'extrem' | 'legendaer';

export type SagaTreeCombatRole = 'standard' | 'elite' | 'boss';

export type SagaTreeCombatProfile =
  | 'noncombat'
  | 'balanced'
  | 'tough'
  | 'offensive'
  | 'mobile'
  | 'ranged'
  | 'control_support';

export type SagaTreeDamageStep = {
  dice: number;
  sides: number;
  flat: number;
  label: string;
};

export type SagaTreeResistanceSlots = {
  high: number;
  normal: number;
  low: number;
};

export type SagaTreeLevelBenchmark = {
  level: SagaTreeNpcLevel;
  machtgrad: SagaTreeMachtgrad;
  experienceBonus: number;
  primarySkillRank: number;
  primaryModifier: number;
  defense: number;
  resistances: SagaTreeResistanceSlots;
  health: number;
  baseDamage: SagaTreeDamageStep;
  attributeDefaults: readonly [number, number, number, number, number, number];
};

export type SagaTreeProfileAdjustments = {
  healthMultiplier: number;
  defenseDelta: number;
  primaryAttackDelta: number;
  meleeAttackDelta: number;
  rangedAttackDelta: number;
  controlEffectDelta: number;
  bodyOrDurabilityResistDelta: number;
  reflexResistDelta: number;
  mindOrControlResistDelta: number;
  weakestResistDelta: number;
  movementDeltaMeters: number;
  damageStepDelta: number;
  requiresRangedPrimary: boolean;
  combatSignatureRequired: boolean;
};

export type SagaTreeCombatRoleRules = {
  role: SagaTreeCombatRole;
  healthMultiplier: number;
  threatUnitsSameLevel: number;
  impulsesPerRound: number;
  wendepunktPerCombat: number;
  signatureAbilityBonus: number;
  minImpulseOptions: number;
};

export type SagaTreeCompactStatblockInput = {
  level: number;
  combatProfile: SagaTreeCombatProfile;
  combatRole: SagaTreeCombatRole;
  /** Base movement in meters before profile shifts (default 9). */
  baseMovementMeters?: number;
  /** When true, impulses are unavailable (Kampfunfähig). */
  incapacitated?: boolean;
};

export type SagaTreeCompactStatblockBenchmarks = {
  level: SagaTreeNpcLevel;
  machtgrad: SagaTreeMachtgrad;
  machtgradLabel: string;
  combatProfile: SagaTreeCombatProfile;
  combatRole: SagaTreeCombatRole;
  experienceBonus: number;
  primarySkillRank: number;
  primaryModifier: number;
  defense: number;
  resistances: SagaTreeResistanceSlots;
  baseHealth: number;
  health: number;
  baseDamage: SagaTreeDamageStep;
  primaryDamage: SagaTreeDamageStep;
  attributeDefaults: readonly [number, number, number, number, number, number];
  movementMeters: number;
  threatUnitsSameLevel: number;
  impulsesPerRound: number;
  wendepunktPerCombat: number;
  signatureAbilityBudget: number;
  minImpulseOptions: number;
  impulsesAllowed: boolean;
  combatSignatureRequired: boolean;
  requiresRangedPrimary: boolean;
  primaryAttackDelta: number;
  meleeAttackDelta: number;
  rangedAttackDelta: number;
  controlEffectDelta: number;
};
