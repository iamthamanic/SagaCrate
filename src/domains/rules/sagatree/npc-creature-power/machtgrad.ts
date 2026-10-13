/**
 * Machtgrad display mapping from level 1–20.
 * Location: src/domains/rules/sagatree/npc-creature-power/machtgrad.ts
 */
import type { SagaTreeMachtgrad, SagaTreeNpcLevel } from './types';

export const SAGATREE_MACHTGRAD_LABELS: Record<SagaTreeMachtgrad, string> = {
  gering: 'Gering',
  mittel: 'Mittel',
  hoch: 'Hoch',
  extrem: 'Extrem',
  legendaer: 'Legendär',
};

export function isSagaTreeNpcLevel(level: number): level is SagaTreeNpcLevel {
  return Number.isInteger(level) && level >= 1 && level <= 20;
}

export function assertSagaTreeNpcLevel(level: number): SagaTreeNpcLevel {
  if (!isSagaTreeNpcLevel(level)) {
    throw new Error(`NPC/Kreatur-Stufe muss 1–20 sein (erhalten: ${String(level)})`);
  }
  return level;
}

export function machtgradForLevel(level: number): SagaTreeMachtgrad {
  const lv = assertSagaTreeNpcLevel(level);
  if (lv <= 4) return 'gering';
  if (lv <= 8) return 'mittel';
  if (lv <= 12) return 'hoch';
  if (lv <= 16) return 'extrem';
  return 'legendaer';
}

export function machtgradLabelForLevel(level: number): string {
  return SAGATREE_MACHTGRAD_LABELS[machtgradForLevel(level)];
}
