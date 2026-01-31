/**
 * GraphQL interception utilities for Cypress
 *
 * Provides typed, reusable helpers to intercept GraphQL operations
 * by operationName for success and error scenarios.
 */

/**
 * Type for GraphQL response handler
 * - string: fixture path (e.g., 'api/graphql/organizations.success.json')
 * - Record<string, unknown>: inline response object
 * - function: custom handler function that receives the request
 */
export type GqlResponder =
  | string
  | Record<string, unknown>
  | ((req: Cypress.Request) => void);

/**
 * Get the API URL pattern for GraphQL interception
 * Uses Cypress.env('apiUrl') if set, otherwise falls back to wildcard pattern
 */
const getApiPattern = (): string => {
  const apiUrl = Cypress.env('apiUrl');
  return apiUrl || '**/graphql';
};

/**
 * Alias a GraphQL operation for later waiting
 * This sets up an intercept that assigns an alias when the operation matches
 *
 * @param operationName - The GraphQL operation name to alias
 *
 * @example
 * cy.aliasGraphQLOperation('GetOrganizations');
 * cy.visit('/orglist');
 * cy.wait('@GetOrganizations');
 */
export function aliasGraphQLOperation(operationName: string): void {
  const apiPattern = getApiPattern();

  cy.intercept('POST', apiPattern, (req) => {
    if (req.body?.operationName === operationName) {
      req.alias = operationName;
    }
  });
}

/**
 * Wait for a GraphQL operation to complete
 * Use after aliasGraphQLOperation or mockGraphQLOperation
 *
 * @param operationName - The GraphQL operation name to wait for
 * @returns Cypress chainable with the interception object
 *
 * @example
 * cy.aliasGraphQLOperation('GetOrganizations');
 * cy.visit('/orglist');
 * cy.waitForGraphQLOperation('GetOrganizations').then((interception) => {
 *   expect(interception.response?.statusCode).to.equal(200);
 * });
 */
export function waitForGraphQLOperation(
  operationName: string,
): Cypress.Chainable<Cypress.Interception> {
  return cy.wait(`@${operationName}`);
}

/**
 * Mock a GraphQL operation with a custom response
 *
 * @param operationName - The GraphQL operation name to mock
 * @param responder - The response to return:
 *   - string: path to a fixture file
 *   - object: inline response data
 *   - function: custom handler that receives the request
 * @param options - Optional response options (statusCode, headers, etc.)
 *
 * @example
 * // Using a fixture
 * cy.mockGraphQLOperation('GetOrganizations', 'api/graphql/organizations.success.json');
 *
 * // Using inline data
 * cy.mockGraphQLOperation('GetOrganizations', {
 *   data: { organizations: [{ id: '1', name: 'Test Org' }] }
 * });
 *
 * // Using a function
 * cy.mockGraphQLOperation('GetOrganizations', (req) => {
 *   req.reply({ data: { organizations: [] } });
 * });
 */
export function mockGraphQLOperation(
  operationName: string,
  responder: GqlResponder,
  options?: Partial<Cypress.StaticResponse>,
): void {
  const apiPattern = getApiPattern();

  cy.intercept('POST', apiPattern, (req) => {
    if (req.body?.operationName !== operationName) {
      return;
    }

    // Function responder - let the function handle the reply
    if (typeof responder === 'function') {
      return responder(req);
    }

    // String responder - treat as fixture path
    if (typeof responder === 'string') {
      return req.reply({ fixture: responder, ...options });
    }

    // Object responder - use as inline body
    return req.reply({ body: responder, ...options });
  }).as(operationName);
}

/**
 * Mock a GraphQL operation to return an error response
 *
 * @param operationName - The GraphQL operation name to mock
 * @param message - The error message
 * @param code - The error code (default: 'GRAPHQL_ERROR')
 * @param extensions - Additional error extensions
 *
 * @example
 * cy.mockGraphQLError('CreateOrganization', 'Organization name already exists', 'CONFLICT');
 * // Perform create action...
 * cy.contains(/already exists/i).should('be.visible');
 */
export function mockGraphQLError(
  operationName: string,
  message: string,
  code = 'GRAPHQL_ERROR',
  extensions: Record<string, unknown> = {},
): void {
  mockGraphQLOperation(operationName, {
    errors: [
      {
        message,
        extensions: { code, ...extensions },
      },
    ],
  });
}
