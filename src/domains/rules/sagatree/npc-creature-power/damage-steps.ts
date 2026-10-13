/**
 * NPC damage step ladder (Core §15 / benchmarks design).
 * Location: src/domains/rules/sagatree/npc-creature-power/damage-steps.ts
 */
import type { SagaTreeDamageStep } from './types';

export const SAGATREE_NPC_DAMAGE_STEPS: readonly SagaTreeDamageStep[] = Object.freeze([
  { dice: 1, sides: 4, flat: 1, label: 'd4+1' },
  { dice: 1, sides: 6, flat: 1, label: 'd6+1' },
  { dice: 1, sides: 8, flat: 1, label: 'd8+1' },
  { dice: 1, sides: 8, flat: 2, label: 'd8+2' },
  { dice: 1, sides: 10, flat: 2, label: 'd10+2' },
  { dice: 1, sides: 10, flat: 3, label: 'd10+3' },
  { dice: 1, sides: 12, flat: 3, label: 'd12+3' },
  { dice: 1, sides: 12, flat: 4, label: 'd12+4' },
]);

function stepIndex(step: SagaTreeDamageStep): number {
  const index = SAGATREE_NPC_DAMAGE_STEPS.findIndex(
    (candidate) =>
      candidate.dice === step.dice && candidate.sides === step.sides && candidate.flat === step.flat,
  );
  if (index < 0) {
    throw new Error(`Unbekannte Schadensstufe: ${step.label}`);
  }
  return index;
}

/** Move +/- N steps on the ladder; clamps at ends unless ability overrides. */
export function shiftNpcDamageStep(step: SagaTreeDamageStep, delta: number): SagaTreeDamageStep {
  const next = Math.min(
    SAGATREE_NPC_DAMAGE_STEPS.length - 1,
    Math.max(0, stepIndex(step) + delta),
  );
  return SAGATREE_NPC_DAMAGE_STEPS[next]!;
}

/** Offensive Elite-/Boss-Impuls: at least one step below primary. */
export function impulseDamageStepBelowPrimary(primary: SagaTreeDamageStep): SagaTreeDamageStep {
  return shiftNpcDamageStep(primary, -1);
}
