/**
 * saga-editor-sections — Section nav for Saga Editor (#575 / #579).
 * Location: src/app/saga/editor/saga-editor-sections.ts
 */

export type SagaEditorSectionId =
  | 'general'
  | 'locations'
  | 'secrets'
  | 'pregens'
  | 'threats'
  | 'deadlines'
  | 'rules'
  | 'factions';

export type SagaEditorNavItem = {
  readonly id: SagaEditorSectionId;
  readonly labelDe: string;
};

export const SAGA_EDITOR_NAV: readonly SagaEditorNavItem[] = [
  { id: 'general', labelDe: 'Allgemein' },
  { id: 'locations', labelDe: 'Orte' },
  { id: 'secrets', labelDe: 'Geheimnisse' },
  { id: 'pregens', labelDe: 'Pregens' },
  { id: 'threats', labelDe: 'Bedrohungen' },
  { id: 'deadlines', labelDe: 'Fristen' },
  { id: 'rules', labelDe: 'Regeln' },
  { id: 'factions', labelDe: 'Fraktionen' },
];
