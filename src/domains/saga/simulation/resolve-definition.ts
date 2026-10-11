/**
 * resolve-definition — Map definitionRef → SagaSimulationDefinition (#577).
 * Location: src/domains/saga/simulation/resolve-definition.ts
 */
import { MINI_SAGA_SIMULATION } from './fixtures/mini-saga';
import type { SagaSimulationDefinition } from './types';

/** Sync resolver for known fixtures. Async saga loads stay in the hook. */
export function resolveSagaSimulationDefinition(
  definitionRef: string | null,
): SagaSimulationDefinition | null {
  const ref = (definitionRef ?? '').trim();
  if (!ref) return null;
  if (ref === 'fixture:mini-saga' || ref.startsWith('fixture:mini-saga')) {
    return MINI_SAGA_SIMULATION;
  }
  // Dornhain package uses danger/suspicion clocks — minimal threat ticks for live ops.
  if (ref.includes('dornhain')) {
    return {
      startDay: 0,
      deadlines: [],
      threats: [
        {
          id: 'danger',
          label: 'Reliktgefahr',
          max: 6,
          tickPerDay: 1,
          visibility: 'shared',
          doomSummaryPlayer: 'Die Gefahr ist greifbar nah.',
          doomSummaryGm: 'Threat danger at max.',
        },
        {
          id: 'suspicion',
          label: 'Dorfverdacht',
          max: 4,
          tickPerDay: 0,
          visibility: 'shared',
          doomSummaryPlayer: 'Das Dorf misstraut euch.',
          doomSummaryGm: 'Threat suspicion at max.',
        },
      ],
      rules: [],
    };
  }
  return null;
}
