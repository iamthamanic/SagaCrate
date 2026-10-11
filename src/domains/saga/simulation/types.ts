/**
 * saga simulation types — pure definition + proposed events (#576).
 * Location: src/domains/saga/simulation/types.ts
 */
import type { AdventureVisibility } from '../../session/contracts/adventure-runtime-state';

export type SagaGameTime = {
  readonly day: number;
};

export type SagaDeadlineTemplate = {
  readonly id: string;
  readonly label: string;
  readonly dueDay: number;
  readonly visibility: AdventureVisibility;
  readonly summaryPlayer: string;
  readonly summaryGm: string;
};

export type SagaThreatTemplate = {
  readonly id: string;
  readonly label: string;
  readonly max: number;
  readonly tickPerDay: number;
  readonly visibility: AdventureVisibility;
  readonly doomSummaryPlayer: string;
  readonly doomSummaryGm: string;
};

export type SagaSimCondition =
  | { readonly kind: 'flag'; readonly key: string; readonly equals: boolean | number | string }
  | { readonly kind: 'threat-at-least'; readonly threatId: string; readonly value: number }
  | { readonly kind: 'day-at-least'; readonly day: number };

export type SagaSimEffect =
  | { readonly kind: 'tick-threat'; readonly threatId: string; readonly delta: number }
  | { readonly kind: 'set-flag'; readonly key: string; readonly value: boolean | number | string }
  | {
      readonly kind: 'emit-event';
      readonly eventKind: string;
      readonly summaryPlayer: string;
      readonly summaryGm: string;
      readonly visibility: AdventureVisibility;
    };

export type SagaSimRule = {
  readonly id: string;
  readonly label: string;
  readonly when: SagaSimCondition;
  readonly then: readonly SagaSimEffect[];
};

/** Minimal definition slice consumed by the kernel (from saga definition or fixture). */
export type SagaSimulationDefinition = {
  readonly startDay: number;
  readonly deadlines: readonly SagaDeadlineTemplate[];
  readonly threats: readonly SagaThreatTemplate[];
  readonly rules: readonly SagaSimRule[];
};

export type SagaProposedEventKind =
  | 'deadline'
  | 'threat_tick'
  | 'threat_doom'
  | 'rule'
  | 'time';

/** Events for #577 UI — never put gm_only text in summaryPlayer. */
export type SagaProposedEvent = {
  readonly id: string;
  readonly kind: SagaProposedEventKind;
  readonly summaryPlayer: string;
  readonly summaryGm: string;
  readonly visibility: AdventureVisibility;
  readonly day: number;
  readonly sourceId: string;
};
