/**
 * derived-stats types — UI-independent SagaTree derived stat computation contracts.
 * Location: src/domains/rules/sagatree/derived-stats/types.ts
 */
import type { SagaTreeAttributeKey, SagaTreeSkillKey } from '../character-creation';

export type DerivedStatAttributeMap = Record<SagaTreeAttributeKey, number>;
export type DerivedStatSkillRankMap = Record<SagaTreeSkillKey, number>;

export interface DerivedStatTermComputation {
  label: string;
  contribution: number;
  detail?: string;
  active?: boolean;
}

export interface DerivedStatComputation {
  key: string;
  label: string;
  displayValue: string;
  base?: number;
  prefix?: string;
  help?: string;
  footnote?: string;
  terms: DerivedStatTermComputation[];
}

export interface ComputeSagaTreeDerivedStatsInput {
  attributes: DerivedStatAttributeMap;
  finalSkillRanks: DerivedStatSkillRankMap;
  /** Global EB for non-skill-bound formulas (health, resistances). */
  experienceBonus: number;
  /** When set, initiative uses applicable EB from awareness rank at this level. */
  level?: number;
  overloaded: boolean;
}
