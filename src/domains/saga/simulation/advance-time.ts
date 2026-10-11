/**
 * advance-time — Deterministic day advance for saga simulation (#576).
 * Location: src/domains/saga/simulation/advance-time.ts
 */
import {
  isAdventureRuntimeStateV2,
  upgradeAdventureRuntimeV1toV2,
  type AdventureRuntimeState,
  type AdventureRuntimeStateV2,
  type AdventureThreatRuntime,
  type AdventureFlagEntry,
} from '../../session/contracts/adventure-runtime-state';
import { createSeededRng } from './rng';
import type {
  SagaProposedEvent,
  SagaSimCondition,
  SagaSimEffect,
  SagaSimulationDefinition,
  SagaSimRule,
} from './types';

export type AdvanceTimeInput = {
  readonly state: AdventureRuntimeState | AdventureRuntimeStateV2;
  readonly definition: SagaSimulationDefinition;
  readonly days: number;
  readonly seed?: number;
};

export type AdvanceTimeResult = {
  readonly nextState: AdventureRuntimeStateV2;
  readonly proposedEvents: readonly SagaProposedEvent[];
  readonly skipped: readonly { readonly reason: string; readonly sourceId: string }[];
};

function conditionMet(
  when: SagaSimCondition,
  state: AdventureRuntimeStateV2,
): boolean {
  if (when.kind === 'flag') {
    const flag = state.flags[when.key];
    return flag !== undefined && flag.value === when.equals;
  }
  if (when.kind === 'threat-at-least') {
    const threat = state.threats.find((t) => t.id === when.threatId);
    return Boolean(threat && threat.value >= when.value);
  }
  if (when.kind === 'day-at-least') {
    return state.time.day >= when.day;
  }
  return false;
}

function upsertThreat(
  threats: AdventureThreatRuntime[],
  id: string,
  patch: Partial<AdventureThreatRuntime> & { label?: string; max?: number },
): AdventureThreatRuntime[] {
  const idx = threats.findIndex((t) => t.id === id);
  if (idx < 0) {
    return [
      ...threats,
      {
        id,
        label: patch.label ?? id,
        value: patch.value ?? 0,
        max: patch.max ?? 4,
        visibility: patch.visibility ?? 'shared',
        impendingDoomFired: patch.impendingDoomFired ?? false,
      },
    ];
  }
  const cur = threats[idx]!;
  const next = { ...cur, ...patch };
  return threats.map((t, i) => (i === idx ? next : t));
}

function applyEffect(
  effect: SagaSimEffect,
  state: AdventureRuntimeStateV2,
  day: number,
  sourceId: string,
  events: SagaProposedEvent[],
  skipped: { reason: string; sourceId: string }[],
  def: SagaSimulationDefinition,
): AdventureRuntimeStateV2 {
  if (effect.kind === 'tick-threat') {
    const template = def.threats.find((t) => t.id === effect.threatId);
    let threats: AdventureThreatRuntime[] = [...state.threats];
    let threat = threats.find((t) => t.id === effect.threatId);
    if (!threat) {
      if (!template) {
        skipped.push({
          reason: 'missing threat template',
          sourceId: effect.threatId,
        });
        return state;
      }
      threats = upsertThreat(threats, effect.threatId, {
        label: template.label,
        max: template.max,
        visibility: template.visibility,
        value: 0,
      });
      threat = threats.find((t) => t.id === effect.threatId)!;
    }
    const max = threat.max;
    const nextValue = Math.max(0, Math.min(max, threat.value + effect.delta));
    threats = upsertThreat(threats, effect.threatId, { value: nextValue });
    const clocks = {
      ...state.clocks,
      [effect.threatId]: {
        id: effect.threatId,
        label: threat.label,
        value: nextValue,
        max,
        visibility: threat.visibility,
      },
    };
    events.push({
      id: `evt.threat_tick.${effect.threatId}.${day}.${events.length}`,
      kind: 'threat_tick',
      summaryPlayer: `${threat.label}: ${nextValue}/${max}`,
      summaryGm: `${threat.label} tick ${effect.delta} → ${nextValue}/${max}`,
      visibility: threat.visibility,
      day,
      sourceId,
    });
    return { ...state, threats, clocks };
  }

  if (effect.kind === 'set-flag') {
    const entry: AdventureFlagEntry = {
      key: effect.key,
      value: effect.value,
      visibility: 'gm_only',
      updatedAt: null,
    };
    events.push({
      id: `evt.flag.${effect.key}.${day}.${events.length}`,
      kind: 'rule',
      summaryPlayer: '',
      summaryGm: `Flag ${effect.key} = ${String(effect.value)}`,
      visibility: 'gm_only',
      day,
      sourceId,
    });
    return {
      ...state,
      flags: { ...state.flags, [effect.key]: entry },
    };
  }

  if (effect.kind === 'emit-event') {
    events.push({
      id: `evt.emit.${sourceId}.${day}.${events.length}`,
      kind: 'rule',
      summaryPlayer: effect.visibility === 'gm_only' ? '' : effect.summaryPlayer,
      summaryGm: effect.summaryGm,
      visibility: effect.visibility,
      day,
      sourceId,
    });
  }
  return state;
}

function runRules(
  rules: readonly SagaSimRule[],
  state: AdventureRuntimeStateV2,
  day: number,
  events: SagaProposedEvent[],
  skipped: { reason: string; sourceId: string }[],
  def: SagaSimulationDefinition,
): AdventureRuntimeStateV2 {
  let next = state;
  const sorted = [...rules].sort((a, b) => a.id.localeCompare(b.id));
  for (const rule of sorted) {
    if (!conditionMet(rule.when, next)) continue;
    for (const effect of rule.then) {
      next = applyEffect(effect, next, day, rule.id, events, skipped, def);
    }
  }
  return next;
}

function ensureThreatTracks(
  state: AdventureRuntimeStateV2,
  def: SagaSimulationDefinition,
): AdventureRuntimeStateV2 {
  let threats = [...state.threats];
  let clocks = { ...state.clocks };
  for (const template of def.threats) {
    if (!threats.some((t) => t.id === template.id)) {
      threats = upsertThreat(threats, template.id, {
        label: template.label,
        max: Math.max(1, Math.min(12, template.max)),
        visibility: template.visibility,
        value: 0,
        impendingDoomFired: false,
      });
    }
    const threat = threats.find((t) => t.id === template.id)!;
    if (!clocks[template.id]) {
      clocks = {
        ...clocks,
        [template.id]: {
          id: template.id,
          label: threat.label,
          value: threat.value,
          max: threat.max,
          visibility: threat.visibility,
        },
      };
    }
  }
  return { ...state, threats, clocks };
}

/**
 * Advance in-world days. Pure + deterministic for a given seed.
 * Does not call session RPC / applyAdventureRuntimeCommand (#577).
 */
export function advanceTime(input: AdvanceTimeInput): AdvanceTimeResult {
  const days = Number.isFinite(input.days) ? Math.max(0, Math.floor(input.days)) : 0;
  const seed =
    typeof input.seed === 'number' && Number.isFinite(input.seed)
      ? input.seed >>> 0
      : undefined;

  let state: AdventureRuntimeStateV2 = isAdventureRuntimeStateV2(input.state)
    ? input.state
    : upgradeAdventureRuntimeV1toV2(input.state, { seed });

  if (seed !== undefined) {
    state = { ...state, rngSeed: seed };
  }

  // Touch RNG so seed is part of the contract even when unused by rules yet.
  createSeededRng(state.rngSeed ^ (state.time.day + days));

  state = ensureThreatTracks(state, input.definition);

  if (state.deadlines.length === 0 && input.definition.deadlines.length > 0) {
    state = {
      ...state,
      deadlines: input.definition.deadlines.map((d) => ({
        id: d.id,
        label: d.label,
        dueDay: d.dueDay,
        fired: false,
        visibility: d.visibility,
      })),
      rules: input.definition.rules.map((r) => ({ id: r.id, label: r.label })),
    };
  }

  if (state.time.day === 0 && input.definition.startDay > 0) {
    state = { ...state, time: { day: input.definition.startDay } };
  }

  const events: SagaProposedEvent[] = [];
  const skipped: { reason: string; sourceId: string }[] = [];

  if (days === 0) {
    return { nextState: state, proposedEvents: events, skipped };
  }

  for (let step = 1; step <= days; step += 1) {
    const day = state.time.day + 1;
    state = { ...state, time: { day } };

    // Threat passive ticks
    for (const template of input.definition.threats) {
      if (template.tickPerDay === 0) continue;
      state = applyEffect(
        { kind: 'tick-threat', threatId: template.id, delta: template.tickPerDay },
        state,
        day,
        template.id,
        events,
        skipped,
        input.definition,
      );
    }

    // Deadlines
    const deadlines = state.deadlines.map((d) => {
      if (d.fired || day < d.dueDay) return d;
      const template = input.definition.deadlines.find((t) => t.id === d.id);
      if (!template) {
        skipped.push({ reason: 'missing deadline template', sourceId: d.id });
        return { ...d, fired: true };
      }
      events.push({
        id: `evt.deadline.${d.id}.${day}`,
        kind: 'deadline',
        summaryPlayer: template.visibility === 'gm_only' ? '' : template.summaryPlayer,
        summaryGm: template.summaryGm,
        visibility: template.visibility,
        day,
        sourceId: d.id,
      });
      return { ...d, fired: true };
    });
    state = { ...state, deadlines };

    // Threat max → impending doom once
    state = {
      ...state,
      threats: state.threats.map((threat) => {
        if (threat.value < threat.max || threat.impendingDoomFired) return threat;
        const template = input.definition.threats.find((t) => t.id === threat.id);
        events.push({
          id: `evt.doom.${threat.id}.${day}`,
          kind: 'threat_doom',
          summaryPlayer: template
            ? template.visibility === 'gm_only'
              ? ''
              : template.doomSummaryPlayer
            : `${threat.label} eskaliert`,
          summaryGm: template?.doomSummaryGm ?? `${threat.label} at max (${threat.max})`,
          visibility: threat.visibility,
          day,
          sourceId: threat.id,
        });
        return { ...threat, impendingDoomFired: true };
      }),
    };

    state = runRules(input.definition.rules, state, day, events, skipped, input.definition);
  }

  events.push({
    id: `evt.time.${state.time.day}`,
    kind: 'time',
    summaryPlayer: `Tag ${state.time.day}`,
    summaryGm: `Zeit +${days} → Tag ${state.time.day}`,
    visibility: 'public',
    day: state.time.day,
    sourceId: 'time',
  });

  return {
    nextState: {
      ...state,
      sliceRevision: state.sliceRevision + 1,
    },
    proposedEvents: events,
    skipped,
  };
}
