/**
 * Regression test for Issue #158
 * Projects should appear in contact related data
 *
 * Bug: Projects were not displayed on the Contact details page
 * Fix: Added ProjectModel and queries to getContactRelatedData function
 *
 * @see https://github.com/kompotai/bug-reports/issues/158
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';

ownerTest.describe('Issue #158: Projects in Contact Related Data', { tag: ['@regression'] }, () => {
  ownerTest('contact related data includes projects @regression', async ({ request }) => {
    // Create a test contact
    const contactResponse = await request.post('/api/contacts', {
      data: {
        name: `Test Contact #158 - ${Date.now()}`,
      },
    });
    expect(contactResponse.status()).toBe(201);
    const contact = await contactResponse.json();
    const contactId = contact.id;

    try {
      // Create a project linked to this contact
      const projectResponse = await request.post('/api/projects', {
        data: {
          name: 'Test Project for Issue #158',
          contactId: contactId,
          status: 'active',
        },
      });
      expect(projectResponse.status()).toBe(201);
      const project = await projectResponse.json();
      const projectId = project.id;

      try {
        // Fetch contact related data
        const relatedResponse = await request.get(`/api/contacts/${contactId}/related-counts`);
        expect(relatedResponse.status()).toBe(200);

        const relatedData = await relatedResponse.json();

        // Verify projects are included in the response
        expect(relatedData.documents).toHaveProperty('projects');
        expect(relatedData.documents.projects).toHaveProperty('count');
        expect(relatedData.documents.projects).toHaveProperty('items');

        // Verify our test project is in the list
        expect(relatedData.documents.projects.count).toBeGreaterThanOrEqual(1);

        const projectItems = relatedData.documents.projects.items;
        const ourProject = projectItems.find((p: { id: string }) => p.id === projectId);
        expect(ourProject).toBeDefined();
        expect(ourProject.name).toBe('Test Project for Issue #158');

        // Verify total includes projects count
        const projectsCount = relatedData.documents.projects.count;
        expect(relatedData.documents.total).toBeGreaterThanOrEqual(projectsCount);
      } finally {
        // Cleanup project
        await request.delete(`/api/projects/${projectId}`);
      }
    } finally {
      // Cleanup contact
      await request.delete(`/api/contacts/${contactId}`);
    }
  });
});
