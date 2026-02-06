/**
 * Pipelines Selectors
 *
 * Selectors for pipeline settings page.
 */

export const PipelinesSelectors = {
  // List page
  list: '[data-testid="pipelines-list"]',
  createButton: 'button:has-text("Create pipeline")',

  // Pipeline form
  form: '[data-testid="pipeline-form"]',
  formInputCode: '[data-testid="pipeline-form-input-code"]',
  formInputName: '[data-testid="pipeline-form-input-name"]',
  formTextareaDescription: '[data-testid="pipeline-form-textarea-description"]',
  formButtonSubmit: '[data-testid="pipeline-form-button-submit"]',
  formButtonCancel: '[data-testid="pipeline-form-button-cancel"]',

  // Pipeline item in list
  pipelineItem: (id: string) => `[data-testid="pipeline-item-${id}"]`,
  pipelineItemEdit: (id: string) => `[data-testid="pipeline-item-${id}-edit"]`,
  pipelineItemDelete: (id: string) => `[data-testid="pipeline-item-${id}-delete"]`,
  pipelineItemSetDefault: (id: string) => `[data-testid="pipeline-item-${id}-set-default"]`,

  // Stages page
  stagesList: '[data-testid="stages-list"]',
  addStageButton: 'button:has-text("Add stage")',

  // Stage form
  stageForm: '[data-testid="stage-form"]',
  stageFormInputCode: '[data-testid="stage-form-input-code"]',
  stageFormInputName: '[data-testid="stage-form-input-name"]',
  stageFormInputProbability: '[data-testid="stage-form-input-probability"]',
  stageFormButtonSubmit: '[data-testid="stage-form-button-submit"]',
  stageFormButtonCancel: '[data-testid="stage-form-button-cancel"]',

  // Stage item
  stageItem: (id: string) => `[data-testid="stage-item-${id}"]`,
  stageItemEdit: (id: string) => `[data-testid="stage-item-${id}-edit"]`,
  stageItemDelete: (id: string) => `[data-testid="stage-item-${id}-delete"]`,
  stageItemToggle: (id: string) => `[data-testid="stage-item-${id}-toggle"]`,

  // Navigation
  backToListLink: 'a:has-text("All pipelines")',
} as const;
