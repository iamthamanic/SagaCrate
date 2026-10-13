/**
 * speciesSketches — Meshy-generated minimal fashion-sketch line-art per SagaTree Spezies.
 * Style: #94A3B8 (muted-foreground) ink lines on transparent background, simple universal clothing.
 * Location: src/app/character/creation/speciesSketches.ts
 */
import alienSketch from '../../../assets/species/alien.png';
import cyborgSketch from '../../../assets/species/cyborg.png';
import dwarfSketch from '../../../assets/species/dwarf.png';
import elfSketch from '../../../assets/species/elf.png';
import halflingSketch from '../../../assets/species/halfling.png';
import humanSketch from '../../../assets/species/human.png';
import orcSketch from '../../../assets/species/orc.png';

export const speciesSketchSources: Record<string, string> = {
  human: humanSketch,
  elf: elfSketch,
  dwarf: dwarfSketch,
  halfling: halflingSketch,
  orc: orcSketch,
  cyborg: cyborgSketch,
  alien: alienSketch,
};

/** German labels / common aliases → sketch key (race column often stores UI labels). */
const SPECIES_SKETCH_ALIASES: Record<string, string> = {
  mensch: 'human',
  human: 'human',
  elf: 'elf',
  elfin: 'elf',
  zwerg: 'dwarf',
  zwergin: 'dwarf',
  dwarf: 'dwarf',
  halbling: 'halfling',
  halfling: 'halfling',
  ork: 'orc',
  orc: 'orc',
  cyborg: 'cyborg',
  alien: 'alien',
};

export function resolveSpeciesSketchKey(race: string): string {
  const normalized = race.trim().toLowerCase();
  return SPECIES_SKETCH_ALIASES[normalized] ?? normalized;
}

export function getSpeciesSketchUrl(race: string): string {
  const key = resolveSpeciesSketchKey(race);
  return speciesSketchSources[key] ?? humanSketch;
}
