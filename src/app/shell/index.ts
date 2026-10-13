/**
 * shell area — public API for other app areas and the composition root.
 * Location: src/app/shell/index.ts
 */
export { AuthGate } from './auth/AuthGate';
export { Layout } from './Layout';
export { SagaTreeLogo } from './SagaTreeLogo';
export { ViewLoadingFallback } from './ViewLoadingFallback';
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
  setNavigationBlocker,
  useAppLocation,
  type LibraryTabId,
  type LiveViewId,
  type ResolvedRoute,
  type SagaSectionId,
  type SessionPhaseId,
  type SessionPhaseRouteId,
  type ShellViewId,
} from './routing';
