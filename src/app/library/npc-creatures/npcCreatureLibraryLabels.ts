/**
 * npcCreatureLibraryLabels — German copy for Library NPCs & Kreaturen (#197).
 * Location: src/app/library/npc-creatures/npcCreatureLibraryLabels.ts
 */
import type {
  LibraryNpcCreatureSource,
  NpcCreatureCategory,
  NpcCreatureKind,
  NpcCreatureSheetMode,
} from '../../../domains/npc-creature';
import type {
  SagaTreeCombatProfile,
  SagaTreeCombatRole,
  SagaTreeMachtgrad,
} from '../../../domains/rules/sagatree/npc-creature-power';

export const NPC_CREATURE_KIND_LABELS: Record<NpcCreatureKind, string> = {
  npc: 'NPC',
  creature: 'Kreatur',
};

export const NPC_CREATURE_CATEGORY_LABELS: Record<NpcCreatureCategory, string> = {
  npc: 'NPC',
  tier: 'Tier',
  kreatur: 'Kreatur',
  konstrukt: 'Konstrukt',
  untot: 'Untot',
  geist: 'Geist',
  sonstige: 'Sonstige',
};

export const NPC_CREATURE_SHEET_MODE_LABELS: Record<NpcCreatureSheetMode, string> = {
  compact: 'Statblock',
  full: 'Charakterbogen',
};

export const LIBRARY_NPC_SOURCE_LABELS: Record<LibraryNpcCreatureSource, string> = {
  core: 'Core',
  pack: 'Pack',
  personal: 'Eigen',
  world: 'Welt',
};

export const NPC_COMBAT_ROLE_LABELS: Record<SagaTreeCombatRole, string> = {
  standard: 'Standard',
  elite: 'Elite',
  boss: 'Boss',
};

export const NPC_COMBAT_PROFILE_LABELS: Record<SagaTreeCombatProfile, string> = {
  noncombat: 'Nichtkämpferisch',
  balanced: 'Ausgewogen',
  tough: 'Zäh',
  offensive: 'Offensiv',
  mobile: 'Mobil',
  ranged: 'Fernkampf',
  control_support: 'Kontrolle & Support',
};

export const NPC_MACHTGRAD_LABELS: Record<SagaTreeMachtgrad, string> = {
  gering: 'Gering',
  mittel: 'Mittel',
  hoch: 'Hoch',
  extrem: 'Extrem',
  legendaer: 'Legendär',
};

export const NPC_ATTRIBUTE_SHORT_LABELS = [
  'STÄ',
  'GES',
  'AUS',
  'VER',
  'WAH',
  'CHA',
] as const;

export const NPC_CREATURE_LIBRARY_VIEW_MODE_STORAGE_KEY =
  'sagatree_library_npc_creatures_view_mode';

/** Card combat meta: Nichtkämpferisch or Kampfrolle · Kampfprofil. */
export function formatNpcCombatMetaLine(
  combatProfile: SagaTreeCombatProfile,
  combatRole: SagaTreeCombatRole,
): string {
  if (combatProfile === 'noncombat') return NPC_COMBAT_PROFILE_LABELS.noncombat;
  return `${NPC_COMBAT_ROLE_LABELS[combatRole]} · ${NPC_COMBAT_PROFILE_LABELS[combatProfile]}`;
}

/** Stufe N · Machtgrad X */
export function formatNpcLevelMachtgradLine(
  level: number,
  machtgradLabel: string,
): string {
  return `Stufe ${level} · Machtgrad ${machtgradLabel}`;
}
