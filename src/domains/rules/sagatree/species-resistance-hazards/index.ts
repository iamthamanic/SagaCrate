import {
  isSagaTreeSpeciesTraitOptionKeyForTrait,
  sagaTreeNarrowResistanceHazardOptions,
  type SagaTreeSpeciesTraitOption,
  type SagaTreeSpeciesTraitOptionKey,
} from '../species-trait-options';

export { sagaTreeNarrowResistanceHazardOptions };
export type SagaTreeNarrowResistanceHazardOption = SagaTreeSpeciesTraitOption;
export type SagaTreeNarrowResistanceHazardKey = SagaTreeSpeciesTraitOptionKey;

export function isSagaTreeNarrowResistanceHazardKey(value: string): value is SagaTreeNarrowResistanceHazardKey {
  return isSagaTreeSpeciesTraitOptionKeyForTrait('narrow-resistance', value);
}
