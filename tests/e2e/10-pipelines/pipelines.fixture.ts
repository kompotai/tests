/**
 * Pipelines Test Fixtures
 *
 * Provides unique test data generators for pipeline tests.
 */

// Unique identifier for test runs
const TEST_RUN_ID = Date.now();

let pipelineCounter = 0;
let stageCounter = 0;

export function uniquePipelineCode(prefix = 'test'): string {
  return `${prefix}_${TEST_RUN_ID}_${++pipelineCounter}`;
}

export function uniquePipelineName(prefix = 'Test Pipeline'): string {
  return `${prefix} ${TEST_RUN_ID}-${pipelineCounter}`;
}

export function uniqueStageCode(prefix = 'stage'): string {
  return `${prefix}_${TEST_RUN_ID}_${++stageCounter}`;
}

export function uniqueStageName(prefix = 'Test Stage'): string {
  return `${prefix} ${TEST_RUN_ID}-${stageCounter}`;
}

export interface TestPipeline {
  code: string;
  name: string;
  description?: string;
}

export interface TestStage {
  code: string;
  name: string;
  probability?: number;
}

export function createPipeline(overrides: Partial<TestPipeline> = {}): TestPipeline {
  const code = uniquePipelineCode();
  return {
    code,
    name: uniquePipelineName(),
    description: `Test pipeline for E2E testing`,
    ...overrides,
  };
}

export function createStage(overrides: Partial<TestStage> = {}): TestStage {
  const code = uniqueStageCode();
  return {
    code,
    name: uniqueStageName(),
    probability: 50,
    ...overrides,
  };
}

// Default pipeline that exists in megatest workspace
export const DEFAULT_PIPELINE = {
  name: 'Sales',
  code: 'sales',
};

// Default stages in Sales pipeline
export const DEFAULT_STAGES = [
  { name: 'New', code: 'new', probability: 10 },
  { name: 'Reach Out', code: 'reach_out', probability: 25 },
  { name: 'Make Offer', code: 'make_offer', probability: 50 },
  { name: 'Get Payment', code: 'get_payment', probability: 75 },
  { name: 'Won', code: 'won', probability: 100 },
  { name: 'Lost', code: 'lost', probability: 0 },
];
