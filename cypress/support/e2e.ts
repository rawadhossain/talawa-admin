// *********************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// *********************

// Import commands.js using ES2015 syntax:
import './commands';
import '@cypress/code-coverage/support';
import {
  aliasGraphQLOperation,
  mockGraphQLOperation,
  mockGraphQLError,
  waitForGraphQLOperation,
} from './graphql-utils';

// Register GraphQL utilities as Cypress commands
Cypress.Commands.add('aliasGraphQLOperation', aliasGraphQLOperation);
Cypress.Commands.add('mockGraphQLOperation', mockGraphQLOperation);
Cypress.Commands.add('mockGraphQLError', mockGraphQLError);
Cypress.Commands.add('waitForGraphQLOperation', waitForGraphQLOperation);

Cypress.on('uncaught:exception', () => {
  return false;
});
