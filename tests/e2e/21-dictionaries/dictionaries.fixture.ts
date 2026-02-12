/**
 * Dictionaries test data
 */

const TEST_RUN_ID = Date.now();
let dictionaryCounter = 0;

export function uniqueCode(prefix = 'test_dict'): string {
  dictionaryCounter++;
  return `${prefix}_${TEST_RUN_ID}_${dictionaryCounter}`;
}

export function uniqueName(prefix = 'Test Dict'): string {
  dictionaryCounter++;
  return `${prefix} ${TEST_RUN_ID}-${dictionaryCounter}`;
}

export function createTestDictionary() {
  const id = `${TEST_RUN_ID}_${++dictionaryCounter}`;
  return {
    code: `test_dict_${id}`,
    name: `Test Dictionary ${id}`,
    description: `Auto-test dictionary ${id}`,
  };
}

export function createTestItem(prefix = 'item') {
  const id = `${TEST_RUN_ID}_${++dictionaryCounter}`;
  return {
    code: `${prefix}_${id}`,
    name: `Test ${prefix} ${id}`,
  };
}
