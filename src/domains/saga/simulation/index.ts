/**
 * saga simulation — public pure kernel API (#576).
 * Location: src/domains/saga/simulation/index.ts
 */

export { advanceTime, type AdvanceTimeInput, type AdvanceTimeResult } from './advance-time';
export { createSeededRng, type SeededRng } from './rng';
export { MINI_SAGA_SIMULATION, miniSagaV1State } from './fixtures/mini-saga';
export { resolveSagaSimulationDefinition } from './resolve-definition';
export {
  buildSimulationPatchFromAdvanceResult,
  buildSimulationPreview,
  type AdventureSimulationPatch,
  type SimulationPreview,
} from './build-simulation-patch';
export type {
  SagaDeadlineTemplate,
  SagaGameTime,
  SagaProposedEvent,
  SagaProposedEventKind,
  SagaSimCondition,
  SagaSimEffect,
  SagaSimRule,
  SagaSimulationDefinition,
  SagaThreatTemplate,
} from './types';
