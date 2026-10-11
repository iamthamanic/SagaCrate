/**
 * saga-editor-sections — Section nav for Saga Editor v1 (#575).
 * Location: src/app/saga/editor/saga-editor-sections.ts
 */

export type SagaEditorSectionId = 'general' | 'locations' | 'secrets' | 'pregens';

export type SagaEditorNavItem = {
  readonly id: SagaEditorSectionId;
  readonly labelDe: string;
};

export const SAGA_EDITOR_NAV: readonly SagaEditorNavItem[] = [
  { id: 'general', labelDe: 'Allgemein' },
  { id: 'locations', labelDe: 'Orte' },
  { id: 'secrets', labelDe: 'Geheimnisse' },
  { id: 'pregens', labelDe: 'Pregens' },
];
