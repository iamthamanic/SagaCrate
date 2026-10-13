/**
 * Public barrel for App shell routing foundation (#133 / #276).
 * Location: src/app/shell/routing/index.ts
 */
export {
  knownViewIds,
  normalizeViewId,
  pathForCharacterPublic,
  pathForItemCreateType,
  pathForItemDetail,
  pathForLookCreate,
  pathForLookEdit,
  pathForNpcCreatureCreate,
  pathForNpcCreatureEdit,
  pathForLibraryTab,
  pathForSagaList,
  parseLibraryTabFromPathname,
  parseLibraryTabParam,
  LIBRARY_TAB_PATH_SEGMENTS,
  pathForSagaNew,
  pathForSagaDefinitionCreate,
  pathForSagaDefinitionEdit,
  pathForSagaSection,
  pathForSessionLive,
  pathForSessionPhase,
  pathForView,
  resolvePathname,
  routeToShellView,
  type LibraryTabId,
  type LiveViewId,
  type ResolvedRoute,
  type SagaSectionId,
  type SessionPhaseId,
  type SessionPhaseRouteId,
  type ShellViewId,
} from './routes';
export { setNavigationBlocker, useAppLocation } from './useAppLocation';
