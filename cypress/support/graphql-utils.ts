/// <reference types="cypress" />

/**
 * GraphQL interception utilities for Cypress
 *
 * Provides typed, reusable helpers to intercept GraphQL operations
 * by operationName for success and error scenarios.
 */

/**
 * Type for GraphQL response handler:
 * - string: fixture path
 * - object: inline response data
 * - function: custom handler that receives the request
 */
export type GqlResponder =
  | string
  | Record<string, unknown>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | ((req: any) => void);

/**
 * Get the API URL pattern for GraphQL interception.
 * Uses Cypress.env apiUrl if set, otherwise falls back to wildcard pattern.
 */
const getApiPattern = (): string => {
  const apiUrl = Cypress.env('apiUrl');
  return apiUrl || '**/graphql';
};

/**
 * Alias a GraphQL operation for later waiting.
 * This sets up an intercept that assigns an alias when the operation matches.
 *
 * @param operationName - The GraphQL operation name to alias
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
 * Wait for a GraphQL operation to complete.
 * Use after aliasGraphQLOperation or mockGraphQLOperation.
 *
 * @param operationName - The GraphQL operation name to wait for
 * @returns Cypress chainable with the interception object
 */
export function waitForGraphQLOperation(operationName: string) {
  return cy.wait(`@${operationName}`);
}

/**
 * Mock a GraphQL operation with a custom response.
 *
 * The responder can be:
 * - A string path to a fixture file
 * - An inline response object
 * - A function that receives the request and handles the reply
 *
 * @param operationName - The GraphQL operation name to mock
 * @param responder - The response: fixture path, inline object, or handler function
 * @param options - Optional response options like statusCode and headers
 */
export function mockGraphQLOperation(
  operationName: string,
  responder: GqlResponder,
  options?: Record<string, unknown>,
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
 * Mock a GraphQL operation to return an error response.
 *
 * @param operationName - The GraphQL operation name to mock
 * @param message - The error message
 * @param code - The error code, defaults to GRAPHQL_ERROR
 * @param extensions - Additional error extensions
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
