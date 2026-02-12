/**
 * Dictionaries Settings Tests
 *
 * Settings → Dictionaries
 *
 * TC-1: List page displays all dictionaries
 * TC-2: Create dictionary
 * TC-3: Edit dictionary name
 * TC-4: Delete dictionary
 * TC-5: Navigate to dictionary detail and see items
 * TC-6: Add item to dictionary
 * TC-7: Edit item in dictionary
 * TC-8: Delete item from dictionary
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { DictionariesPage } from '@pages/DictionariesPage';
import { createTestDictionary, createTestItem } from './dictionaries.fixture';

ownerTest.describe('Dictionaries Settings', () => {
  let dictPage: DictionariesPage;

  ownerTest.beforeEach(async ({ page }) => {
    dictPage = new DictionariesPage(page);
    await dictPage.goto();
  });

  ownerTest('TC-1: list page displays all dictionaries', async () => {
    await dictPage.shouldSeeText('Dictionaries');

    // System dictionaries should be visible
    const expectedDictionaries = [
      'Contact Types',
      'Sources',
      'Job Types',
      'Task Priority',
    ];

    for (const name of expectedDictionaries) {
      await dictPage.shouldSeeDictionary(name);
    }
  });

  ownerTest('TC-2: create dictionary', async () => {
    const data = createTestDictionary();

    await dictPage.createDictionary(data);

    // Verify it appears in the list
    await dictPage.shouldSeeDictionary(data.name);

    // Cleanup
    await dictPage.deleteDictionary(data.name);
  });

  ownerTest('TC-3: edit dictionary name', async () => {
    const data = createTestDictionary();
    await dictPage.createDictionary(data);

    // Edit name to something completely different
    const newName = `Renamed Dict ${Date.now()}`;
    await dictPage.editDictionary(data.name, { name: newName });

    // Verify updated name
    await dictPage.shouldSeeDictionary(newName);

    // Cleanup
    await dictPage.deleteDictionary(newName);
  });

  ownerTest('TC-4: delete dictionary', async () => {
    const data = createTestDictionary();
    await dictPage.createDictionary(data);
    await dictPage.shouldSeeDictionary(data.name);

    // Delete
    await dictPage.deleteDictionary(data.name);

    // Verify removed
    await dictPage.shouldNotSeeDictionary(data.name);
  });

  ownerTest('TC-5: navigate to dictionary detail and see items', async () => {
    // Open existing dictionary by code
    await dictPage.openDictionaryByCode('contact_types');

    // Should see items
    await dictPage.shouldSeeText('Contact Types');
    await dictPage.shouldSeeItem('Client');
    await dictPage.shouldSeeItem('Lead');

    // Go back
    await dictPage.goBackToList();
    await dictPage.shouldSeeDictionary('Contact Types');
  });

  ownerTest('TC-6: add item to dictionary', async () => {
    // Create a test dictionary first
    const dict = createTestDictionary();
    await dictPage.createDictionary(dict);

    // Open it by code
    await dictPage.openDictionaryByCode(dict.code);

    // Add item
    const item = createTestItem();
    await dictPage.addItem(item);

    // Verify item appears
    await dictPage.shouldSeeItem(item.name);

    // Cleanup — go back and delete dictionary
    await dictPage.goBackToList();
    await dictPage.deleteDictionary(dict.name);
  });

  ownerTest('TC-7: edit item in dictionary', async () => {
    // Create dictionary + item
    const dict = createTestDictionary();
    await dictPage.createDictionary(dict);
    await dictPage.openDictionaryByCode(dict.code);

    const item = createTestItem();
    await dictPage.addItem(item);

    // Edit item name
    const newName = `Renamed Item ${Date.now()}`;
    await dictPage.editItem(item.name, { name: newName });

    // Verify updated
    await dictPage.shouldSeeItem(newName);

    // Cleanup
    await dictPage.goBackToList();
    await dictPage.deleteDictionary(dict.name);
  });

  ownerTest('TC-8: delete item from dictionary', async () => {
    // Create dictionary + item
    const dict = createTestDictionary();
    await dictPage.createDictionary(dict);
    await dictPage.openDictionaryByCode(dict.code);

    const item = createTestItem();
    await dictPage.addItem(item);
    await dictPage.shouldSeeItem(item.name);

    // Delete item
    await dictPage.deleteItem(item.name);

    // Verify removed
    await dictPage.shouldNotSeeItem(item.name);

    // Cleanup
    await dictPage.goBackToList();
    await dictPage.deleteDictionary(dict.name);
  });
});
