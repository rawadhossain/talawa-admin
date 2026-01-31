/**
 * Example tests demonstrating GraphQL interception utilities
 *
 * These examples show how to use the GraphQL utilities for:
 * - Mocking successful queries with fixtures
 * - Mocking successful queries with inline data
 * - Mocking GraphQL errors
 * - Using alias + wait patterns
 */

describe('GraphQL Utilities Examples', () => {
  describe('Mocking successful queries', () => {
    it('mocks a query using a fixture file', () => {
      // Mock the GetOrganizations query with a fixture
      cy.mockGraphQLOperation(
        'GetOrganizations',
        'api/graphql/organizations.success.json',
      );

      // Visit the page that triggers the query
      cy.visit('/admin/orglist');

      // Wait for the mocked operation to complete
      cy.waitForGraphQLOperation('GetOrganizations');

      // Verify the mocked data is displayed
      cy.contains('Example Org').should('be.visible');
    });

    it('mocks a query using inline data', () => {
      // Mock with inline response data
      cy.mockGraphQLOperation('GetOrganizations', {
        data: {
          organizations: [
            {
              id: 'inline-org-1',
              name: 'Inline Test Organization',
              description: 'Created with inline mock data',
            },
          ],
        },
      });

      cy.visit('/admin/orglist');
      cy.waitForGraphQLOperation('GetOrganizations');

      // Verify inline mock data is displayed
      cy.contains('Inline Test Organization').should('be.visible');
    });

    it('mocks a query using a function handler', () => {
      // Mock with a custom function for dynamic responses
      cy.mockGraphQLOperation('GetOrganizations', (req) => {
        // Access request data if needed
        const variables = req.body?.variables;

        req.reply({
          body: {
            data: {
              organizations: [
                {
                  id: 'dynamic-org',
                  name: `Dynamic Org (requested: ${variables?.first || 'all'})`,
                  description: 'Created dynamically based on request',
                },
              ],
            },
          },
        });
      });

      cy.visit('/admin/orglist');
      cy.waitForGraphQLOperation('GetOrganizations');
    });
  });

  describe('Mocking errors', () => {
    it('mocks a GraphQL error response', () => {
      // Mock CreateOrganization to return an error
      cy.mockGraphQLError(
        'CreateOrganization',
        'Organization name already exists',
        'CONFLICT',
      );

      // Navigate to create organization (adjust path as needed)
      cy.visit('/admin/orglist');

      // The error message should be handled by the UI
      // This is a demonstration - actual assertions depend on the UI
    });

    it('mocks an error with custom extensions', () => {
      cy.mockGraphQLError(
        'UpdateOrganization',
        'Validation failed',
        'VALIDATION_ERROR',
        {
          field: 'name',
          constraint: 'minLength',
          requiredLength: 3,
        },
      );

      // Navigate and trigger the operation
      cy.visit('/admin/orglist');
    });
  });

  describe('Alias and wait patterns', () => {
    it('uses alias to wait for an operation without mocking', () => {
      // Just alias the operation without mocking the response
      // This is useful when you want to test with real API responses
      // but need to wait for specific operations
      cy.aliasGraphQLOperation('GetOrganizations');

      cy.visit('/admin/orglist');

      // Wait for the real API response
      cy.waitForGraphQLOperation('GetOrganizations').then((interception) => {
        // Assert on the real response
        expect(interception.response?.statusCode).to.equal(200);

        // Access response body for assertions
        const body = interception.response?.body;
        expect(body).to.have.property('data');
      });
    });

    it('chains multiple operation waits', () => {
      // Alias multiple operations
      cy.aliasGraphQLOperation('GetCurrentUser');
      cy.aliasGraphQLOperation('GetOrganizations');

      cy.visit('/admin/orglist');

      // Wait for operations in order they should complete
      cy.waitForGraphQLOperation('GetCurrentUser');
      cy.waitForGraphQLOperation('GetOrganizations');

      // Continue with assertions after both complete
      cy.get('[data-testid="org-list"]').should('exist');
    });
  });

  describe('Combined patterns', () => {
    it('mocks one query while aliasing another', () => {
      // Mock one operation
      cy.mockGraphQLOperation('GetOrganizations', {
        data: {
          organizations: [{ id: '1', name: 'Mocked Org' }],
        },
      });

      // Alias another operation to capture real response
      cy.aliasGraphQLOperation('GetCurrentUser');

      cy.visit('/admin/orglist');

      // Wait for both
      cy.waitForGraphQLOperation('GetCurrentUser');
      cy.waitForGraphQLOperation('GetOrganizations');

      // Mocked data should be visible
      cy.contains('Mocked Org').should('be.visible');
    });
  });
});
