/**
 * NPC/creature compact power framework — public rules-kernel API.
 * Location: src/domains/rules/sagatree/npc-creature-power/index.ts
 */
export type {
  SagaTreeCombatProfile,
  SagaTreeCombatRole,
  SagaTreeCombatRoleRules,
  SagaTreeCompactStatblockBenchmarks,
  SagaTreeCompactStatblockInput,
  SagaTreeDamageStep,
  SagaTreeLevelBenchmark,
  SagaTreeMachtgrad,
  SagaTreeNpcLevel,
  SagaTreeProfileAdjustments,
  SagaTreeResistanceSlots,
} from './types';

export {
  SAGATREE_MACHTGRAD_LABELS,
  assertSagaTreeNpcLevel,
  isSagaTreeNpcLevel,
  machtgradForLevel,
  machtgradLabelForLevel,
} from './machtgrad';

export {
  SAGATREE_NPC_DAMAGE_STEPS,
  impulseDamageStepBelowPrimary,
  shiftNpcDamageStep,
} from './damage-steps';

export {
  SAGATREE_NPC_LEVEL_BENCHMARKS,
  levelBenchmark,
  signatureAbilityBudgetForMachtgrad,
} from './benchmarks';

export {
  SAGATREE_COMBAT_PROFILE_ADJUSTMENTS,
  applyResistanceSlotDeltas,
  profileAdjustmentsFor,
} from './profiles';

export {
  SAGATREE_COMBAT_ROLE_RULES,
  combineHealth,
  combatRoleRulesFor,
  impulsesAllowed,
  normalizeCombatRoleForProfile,
} from './combat-roles';

export { computeCompactStatblockBenchmarks } from './compute';
