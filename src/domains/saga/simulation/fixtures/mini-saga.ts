/**
 * mini-saga — Deterministic fixture for simulation kernel check (#576).
 * Location: src/domains/saga/simulation/fixtures/mini-saga.ts
 */
import { emptyAdventureRuntimeState } from '../../../session/contracts/adventure-runtime-state';
import type { SagaSimulationDefinition } from '../types';

export const MINI_SAGA_SIMULATION: SagaSimulationDefinition = {
  startDay: 0,
  deadlines: [
    {
      id: 'dl.market',
      label: 'Markttag',
      dueDay: 3,
      visibility: 'public',
      summaryPlayer: 'Der Markttag ist da.',
      summaryGm: 'Deadline Markttag feuert (Tag 3).',
    },
  ],
  threats: [
    {
      id: 'danger',
      label: 'Reliktgefahr',
      max: 4,
      tickPerDay: 1,
      visibility: 'shared',
      doomSummaryPlayer: 'Die Gefahr ist greifbar nah.',
      doomSummaryGm: 'Threat danger at max — impending doom once.',
    },
  ],
  rules: [
    {
      id: 'rule.suspicion-on-day2',
      label: 'Verdacht ab Tag 2',
      when: { kind: 'day-at-least', day: 2 },
      then: [
        {
          kind: 'emit-event',
          eventKind: 'rumour',
          summaryPlayer: 'Gerüchte gehen um.',
          summaryGm: 'Rule suspicion-on-day2 fired.',
          visibility: 'public',
        },
      ],
    },
  ],
};

export function miniSagaV1State() {
  const base = emptyAdventureRuntimeState();
  return {
    ...base,
    definitionRef: 'fixture:mini-saga',
    clocks: {
      danger: {
        id: 'danger',
        label: 'Reliktgefahr',
        value: 0,
        max: 4,
        visibility: 'shared' as const,
      },
    },
  };
}
