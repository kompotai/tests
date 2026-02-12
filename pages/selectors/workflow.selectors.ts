export const WorkflowSelectors = {
  heading: 'h1:has-text("Workflow")',
  form: '[data-testid="workflow-config-form"]',

  // Entity rows
  entityRow: (entity: string) => `[data-testid="workflow-entity-row-${entity}"]`,
  entityToggle: (entity: string) => `[data-testid="workflow-toggle-${entity}"]`,

  // Structure Preview
  structurePreview: 'text=How entities relate',
} as const;
