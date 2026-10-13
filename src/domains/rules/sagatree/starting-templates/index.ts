/**
 * starting-templates — public barrel for SagaTree Level-1 start builds (#463).
 * Location: src/domains/rules/sagatree/starting-templates/index.ts
 */

export { sagaTreeStartingTemplates } from './catalog';
export {
  SAGA_TREE_STARTING_TEMPLATE_KEYS,
  isSagaTreeStartingTemplateKey,
  type SagaTreeStartingTemplate,
  type SagaTreeStartingTemplateKey,
  type SagaTreeStartingTemplateSkillBuild,
} from './types';
export {
  getSagaTreeStartingTemplate,
  listSagaTreeStartingTemplates,
  validateSagaTreeStartingTemplate,
  validateSagaTreeStartingTemplateCatalog,
  type SagaTreeStartingTemplateValidation,
} from './validate';
