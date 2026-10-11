/**
 * useSagaSimulation — Preview/commit in-world time advance for GM (#577).
 * Location: src/app/session/hooks/useSagaSimulation.ts
 *
 * Hooks: useState / useEffect / useRef only.
 */
import { useRef, useState } from 'react';
import type { LiveSessionAccess } from '../../../domains/session/contracts/live-session-access';
import {
  assertAdventureRuntimeAccess,
  readAdventureRuntimeV2,
  type AdventureRuntimeState,
} from '../../../domains/session/contracts/adventure-runtime-state';
import {
  advanceTime,
  buildSimulationPreview,
  resolveSagaSimulationDefinition,
  type SimulationPreview,
} from '../../../domains/saga/simulation';
import { useAdventureRuntime } from './useAdventureRuntime';
import { useSessionRuntime } from './useSessionRuntime';

const SOFT_MAX_DAYS = 30;

export function useSagaSimulation(input: {
  sessionId: string | null;
  access: LiveSessionAccess | null;
}) {
  const adventure = useAdventureRuntime({
    sessionId: input.sessionId,
    access: input.access,
  });
  const runtime = useSessionRuntime(input.sessionId);
  const [pendingPreview, setPendingPreview] = useState<SimulationPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const idempotencyKey = useRef<string | null>(null);

  const shared = runtime.state?.gameplay.shared ?? {};
  const stateV2 = readAdventureRuntimeV2(shared);
  const state: AdventureRuntimeState = adventure.state;

  const previewAdvance = (days: number): SimulationPreview => {
    setError(null);
    const n = Math.max(0, Math.min(SOFT_MAX_DAYS, Math.floor(days)));
    if (input.access?.role !== 'gamemaster') {
      const err = new Error('Nur Spielleiter darf Zeit vorstellen');
      setError(err.message);
      throw err;
    }
    const definition = resolveSagaSimulationDefinition(stateV2.definitionRef);
    if (!definition) {
      const err = new Error(
        'Keine Simulationsdefinition für diese Adventure-Ref. Setze z.B. fixture:mini-saga.',
      );
      setError(err.message);
      throw err;
    }
    const result = advanceTime({
      state: stateV2,
      definition,
      days: n,
      seed: stateV2.rngSeed || undefined,
    });
    const batchId = `sim-${Date.now().toString(36)}-${n}`;
    const preview = buildSimulationPreview({ days: n, result, batchId });
    setPendingPreview(preview);
    return preview;
  };

  const rejectPreview = () => {
    setPendingPreview(null);
    idempotencyKey.current = null;
  };

  const commitPreview = async (preview: SimulationPreview): Promise<boolean> => {
    if (!input.access || !input.sessionId) {
      setError('Keine Session');
      return false;
    }
    try {
      assertAdventureRuntimeAccess(input.access, { op: 'apply_simulation_batch' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Keine Rechte');
      return false;
    }
    if (pendingPreview && pendingPreview.batchId !== preview.batchId) {
      setError('Vorschau veraltet — bitte neu erzeugen.');
      return false;
    }
    const key = `simulation:${preview.batchId}`;
    if (idempotencyKey.current === key) {
      return false;
    }
    idempotencyKey.current = key;
    const patchRecord: Record<string, unknown> = {
      time: preview.patch.time,
      clocks: preview.patch.clocks,
      threats: preview.patch.threats,
      deadlines: preview.patch.deadlines,
      flags: preview.patch.flags,
      rngSeed: preview.patch.rngSeed,
      partyLocationRef: preview.patch.partyLocationRef,
    };
    const ok = await adventure.run({
      op: 'apply_simulation_batch',
      days: preview.days,
      batchId: preview.batchId,
      simulationPatch: patchRecord,
      appendConsequences: preview.appendConsequences,
    });
    if (ok) {
      setPendingPreview(null);
      setError(null);
    } else {
      setError(adventure.error ?? 'Freigabe fehlgeschlagen');
      idempotencyKey.current = null;
    }
    return ok;
  };

  return {
    state,
    stateV2,
    isBusy: adventure.isBusy,
    error: error ?? adventure.error,
    previewAdvance,
    commitPreview,
    rejectPreview,
    pendingPreview,
    softMaxDays: SOFT_MAX_DAYS,
  };
}
