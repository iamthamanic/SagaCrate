/**
 * library area — public API for other app areas.
 * Location: src/app/library/index.ts
 *
 * The Library screen mounts via `./root` (composition root only) so this barrel
 * stays free of the screen — items/workbench imports labels from here without cycles.
 */
export { ItemLibraryBrowser, useItemLibrary } from './items';
export type { UseItemLibraryOptions, UseItemLibraryResult } from './items';
export * from './items/itemLibraryLabels';
export {
  NpcCreatureLibraryBrowser,
  useNpcCreatureLibrary,
  NpcCreatureStatblockView,
  NpcCreatureStatblockPanel,
} from './npc-creatures';
export type {
  UseNpcCreatureLibraryOptions,
  UseNpcCreatureLibraryResult,
} from './npc-creatures';
export * from './npc-creatures/npcCreatureLibraryLabels';

/** Shared browse chrome — saga hub sessions reuse the same Liste/Grid/Karussell shell. */
export {
  EntityBrowser,
  type EntityBrowserRenderContext,
  type EntityBrowserViewMode,
} from './EntityBrowser';
export {
  EntityBrowserCard,
  type EntityBrowserChip,
  type EntityBrowserChipTone,
} from './EntityBrowserCard';
export {
  EntityBrowserCornerMenuTrigger,
  EntityBrowserCornerMenuPortal,
  type EntityBrowserCornerMenuItem,
  type EntityBrowserCornerMenuAnchor,
} from './EntityBrowserCornerMenu';
export { useLibraryCornerMenu } from './useLibraryCornerMenu';
export { LibraryViewModeToggle } from './LibraryViewModeToggle';
export { useLibraryViewMode, type LibraryViewMode } from './useLibraryViewMode';
