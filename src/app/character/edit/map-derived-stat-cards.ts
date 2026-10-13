/**
 * map-derived-stat-cards — Maps rules kernel derived stats to UI card props.
 * Location: src/app/character/edit/map-derived-stat-cards.ts
 */
import type { DerivedStatCardProps } from '../../../app/character/shared/DerivedStatCard';
import {
  computeSagaTreeDerivedStats,
  type ComputeSagaTreeDerivedStatsInput,
} from '../../../domains/rules/sagatree/derived-stats';

export function buildSagaTreeDerivedStatCards(input: ComputeSagaTreeDerivedStatsInput): DerivedStatCardProps[] {
  return computeSagaTreeDerivedStats(input).map(({ key: _key, ...card }) => card);
}
