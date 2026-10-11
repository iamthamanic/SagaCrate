/**
 * build-simulation-patch — Kernel result → RPC-safe batch patch (#577).
 * Location: src/domains/saga/simulation/build-simulation-patch.ts
 */
import type { AdventureRuntimeStateV2 } from '../../session/contracts/adventure-runtime-state';
import type { AdvanceTimeResult } from './advance-time';
import type { SagaProposedEvent } from './types';

export type AdventureSimulationPatch = {
  readonly time: { readonly day: number };
  readonly clocks: AdventureRuntimeStateV2['clocks'];
  readonly threats: AdventureRuntimeStateV2['threats'];
  readonly deadlines: AdventureRuntimeStateV2['deadlines'];
  readonly flags: AdventureRuntimeStateV2['flags'];
  readonly rngSeed: number;
  readonly partyLocationRef: string | null;
};

export type SimulationPreview = {
  readonly batchId: string;
  readonly days: number;
  readonly seed: number;
  readonly nextState: AdventureRuntimeStateV2;
  readonly proposedEvents: readonly SagaProposedEvent[];
  readonly patch: AdventureSimulationPatch;
  readonly appendConsequences: readonly {
    readonly kind: string;
    readonly summary: string;
    readonly visibility: 'public' | 'shared' | 'gm_only';
  }[];
};

export function buildSimulationPatchFromAdvanceResult(
  result: AdvanceTimeResult,
): AdventureSimulationPatch {
  const s = result.nextState;
  return {
    time: { day: s.time.day },
    clocks: s.clocks,
    threats: s.threats,
    deadlines: s.deadlines,
    flags: s.flags,
    rngSeed: s.rngSeed,
    partyLocationRef: s.partyLocationRef,
  };
}

export function buildSimulationPreview(input: {
  readonly days: number;
  readonly result: AdvanceTimeResult;
  readonly batchId: string;
}): SimulationPreview {
  const patch = buildSimulationPatchFromAdvanceResult(input.result);
  const appendConsequences = input.result.proposedEvents
    .filter((e) => e.kind === 'deadline' || e.kind === 'threat_doom' || e.kind === 'rule')
    .filter((e) => e.summaryGm.trim().length > 0)
    .slice(0, 32)
    .map((e) => ({
      kind: e.kind,
      summary: (e.visibility === 'gm_only' ? e.summaryGm : e.summaryPlayer || e.summaryGm).slice(
        0,
        200,
      ),
      visibility: e.visibility,
    }));
  return {
    batchId: input.batchId,
    days: input.days,
    seed: input.result.nextState.rngSeed,
    nextState: input.result.nextState,
    proposedEvents: input.result.proposedEvents,
    patch,
    appendConsequences,
  };
}
